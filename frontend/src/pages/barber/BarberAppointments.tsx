import { useState } from 'react';
import { LayoutDashboard, Calendar, Clock, Settings, Filter , User } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '../../services/api';
import { Appointment, AppointmentStatus, STATUS_LABELS } from '../../types';
import { formatDate, formatTimeArabic } from '../../utils/helpers';
import toast from 'react-hot-toast';

const barberNav = [
  { href: '/barber', label: 'لوحة التحكم', icon: <LayoutDashboard size={18} /> },
  { href: '/barber/appointments', label: 'المواعيد', icon: <Calendar size={18} /> },
  { href: '/barber/calendar', label: 'التقويم', icon: <Clock size={18} /> },
  { href: '/barber/availability', label: 'أوقات العمل', icon: <Settings size={18} /> },
  { href: '/barber/profile', label: 'ملفي الشخصي', icon: <User size={18} /> },
];

export default function BarberAppointments() {
  const [filters, setFilters] = useState({ status: '', date: '' });
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [notes, setNotes] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['barber-appointments', filters],
    queryFn: () => appointmentsApi.getAll({ status: filters.status || undefined, date: filters.date || undefined }),
  });
  const appointments: Appointment[] = data?.data?.data || [];

  const updateStatus = async (id: number, status: AppointmentStatus) => {
    try {
      await appointmentsApi.updateStatus(id, status, notes);
      toast.success('تم تحديث الحالة');
      qc.invalidateQueries({ queryKey: ['barber-appointments'] });
      setSelected(prev => prev ? { ...prev, status, notes: notes || prev.notes } : null);
    } catch { toast.error('فشل تحديث الحالة'); }
  };

  const columns = [
    { header: 'العميل', render: (r: Appointment) => <div><div className="text-white font-medium">{r.customer_name}</div><div className="text-zinc-400 text-xs">{r.customer_phone}</div></div> },
    { header: 'التاريخ والوقت', render: (r: Appointment) => <div><div className="text-zinc-300 text-sm">{formatDate(r.appointment_date)}</div><div className="text-amber-500 text-xs font-medium">{formatTimeArabic(r.start_time)}</div></div> },
    { header: 'المدة', render: (r: Appointment) => <span>{r.total_duration} دقيقة</span> },
    { header: 'المبلغ', render: (r: Appointment) => <span className="text-amber-500 font-bold">{r.total_price} ₪</span> },
    { header: 'الحالة', render: (r: Appointment) => <StatusBadge status={r.status} /> },
    { header: 'إجراءات', render: (r: Appointment) => (
      <button onClick={() => { setSelected(r); setNotes(r.notes || ''); }} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg">
        عرض
      </button>
    )},
  ];

  return (
    <DashboardLayout navItems={barberNav} title="مواعيدي">
      <div className="space-y-4 page-enter">
        <div className="card flex flex-wrap gap-3">
          <input type="date" value={filters.date} onChange={e => setFilters(f => ({ ...f, date: e.target.value }))} className="input-field max-w-xs" />
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="input-field w-48">
            <option value="">جميع الحالات</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={() => setFilters({ status: '', date: '' })} className="btn-ghost flex items-center gap-2">
            <Filter size={16} />إعادة تعيين
          </button>
        </div>
        <div className="card p-0 overflow-hidden">
          <DataTable<Appointment> columns={columns} data={appointments} isLoading={isLoading} emptyMessage="لا توجد مواعيد" />
        </div>
      </div>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`تفاصيل الموعد #${selected?.id}`} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-zinc-400">العميل: </span><span className="text-white">{selected.customer_name}</span></div>
              <div><span className="text-zinc-400">الهاتف: </span><span className="text-white">{selected.customer_phone}</span></div>
              <div><span className="text-zinc-400">التاريخ: </span><span className="text-white">{formatDate(selected.appointment_date)}</span></div>
              <div><span className="text-zinc-400">الوقت: </span><span className="text-white">{formatTimeArabic(selected.start_time)} - {formatTimeArabic(selected.end_time)}</span></div>
              <div><span className="text-zinc-400">المبلغ: </span><span className="text-amber-500 font-bold">{selected.total_price} ₪</span></div>
              <div><span className="text-zinc-400">الحالة: </span><StatusBadge status={selected.status} /></div>
            </div>
            {selected.services?.length > 0 && (
              <div>
                <div className="text-zinc-400 text-sm mb-2">الخدمات:</div>
                <div className="flex flex-wrap gap-2">
                  {selected.services.map(s => <span key={s.id} className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded-full">{s.name}</span>)}
                </div>
              </div>
            )}
            <div>
              <label className="label">ملاحظاتي</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="input-field" placeholder="إضافة ملاحظة..." />
            </div>
            <div>
              <div className="text-zinc-400 text-sm mb-2">تحديث الحالة:</div>
              <div className="flex flex-wrap gap-2">
                {(['pending', 'confirmed', 'completed', 'cancelled', 'no_show'] as AppointmentStatus[]).map(s => (
                  <button key={s} onClick={() => updateStatus(selected.id, s)} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${selected.status === s ? 'bg-amber-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
