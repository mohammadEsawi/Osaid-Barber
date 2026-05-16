import { LayoutDashboard, Calendar, Scissors, Users, Package, ShoppingBag, BarChart3, Settings, LucideIcon, MessageSquare, Clock } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../../services/api';
import { DashboardStats, Appointment } from '../../types';

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

const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: LucideIcon; color: string }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-zinc-400 text-sm">{label}</div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: () => reportsApi.getDashboard() });
  const stats: DashboardStats = data?.data?.data?.stats || {};
  const upcoming: Appointment[] = data?.data?.data?.upcomingAppointments || [];

  return (
    <DashboardLayout navItems={adminNav} title="لوحة التحكم">
      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="space-y-6 page-enter">
          <div>
            <h2 className="text-xl font-bold text-white mb-4">نظرة عامة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="مواعيد اليوم" value={stats.todayAppointments ?? 0} icon={Calendar} color="bg-blue-600" />
              <StatCard label="مواعيد الشهر" value={stats.monthAppointments ?? 0} icon={Calendar} color="bg-purple-600" />
              <StatCard label="في الانتظار" value={stats.pendingAppointments ?? 0} icon={Calendar} color="bg-yellow-600" />
              <StatCard label="إجمالي الدخل" value={`${stats.totalIncome ?? 0} ₪`} icon={BarChart3} color="bg-amber-600" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="حلاقون نشطون" value={stats.activeBarbers ?? 0} icon={Users} color="bg-green-600" />
            <StatCard label="منتجات متاحة" value={stats.totalProducts ?? 0} icon={Package} color="bg-indigo-600" />
            <StatCard label="إجمالي الطلبات" value={stats.totalOrders ?? 0} icon={ShoppingBag} color="bg-rose-600" />
          </div>

          {upcoming.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4">مواعيد اليوم</h2>
              <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-right text-zinc-400 font-medium py-3 px-4">العميل</th>
                        <th className="text-right text-zinc-400 font-medium py-3 px-4">الحلاق</th>
                        <th className="text-right text-zinc-400 font-medium py-3 px-4">الوقت</th>
                        <th className="text-right text-zinc-400 font-medium py-3 px-4">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcoming.map(appt => (
                        <tr key={appt.id} className="table-row">
                          <td className="py-3 px-4 text-white font-medium">{appt.customer_name}</td>
                          <td className="py-3 px-4 text-zinc-300">{appt.barber_name}</td>
                          <td className="py-3 px-4 text-zinc-300">{appt.start_time?.substring(0, 5)}</td>
                          <td className="py-3 px-4"><StatusBadge status={appt.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

export { adminNav };
