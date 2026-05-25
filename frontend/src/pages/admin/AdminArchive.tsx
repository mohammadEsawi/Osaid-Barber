import { useState } from 'react';
import { LayoutDashboard, Calendar, Scissors, Users, Package, ShoppingBag, BarChart3, Settings, Search, Eye, Trash2, MessageSquare, Clock, Archive, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '../../services/api';
import { Appointment } from '../../types';
import { formatTimeArabic, formatDate } from '../../utils/helpers';
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

export default function AdminArchive() {
  const [dateFilter, setDateFilter] = useState('');
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['appointments-archive', dateFilter],
    queryFn: () => appointmentsApi.getAll({ status: 'completed', date: dateFilter || undefined }),
  });
  const appointments: Appointment[] = data?.data?.data || [];

  const handleDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الموعد من الأرشيف؟')) return;
    setIsDeleting(true);
    try {
      await appointmentsApi.delete(id);
      toast.success('تم الحذف من الأرشيف');
      qc.invalidateQueries({ queryKey: ['appointments-archive'] });
      qc.invalidateQueries({ queryKey: ['appointments'] });
      setSelected(null);
    } catch {
      toast.error('فشل الحذف');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    { header: '#', accessor: 'id' as keyof Appointment, width: 'w-12' },
    {
      header: 'العميل',
      render: (r: Appointment) => (
        <div>
          <div className="text-white font-medium">{r.customer_name}</div>
          <div className="text-zinc-400 text-xs">{r.customer_phone}</div>
        </div>
      ),
    },
    { header: 'الحلاق', accessor: 'barber_name' as keyof Appointment },
    {
      header: 'التاريخ والوقت',
      render: (r: Appointment) => (
        <div>
          <div className="text-white text-sm">{formatDate(r.appointment_date)}</div>
          <div className="text-amber-400 text-xs">{formatTimeArabic(r.start_time)}</div>
        </div>
      ),
    },
    {
      header: 'المبلغ',
      render: (r: Appointment) => <span className="text-amber-500 font-bold">{r.total_price} ₪</span>,
    },
    {
      header: 'الخدمات',
      render: (r: Appointment) => (
        <div className="flex flex-wrap gap-1">
          {r.services?.map(s => (
            <span key={s.id} className="text-xs bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded-full">
              {s.name}
            </span>
          ))}
        </div>
      ),
    },
    {
      header: '',
      render: (r: Appointment) => (
        <button onClick={() => setSelected(r)} className="text-amber-500 hover:text-amber-400 p-1">
          <Eye size={16} />
        </button>
      ),
    },
  ];

  return (
    <DashboardLayout navItems={adminNav} title="الأرشيف — المواعيد المكتملة">
      <div className="space-y-4 page-enter">
        {/* Header */}
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/15 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} className="text-green-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold">أرشيف المواعيد المكتملة</h2>
            <p className="text-zinc-500 text-xs">جميع المواعيد التي تمت خدمتها بنجاح</p>
          </div>
          <div className="flex items-center gap-2">
            <Search size={16} className="text-zinc-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="input-field text-sm py-1.5"
            />
            {dateFilter && (
              <button onClick={() => setDateFilter('')} className="text-zinc-500 hover:text-white text-xs px-2 py-1 rounded bg-zinc-800">
                مسح
              </button>
            )}
          </div>
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="font-bold text-white">المكتملة ({appointments.length})</h2>
            <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">مكتمل</span>
          </div>
          <DataTable<Appointment>
            columns={columns}
            data={appointments}
            isLoading={isLoading}
            emptyMessage="لا توجد مواعيد مكتملة"
          />
        </div>
      </div>

      {/* Detail modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`تفاصيل الموعد #${selected?.id}`} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={18} className="text-green-400" />
              <span className="text-green-400 font-medium text-sm">موعد مكتمل</span>
            </div>
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
                  {selected.services.map(s => (
                    <span key={s.id} className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded-full">
                      {s.name} - {s.price} ₪
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selected.notes && (
              <div><span className="text-zinc-400 text-sm">ملاحظات: </span><span className="text-zinc-300 text-sm">{selected.notes}</span></div>
            )}
            <div className="pt-4 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => handleDelete(selected.id)}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-950/60 text-red-400 hover:bg-red-900/60 hover:text-red-300 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isDeleting ? <LoadingSpinner size="sm" /> : <Trash2 size={15} />}
                حذف من الأرشيف
              </button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
