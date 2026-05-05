import { LayoutDashboard, Calendar, Clock, Settings , User } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '../../services/api';
import { Appointment } from '../../types';

const barberNav = [
  { href: '/barber', label: 'لوحة التحكم', icon: <LayoutDashboard size={18} /> },
  { href: '/barber/appointments', label: 'المواعيد', icon: <Calendar size={18} /> },
  { href: '/barber/calendar', label: 'التقويم', icon: <Clock size={18} /> },
  { href: '/barber/availability', label: 'أوقات العمل', icon: <Settings size={18} /> },
  { href: '/barber/profile', label: 'ملفي الشخصي', icon: <User size={18} /> },
];

export default function BarberDashboard() {
  const today = new Date().toISOString().split('T')[0];
  const { data, isLoading } = useQuery({
    queryKey: ['barber-today', today],
    queryFn: () => appointmentsApi.getAll({ date: today }),
  });
  const appointments: Appointment[] = data?.data?.data || [];

  const stats = {
    total: appointments.length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    pending: appointments.filter(a => a.status === 'pending').length,
    completed: appointments.filter(a => a.status === 'completed').length,
  };

  return (
    <DashboardLayout navItems={barberNav} title="لوحة تحكم الحلاق">
      <div className="space-y-6 page-enter">
        <div>
          <h2 className="text-lg font-bold text-white mb-1">مرحباً! 👋</h2>
          <p className="text-zinc-400 text-sm">مواعيد اليوم — {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي اليوم', value: stats.total, color: 'bg-blue-600' },
            { label: 'مؤكدة', value: stats.confirmed, color: 'bg-green-600' },
            { label: 'انتظار', value: stats.pending, color: 'bg-yellow-600' },
            { label: 'مكتملة', value: stats.completed, color: 'bg-amber-600' },
          ].map((s, i) => (
            <div key={i} className="card text-center">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-2`}>
                <Calendar size={18} className="text-white" />
              </div>
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-zinc-400 text-sm">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="font-bold text-white">جدول اليوم</h2>
            <span className="text-zinc-400 text-sm">{today}</span>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-10"><LoadingSpinner /></div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">لا توجد مواعيد اليوم</div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {appointments.sort((a, b) => a.start_time.localeCompare(b.start_time)).map(appt => (
                <div key={appt.id} className="flex items-center gap-4 p-4 hover:bg-zinc-800/40 transition-colors">
                  <div className="text-center shrink-0 w-14">
                    <div className="text-amber-500 font-bold">{appt.start_time.substring(0, 5)}</div>
                    <div className="text-zinc-500 text-xs">{appt.end_time.substring(0, 5)}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium">{appt.customer_name}</div>
                    <div className="text-zinc-400 text-sm">{appt.customer_phone}</div>
                    {appt.services?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {appt.services.map(s => <span key={s.id} className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">{s.name}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <StatusBadge status={appt.status} />
                    <div className="text-amber-500 font-bold text-sm mt-1">{appt.total_price} ₪</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
