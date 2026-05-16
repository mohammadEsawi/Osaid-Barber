import { LayoutDashboard, Calendar, Scissors, Users, Package, ShoppingBag, BarChart3, Settings, User, MessageSquare, Clock } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import DataTable from '../../components/ui/DataTable';
import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '../../services/api';
import { Appointment } from '../../types';

const adminNav = [
  { href: '/admin', label: 'الرئيسية', icon: <LayoutDashboard size={18} /> },
  { href: '/admin/bookings', label: 'المواعيد', icon: <Calendar size={18} /> },
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

interface CustomerSummary {
  id?: string;
  customer_name: string;
  customer_phone: string;
  total_bookings: number;
  total_spent: number;
  last_visit: string;
}

export default function AdminCustomers() {
  const { data, isLoading } = useQuery({ queryKey: ['all-appointments'], queryFn: () => appointmentsApi.getAll({ limit: 1000 }) });
  const appointments: Appointment[] = data?.data?.data || [];

  // Build unique customer list from appointments
  const customersMap = new Map<string, CustomerSummary>();
  appointments.forEach(a => {
    const key = a.customer_phone;
    const existing = customersMap.get(key);
    if (existing) {
      existing.total_bookings++;
      existing.total_spent += parseFloat(String(a.total_price));
      if (a.appointment_date > existing.last_visit) existing.last_visit = a.appointment_date;
    } else {
      customersMap.set(key, { customer_name: a.customer_name, customer_phone: a.customer_phone, total_bookings: 1, total_spent: parseFloat(String(a.total_price)), last_visit: a.appointment_date });
    }
  });
  const customers = Array.from(customersMap.values()).sort((a, b) => b.total_bookings - a.total_bookings);

  const columns = [
    { header: 'العميل', render: (r: CustomerSummary) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center"><User size={14} className="text-zinc-400" /></div>
        <div><div className="text-white font-medium">{r.customer_name}</div><div className="text-zinc-400 text-xs">{r.customer_phone}</div></div>
      </div>
    )},
    { header: 'عدد المواعيد', render: (r: CustomerSummary) => <span className="text-zinc-300">{r.total_bookings}</span> },
    { header: 'إجمالي الإنفاق', render: (r: CustomerSummary) => <span className="text-amber-500 font-bold">{r.total_spent.toFixed(2)} ₪</span> },
    { header: 'آخر زيارة', render: (r: CustomerSummary) => <span className="text-zinc-400">{r.last_visit}</span> },
  ];

  return (
    <DashboardLayout navItems={adminNav} title="العملاء">
      <div className="page-enter">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white">قائمة العملاء ({customers.length})</h2>
        </div>
        <div className="card p-0 overflow-hidden">
          <DataTable<CustomerSummary> columns={columns} data={customers} isLoading={isLoading} emptyMessage="لا يوجد عملاء" keyField="customer_phone" />
        </div>
      </div>
    </DashboardLayout>
  );
}
