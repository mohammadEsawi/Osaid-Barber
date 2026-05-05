import { useState } from 'react';
import { Eye, LayoutDashboard, Calendar, Scissors, Users, Package, ShoppingBag, BarChart3, Settings , MessageSquare } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../../services/api';
import { ProductOrder, OrderStatus, ORDER_STATUS_LABELS } from '../../types';
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

export default function AdminOrders() {
  const [selected, setSelected] = useState<ProductOrder | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['orders'], queryFn: () => ordersApi.getAll() });
  const orders: ProductOrder[] = data?.data?.data || [];

  const updateStatus = async (id: number, status: OrderStatus) => {
    try {
      await ordersApi.updateStatus(id, status);
      toast.success('تم تحديث الحالة');
      qc.invalidateQueries({ queryKey: ['orders'] });
      setSelected(prev => prev ? { ...prev, status } : null);
    } catch { toast.error('فشل تحديث الحالة'); }
  };

  const columns = [
    { header: '#', accessor: 'id' as keyof ProductOrder, width: 'w-12' },
    { header: 'العميل', render: (r: ProductOrder) => <div><div className="text-white font-medium">{r.customer_name}</div><div className="text-zinc-400 text-xs">{r.customer_phone}</div></div> },
    { header: 'الإجمالي', render: (r: ProductOrder) => <span className="text-amber-500 font-bold">{r.total_price} ₪</span> },
    { header: 'الحالة', render: (r: ProductOrder) => <StatusBadge status={r.status} type="order" /> },
    { header: 'التاريخ', render: (r: ProductOrder) => <span className="text-zinc-400 text-xs">{new Date(r.created_at).toLocaleDateString('ar-SA')}</span> },
    { header: 'إجراءات', render: (r: ProductOrder) => (
      <button onClick={() => setSelected(r)} className="text-amber-500 hover:text-amber-400 p-1"><Eye size={16} /></button>
    )},
  ];

  return (
    <DashboardLayout navItems={adminNav} title="إدارة الطلبات">
      <div className="page-enter">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">الطلبات ({orders.length})</h2>
        </div>
        <div className="card p-0 overflow-hidden">
          <DataTable<ProductOrder> columns={columns} data={orders} isLoading={isLoading} emptyMessage="لا توجد طلبات" />
        </div>
      </div>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`تفاصيل الطلب #${selected?.id}`}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-zinc-400">العميل: </span><span className="text-white">{selected.customer_name}</span></div>
              <div><span className="text-zinc-400">الهاتف: </span><span className="text-white">{selected.customer_phone}</span></div>
            </div>
            {selected.items?.length > 0 && (
              <div>
                <div className="text-zinc-400 text-sm mb-2">المنتجات:</div>
                <div className="space-y-2">
                  {selected.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm bg-zinc-800 px-3 py-2 rounded-lg">
                      <span className="text-zinc-300">{item.name} × {item.quantity}</span>
                      <span className="text-amber-500">{(item.price * item.quantity).toFixed(2)} ₪</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold mt-3 pt-3 border-t border-zinc-800 text-lg">
                  <span className="text-white">الإجمالي</span>
                  <span className="text-amber-500">{selected.total_price} ₪</span>
                </div>
              </div>
            )}
            <div className="pt-4 border-t border-zinc-800">
              <div className="text-zinc-400 text-sm mb-2">تغيير الحالة:</div>
              <div className="flex flex-wrap gap-2">
                {(['pending', 'confirmed', 'delivered', 'cancelled'] as OrderStatus[]).map(s => (
                  <button key={s} onClick={() => updateStatus(selected.id, s)} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${selected.status === s ? 'bg-amber-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                    {ORDER_STATUS_LABELS[s]}
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
