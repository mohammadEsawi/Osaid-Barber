import { useState } from 'react';
import { LayoutDashboard, Calendar, Scissors, Users, Package, ShoppingBag, BarChart3, Settings, Search, Filter, Eye , MessageSquare } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '../../services/api';
import { Appointment, AppointmentStatus, STATUS_LABELS } from '../../types';
import toast from 'react-hot-toast';

const adminNav = [
  { href: '/admin', label: 'الرئيسية', icon: <LayoutDashboard size={18} /> },
  { href: '/admin/bookings', label: 'المواعيد', icon: <Calendar size={18} /> },
  { href: '/admin/services', label: 'الخدمات', icon: <Scissors size={18} /> },
  { href: '/admin/barbers', label: 'الحلاقون', icon: <Users size={18} /> },
  { href: '/admin/products', label: 'المنتجات', icon: <Package size={18} /> },
  { href: '/admin/orders', label: 'الطلبات', icon: <ShoppingBag size={18} /> },
  { href: '/admin/customers', label: 'العملاء', icon: <Users size={18} /> },
  { href: '/admin/reports', label: 'التقارير', icon: <BarChart3 size={18} /> },
  { href: '/admin/messages', label: 'الرسائل', icon: <MessageSquare size={18} /> },
  { href: '/admin/settings', label: 'الإعدادات', icon: <Settings size={18} /> },
];

export default function AdminBookings() {
  const [filters, setFilters] = useState({ status: '', date: '' });
  const [selected, setSelected] = useState<Appointment | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => appointmentsApi.getAll({ status: filters.status || undefined, date: filters.date || undefined }),
  });
  const appointments: Appointment[] = data?.data?.data || [];

  const updateStatus = async (id: number, status: AppointmentStatus) => {
    try {
      await appointmentsApi.updateStatus(id, status);
      toast.success('تم تحديث الحالة');
      qc.invalidateQueries({ queryKey: ['appointments'] });
      setSelected(prev => prev ? { ...prev, status } : null);
    } catch {
      toast.error('فشل تحديث الحالة');
    }
  };

  const columns = [
    { header: '#', accessor: 'id' as keyof Appointment, width: 'w-12' },
    { header: 'العميل', render: (r: Appointment) => <div><div className="text-white font-medium">{r.customer_name}</div><div className="text-zinc-400 text-xs">{r.customer_phone}</div></div> },
    { header: 'الحلاق', accessor: 'barber_name' as keyof Appointment },
    { header: 'التاريخ', render: (r: Appointment) => <span>{r.appointment_date} {r.start_time?.substring(0, 5)}</span> },
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
        {/* Filters */}
        <div className="card flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input type="date" value={filters.date} onChange={e => setFilters(f => ({ ...f, date: e.target.value }))} className="input-field pr-9" />
          </div>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="input-field w-48">
            <option value="">جميع الحالات</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={() => setFilters({ status: '', date: '' })} className="btn-ghost flex items-center gap-2">
            <Filter size={16} />
            إعادة تعيين
          </button>
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="font-bold text-white">المواعيد ({appointments.length})</h2>
          </div>
          <DataTable<Appointment> columns={columns} data={appointments} isLoading={isLoading} emptyMessage="لا توجد مواعيد" />
        </div>
      </div>

      {/* Detail modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`تفاصيل الموعد #${selected?.id}`} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-zinc-400">العميل: </span><span className="text-white">{selected.customer_name}</span></div>
              <div><span className="text-zinc-400">الهاتف: </span><span className="text-white">{selected.customer_phone}</span></div>
              <div><span className="text-zinc-400">الحلاق: </span><span className="text-white">{selected.barber_name}</span></div>
              <div><span className="text-zinc-400">التاريخ: </span><span className="text-white">{selected.appointment_date}</span></div>
              <div><span className="text-zinc-400">الوقت: </span><span className="text-white">{selected.start_time?.substring(0, 5)} - {selected.end_time?.substring(0, 5)}</span></div>
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
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
