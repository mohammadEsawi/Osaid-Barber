import { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, Calendar, Scissors, Users, Package, ShoppingBag, BarChart3, Settings, Search, Filter, Eye, Plus, Trash2, MessageSquare, Clock, ChevronLeft, ChevronRight, Archive } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import TimeSlotPicker from '../../components/booking/TimeSlotPicker';
import { FormInput, FormTextarea } from '../../components/ui/FormInput';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi, servicesApi, barbersApi } from '../../services/api';
import { Appointment, AppointmentStatus, STATUS_LABELS, Service, BarberProfile, TimeSlot } from '../../types';
import { formatTimeArabic, formatDate, localTodayStr, validatePhone } from '../../utils/helpers';
import toast from 'react-hot-toast';

const adminNav = [
  { href: '/admin', label: 'الرئيسية', icon: <LayoutDashboard size={18} /> },
  { href: '/admin/bookings', label: 'المواعيد', icon: <Calendar size={18} /> },
  { href: '/admin/archive', label: 'الأرشيف', icon: <Archive size={18} /> },
  { href: '/admin/services', label: 'الخدمات', icon: <Scissors size={18} /> },
  { href: '/admin/barbers', label: 'الحلاقون', icon: <Users size={18} /> },
  { href: '/admin/availability', label: 'أوقات العمل', icon: <Clock size={18} /> },
  { href: '/admin/products', label: 'المنتجات', icon: <Package size={18} /> },
  { href: '/admin/orders', label: 'الطلبات', icon: <ShoppingBag size={18} /> },
  { href: '/admin/customers', label: 'العملاء', icon: <Users size={18} /> },
  { href: '/admin/reports', label: 'التقارير', icon: <BarChart3 size={18} /> },
  { href: '/admin/messages', label: 'الرسائل', icon: <MessageSquare size={18} /> },
  { href: '/admin/settings', label: 'الإعدادات', icon: <Settings size={18} /> },
];

const emptyNewForm = {
  customer_name: '',
  customer_phone: '',
  barber_id: 0,
  appointment_date: '',
  service_ids: [] as number[],
  notes: '',
  start_time: '',
};

