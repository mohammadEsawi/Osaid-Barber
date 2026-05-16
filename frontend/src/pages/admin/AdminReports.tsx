import { LayoutDashboard, Calendar, Scissors, Users, Package, ShoppingBag, BarChart3, Settings, MessageSquare, Clock } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

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

const COLORS = ['#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a'];

export default function AdminReports() {
  const { data: bookingsData, isLoading: bookLoading } = useQuery({ queryKey: ['reports-bookings'], queryFn: () => reportsApi.getBookings() });
  const { data: incomeData, isLoading: incLoading } = useQuery({ queryKey: ['reports-income'], queryFn: () => reportsApi.getIncome() });
  const { data: barbersData } = useQuery({ queryKey: ['reports-barbers'], queryFn: () => reportsApi.getBarbers() });

  const statusDist = bookingsData?.data?.data?.statusDistribution || [];
  const servicePopularity = bookingsData?.data?.data?.servicePopularity || [];
  const monthlyIncome = incomeData?.data?.data?.appointmentIncome || [];
  const barberPerf = barbersData?.data?.data || [];

  const statusLabels: Record<string, string> = { pending: 'انتظار', confirmed: 'مؤكد', completed: 'مكتمل', cancelled: 'ملغي', no_show: 'لم يحضر' };

  return (
    <DashboardLayout navItems={adminNav} title="التقارير والإحصائيات">
      <div className="space-y-6 page-enter">
        {(bookLoading || incLoading) && <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>}

        {/* Monthly income chart */}
        {monthlyIncome.length > 0 && (
          <div className="card">
            <h2 className="text-white font-bold mb-4">الدخل الشهري (₪)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyIncome}>
                <XAxis dataKey="month" stroke="#666" tick={{ fill: '#aaa', fontSize: 12 }} />
                <YAxis stroke="#666" tick={{ fill: '#aaa', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: 8 }} />
                <Bar dataKey="income" fill="#d97706" radius={[4, 4, 0, 0]} name="الدخل (₪)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status distribution */}
          {statusDist.length > 0 && (
            <div className="card">
              <h2 className="text-white font-bold mb-4">توزيع حالات المواعيد</h2>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusDist.map((s: { status: string; count: number }) => ({ ...s, name: statusLabels[s.status] || s.status, value: parseInt(s.count as unknown as string) }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {statusDist.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend formatter={(v) => <span style={{ color: '#aaa' }}>{v}</span>} />
                  <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Service popularity */}
          {servicePopularity.length > 0 && (
            <div className="card">
              <h2 className="text-white font-bold mb-4">أكثر الخدمات طلباً</h2>
              <div className="space-y-3">
                {servicePopularity.slice(0, 5).map((s: { name: string; booking_count: number; total_revenue: number }, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 text-xs font-bold">{i + 1}</div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-zinc-300 text-sm">{s.name}</span>
                        <span className="text-amber-500 text-sm font-bold">{s.booking_count} حجز</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(s.booking_count / servicePopularity[0].booking_count) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Barber performance */}
        {barberPerf.length > 0 && (
          <div className="card p-0 overflow-hidden">
            <div className="p-4 border-b border-zinc-800">
              <h2 className="font-bold text-white">أداء الحلاقين</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-zinc-800">
                  <th className="text-right text-zinc-400 py-3 px-4">الحلاق</th>
                  <th className="text-right text-zinc-400 py-3 px-4">إجمالي المواعيد</th>
                  <th className="text-right text-zinc-400 py-3 px-4">المكتملة</th>
                  <th className="text-right text-zinc-400 py-3 px-4">الدخل</th>
                </tr></thead>
                <tbody>
                  {barberPerf.map((b: { barber_id: number; barber_name: string; total_appointments: number; completed: number; total_income: number }) => (
                    <tr key={b.barber_id} className="table-row">
                      <td className="py-3 px-4 text-white font-medium">{b.barber_name}</td>
                      <td className="py-3 px-4 text-zinc-300">{b.total_appointments}</td>
                      <td className="py-3 px-4 text-green-400">{b.completed}</td>
                      <td className="py-3 px-4 text-amber-500 font-bold">{parseFloat(String(b.total_income)).toFixed(2)} ₪</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
