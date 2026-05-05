import { useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutDashboard, Calendar, Clock, Settings , User } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '../../services/api';
import { Appointment } from '../../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { ar } from 'date-fns/locale';

const barberNav = [
  { href: '/barber', label: 'لوحة التحكم', icon: <LayoutDashboard size={18} /> },
  { href: '/barber/appointments', label: 'المواعيد', icon: <Calendar size={18} /> },
  { href: '/barber/calendar', label: 'التقويم', icon: <Clock size={18} /> },
  { href: '/barber/availability', label: 'أوقات العمل', icon: <Settings size={18} /> },
  { href: '/barber/profile', label: 'ملفي الشخصي', icon: <User size={18} /> },
];

export default function BarberCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const { data, isLoading } = useQuery({
    queryKey: ['barber-calendar', format(currentMonth, 'yyyy-MM')],
    queryFn: () => appointmentsApi.getAll({ limit: 500 }),
  });
  const appointments: Appointment[] = data?.data?.data || [];

  const getDateAppointments = (date: Date) =>
    appointments.filter(a => a.appointment_date === format(date, 'yyyy-MM-dd'));

  const selectedAppointments = getDateAppointments(selectedDate);

  return (
    <DashboardLayout navItems={barberNav} title="التقويم">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 page-enter">
        {/* Calendar */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-2 hover:bg-zinc-800 rounded-lg">
              <ChevronRight size={18} className="text-zinc-400" />
            </button>
            <h2 className="text-white font-bold text-lg">
              {format(currentMonth, 'MMMM yyyy', { locale: ar })}
            </h2>
            <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-2 hover:bg-zinc-800 rounded-lg">
              <ChevronLeft size={18} className="text-zinc-400" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب'].map(d => (
              <div key={d} className="text-center text-zinc-500 text-xs py-2 font-medium">{d}</div>
            ))}
          </div>

          {/* Empty cells before first day */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: days[0].getDay() }).map((_, i) => <div key={`empty-${i}`} />)}
            {days.map(day => {
              const dayAppts = getDateAppointments(day);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDay = isToday(day);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all relative ${
                    isSelected ? 'bg-amber-500 text-white font-bold' :
                    isTodayDay ? 'border border-amber-500 text-amber-500' :
                    'hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <span>{format(day, 'd')}</span>
                  {dayAppts.length > 0 && (
                    <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-amber-500'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day schedule */}
        <div className="card">
          <h3 className="text-white font-bold mb-4">
            {format(selectedDate, 'EEEE، d MMMM', { locale: ar })}
          </h3>
          {isLoading ? <LoadingSpinner /> : selectedAppointments.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm">لا توجد مواعيد هذا اليوم</div>
          ) : (
            <div className="space-y-3">
              {selectedAppointments.sort((a, b) => a.start_time.localeCompare(b.start_time)).map(appt => (
                <div key={appt.id} className="bg-zinc-800 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-amber-500 font-bold text-sm">{appt.start_time.substring(0, 5)}</span>
                    <StatusBadge status={appt.status} />
                  </div>
                  <div className="text-white font-medium text-sm">{appt.customer_name}</div>
                  <div className="text-zinc-400 text-xs">{appt.customer_phone}</div>
                  <div className="text-amber-500 text-xs mt-1 font-medium">{appt.total_price} ₪</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