export default function AdminBookings() {
  const [filters, setFilters] = useState({ status: '', date: '' });
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState(emptyNewForm);
  const [adminSlots, setAdminSlots] = useState<TimeSlot[]>([]);
  const [adminSlotsLoading, setAdminSlotsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => appointmentsApi.getAll({
      status: filters.status || undefined,
      date: filters.date || undefined,
      exclude_status: filters.status ? undefined : 'completed',
    }),
  });
  const appointments: Appointment[] = data?.data?.data || [];

  // Separate query for day navigator — always all dates, no date filter
  const [navIdx, setNavIdx] = useState(0);
  const { data: navData } = useQuery({
    queryKey: ['appointments-nav', filters.status],
    queryFn: () => appointmentsApi.getAll({
      status: filters.status || undefined,
      exclude_status: filters.status ? undefined : 'completed',
    }),
    staleTime: 60 * 1000,
  });
  const allForNav: Appointment[] = navData?.data?.data || [];

  const dateGroups = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const a of allForNav) {
      const d = (a.appointment_date || '').substring(0, 10);
      if (!map[d]) map[d] = [];
      map[d].push(a);
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, appts]) => ({ date, appts }));
  }, [allForNav]);

  // Sync navIdx when filters.date changes from the date input
  useEffect(() => {
    if (filters.date) {
      const idx = dateGroups.findIndex(g => g.date === filters.date);
      if (idx >= 0) setNavIdx(idx);
    }
  }, [filters.date, dateGroups]);

  const goDay = (dir: -1 | 1) => {
    const newIdx = Math.max(0, Math.min(dateGroups.length - 1, navIdx + dir));
    setNavIdx(newIdx);
    setFilters(f => ({ ...f, date: dateGroups[newIdx]?.date || '' }));
  };

  const activeGroup = dateGroups[navIdx];

  const { data: servicesData } = useQuery({ queryKey: ['services-all'], queryFn: () => servicesApi.getAll() });
  const { data: barbersData } = useQuery({ queryKey: ['barbers-all'], queryFn: () => barbersApi.getAll() });
  const allServices: Service[] = servicesData?.data?.data || [];
  const allBarbers: BarberProfile[] = barbersData?.data?.data || [];

  const newFormDuration = allServices
    .filter(s => newForm.service_ids.includes(s.id))
    .reduce((sum, s) => sum + s.duration_minutes, 0);

  useEffect(() => {
    if (!showNewModal) return;
    if (newForm.barber_id && newForm.appointment_date && newFormDuration > 0) {
      setAdminSlotsLoading(true);
      setNewForm(f => ({ ...f, start_time: '' }));
      appointmentsApi.checkAvailability(newForm.barber_id, newForm.appointment_date, newFormDuration)
        .then(res => setAdminSlots(res.data.data || []))
        .catch(() => setAdminSlots([]))
        .finally(() => setAdminSlotsLoading(false));
    } else {
      setAdminSlots([]);
    }
  }, [newForm.barber_id, newForm.appointment_date, newFormDuration, showNewModal]);

  const toggleNewService = (id: number) => {
    setNewForm(f => ({
      ...f,
      service_ids: f.service_ids.includes(id) ? f.service_ids.filter(x => x !== id) : [...f.service_ids, id],
    }));
  };

  const handleCreate = async () => {
    if (!newForm.customer_name || !newForm.customer_phone || !newForm.barber_id || !newForm.appointment_date || !newForm.start_time || newForm.service_ids.length === 0) {
      toast.error('يرجى تعبئة جميع الحقول المطلوبة واختيار وقت');
      return;
    }
    const phoneErr = validatePhone(newForm.customer_phone);
    if (phoneErr) { toast.error(phoneErr); return; }
    setIsCreating(true);
    try {
      await appointmentsApi.create(newForm);
      toast.success('تم إنشاء الموعد بنجاح');
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['appointments-nav'] });
      setShowNewModal(false);
      setNewForm(emptyNewForm);
      setAdminSlots([]);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'فشل إنشاء الموعد');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الموعد؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    setIsDeleting(true);
    try {
      await appointmentsApi.delete(id);
      toast.success('تم حذف الموعد بنجاح');
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['appointments-nav'] });
      setSelected(null);
    } catch {
      toast.error('فشل حذف الموعد');
    } finally {
      setIsDeleting(false);
    }
  };

  const updateStatus = async (id: number, status: AppointmentStatus) => {
    try {
      await appointmentsApi.updateStatus(id, status);
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['appointments-nav'] });
      qc.invalidateQueries({ queryKey: ['appointments-archive'] });
      if (status === 'completed') {
        toast.success('تم إكمال الموعد ونقله إلى الأرشيف');
        setSelected(null);
      } else {
        toast.success('تم تحديث الحالة');
        setSelected(prev => prev ? { ...prev, status } : null);
      }
    } catch {
      toast.error('فشل تحديث الحالة');
    }
  };

  const minDate = localTodayStr();

  const columns = [
    { header: '#', accessor: 'id' as keyof Appointment, width: 'w-12' },
    { header: 'العميل', render: (r: Appointment) => <div><div className="text-white font-medium">{r.customer_name}</div><div className="text-zinc-400 text-xs">{r.customer_phone}</div></div> },
    { header: 'الحلاق', accessor: 'barber_name' as keyof Appointment },
    { header: 'التاريخ والوقت', render: (r: Appointment) => <div><div className="text-white text-sm">{formatDate(r.appointment_date)}</div><div className="text-amber-400 text-xs">{formatTimeArabic(r.start_time)}</div></div> },
    { header: 'المبلغ', render: (r: Appointment) => <span className="text-amber-500 font-bold">{r.total_price} ₪</span> },
    { header: 'الحالة', render: (r: Appointment) => <StatusBadge status={r.status} /> },
    {
      header: 'إجراءات',
      render: (r: Appointment) => (
        <button onClick={() => setSelected(r)} className="text-amber-500 hover:text-amber-400 p-1">
          <Eye size={16} />
        </button>
      )
    },
  ];

  return (
    <DashboardLayout navItems={adminNav} title="إدارة المواعيد">
      <div className="space-y-4 page-enter">
        {/* Filters + New button */}
        <div className="card flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input type="date" value={filters.date} onChange={e => setFilters(f => ({ ...f, date: e.target.value }))} className="input-field pr-9" />
          </div>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="input-field w-48">
            <option value="">جميع الحالات</option>
            {Object.entries(STATUS_LABELS).filter(([k]) => k !== 'completed').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={() => setFilters({ status: '', date: '' })} className="btn-ghost flex items-center gap-2">
            <Filter size={16} />
            إعادة تعيين
          </button>
          <button onClick={() => setShowNewModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            حجز جديد
          </button>
        </div>

        {/* Day navigator */}
        {dateGroups.length > 0 && activeGroup && (
          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => goDay(1)}
                disabled={navIdx >= dateGroups.length - 1}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 transition-colors shrink-0"
              >
                <ChevronLeft size={16} className="text-zinc-400" />
              </button>
              <div className="flex-1 text-center">
                <span className="text-zinc-400 text-sm">المواعيد — </span>
                <span className="text-white font-bold text-sm">{formatDate(activeGroup.date)}</span>
                <span className="text-amber-500 font-bold text-sm"> ({activeGroup.appts.length})</span>
              </div>
              <button
                onClick={() => goDay(-1)}
                disabled={navIdx <= 0}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 transition-colors shrink-0"
              >
                <ChevronRight size={16} className="text-zinc-400" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeGroup.appts.map(appt => (
                <button
                  key={appt.id}
                  onClick={() => setSelected(appt)}
                  className="flex flex-col items-end bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500/50 rounded-xl px-3 py-2 text-right transition-all"
                >
                  <span className="text-white text-sm font-medium">{appt.customer_name}</span>
                  <span className="text-amber-400 text-xs">{formatTimeArabic(appt.start_time)}</span>
                  <span className="text-zinc-500 text-xs">{appt.barber_name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="font-bold text-white">المواعيد ({appointments.length})</h2>
          </div>
          <DataTable<Appointment> columns={columns} data={appointments} isLoading={isLoading} emptyMessage="لا توجد مواعيد" />
        </div>
      </div>

      {/* New booking modal */}
      <Modal isOpen={showNewModal} onClose={() => { setShowNewModal(false); setNewForm(emptyNewForm); setAdminSlots([]); }} title="حجز موعد جديد" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormInput
              label="اسم العميل"
              value={newForm.customer_name}
              onChange={e => setNewForm(f => ({ ...f, customer_name: e.target.value }))}
              placeholder="الاسم الكامل"
              required
            />
            <FormInput
              label="رقم الهاتف"
              type="tel"
              value={newForm.customer_phone}
              onChange={e => setNewForm(f => ({ ...f, customer_phone: e.target.value }))}
              placeholder="+972xxxxxxxxx"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">الحلاق</label>
            <select
              value={newForm.barber_id}
              onChange={e => setNewForm(f => ({ ...f, barber_id: parseInt(e.target.value) }))}
              className="input-field"
            >
              <option value={0}>اختر حلاقاً...</option>
              {allBarbers.map(b => <option key={b.id} value={b.id}>{b.full_name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">الخدمات</label>
            <div className="grid grid-cols-2 gap-2">
              {allServices.map(s => (
                <label key={s.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${newForm.service_ids.includes(s.id) ? 'border-amber-500 bg-amber-500/10 text-white' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}>
                  <input
                    type="checkbox"
                    checked={newForm.service_ids.includes(s.id)}
                    onChange={() => toggleNewService(s.id)}
                    className="accent-amber-500"
                  />
                  <span className="text-sm">{s.name} — {s.price} ₪</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">التاريخ</label>
            <input
              type="date"
              min={minDate}
              value={newForm.appointment_date}
              onChange={e => setNewForm(f => ({ ...f, appointment_date: e.target.value }))}
              className="input-field max-w-xs"
            />
          </div>

          {newForm.barber_id > 0 && newForm.appointment_date && newFormDuration > 0 && (
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">الوقت</label>
              <TimeSlotPicker
                slots={adminSlots}
                selected={newForm.start_time}
                onSelect={t => setNewForm(f => ({ ...f, start_time: t }))}
                isLoading={adminSlotsLoading}
                date={newForm.appointment_date}
              />
            </div>
          )}

          <FormTextarea
            label="ملاحظات (اختياري)"
            value={newForm.notes}
            onChange={e => setNewForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="أي ملاحظات خاصة..."
            rows={2}
          />

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowNewModal(false); setNewForm(emptyNewForm); setAdminSlots([]); }} className="btn-ghost">إلغاء</button>
            <button onClick={handleCreate} disabled={isCreating} className="btn-primary flex items-center gap-2">
              {isCreating ? <><LoadingSpinner size="sm" /> جاري الحجز...</> : 'تأكيد الحجز'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`تفاصيل الموعد #${selected?.id}`} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-zinc-400">العميل: </span><span className="text-white">{selected.customer_name}</span></div>
              <div><span className="text-zinc-400">الهاتف: </span><span className="text-white">{selected.customer_phone}</span></div>
              <div><span className="text-zinc-400">الحلاق: </span><span className="text-white">{selected.barber_name}</span></div>
              <div><span className="text-zinc-400">التاريخ: </span><span className="text-white">{formatDate(selected.appointment_date)}</span></div>
              <div><span className="text-zinc-400">الوقت: </span><span className="text-white">{formatTimeArabic(selected.start_time)} - {formatTimeArabic(selected.end_time)}</span></div>
              <div><span className="text-zinc-400">المبلغ: </span><span className="text-amber-500 font-bold">{selected.total_price} ₪</span></div>
            </div>
            {selected.services?.length > 0 && (
              <div>
                <div className="text-zinc-400 text-sm mb-2">الخدمات:</div>
                <div className="flex flex-wrap gap-2">
                  {selected.services.map(s => <span key={s.id} className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded-full">{s.name} - {s.price} ₪</span>)}
                </div>
              </div>
            )}
            {selected.notes && <div><span className="text-zinc-400 text-sm">ملاحظات: </span><span className="text-zinc-300 text-sm">{selected.notes}</span></div>}

            <div className="pt-4 border-t border-zinc-800">
              <div className="text-zinc-400 text-sm mb-2">تغيير الحالة:</div>
              <div className="flex flex-wrap gap-2">
                {(['pending', 'confirmed', 'completed', 'cancelled', 'no_show'] as AppointmentStatus[]).map(s => (
                  <button key={s} onClick={() => updateStatus(selected.id, s)} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${selected.status === s ? 'bg-amber-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => handleDelete(selected.id)}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-950/60 text-red-400 hover:bg-red-900/60 hover:text-red-300 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isDeleting ? <LoadingSpinner size="sm" /> : <Trash2 size={15} />}
                حذف الموعد
              </button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
