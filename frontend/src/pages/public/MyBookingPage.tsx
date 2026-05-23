import { useState } from 'react';
import { Search, Calendar, Clock, User, X } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import StatusBadge from '../../components/ui/StatusBadge';
import { FormInput } from '../../components/ui/FormInput';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { appointmentsApi } from '../../services/api';
import { Appointment } from '../../types';
import toast from 'react-hot-toast';
import { validatePhone, formatTimeArabic, formatDate } from '../../utils/helpers';

export default function MyBookingPage() {
  const [phone, setPhone] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [cancelling, setCancelling] = useState<number | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    const phoneErr = validatePhone(phone);
    if (phoneErr) { toast.error(phoneErr); return; }
    setIsLoading(true);
    try {
      const res = await appointmentsApi.getByPhone(phone);
      setAppointments(res.data.data || []);
      setSearched(true);
    } catch {
      toast.error('حدث خطأ في البحث');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    setCancelling(id);
    try {
      await appointmentsApi.cancelByPhone(id, phone);
      toast.success('تم إلغاء الموعد بنجاح');
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' as const } : a));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'تعذّر إلغاء الموعد');
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="pt-24 pb-20 max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h1 className="section-title">مواعيدي</h1>
          <p className="section-subtitle">ابحث عن مواعيدك باستخدام رقم هاتفك</p>
        </div>

        <form onSubmit={handleSearch} className="card mb-8">
          <div className="flex gap-3">
            <FormInput
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="أدخل رقم هاتفك"
              type="tel"
              className="flex-1"
            />
            <button type="submit" className="btn-primary flex items-center gap-2 shrink-0">
              <Search size={18} />
              بحث
            </button>
          </div>
        </form>

        {isLoading && <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>}

        {searched && !isLoading && (
          appointments.length === 0 ? (
            <div className="card text-center py-12">
              <Calendar size={40} className="text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400">لا توجد مواعيد مرتبطة بهذا الرقم</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map(appt => (
                <div key={appt.id} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-zinc-400 text-sm">#{appt.id}</span>
                        <StatusBadge status={appt.status} />
                      </div>
                      <h3 className="text-white font-bold text-lg">{appt.customer_name}</h3>
                    </div>
                    {(appt.status === 'pending' || appt.status === 'confirmed') && (
                      <button
                        onClick={() => handleCancel(appt.id)}
                        disabled={cancelling === appt.id}
                        className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 hover:bg-red-400/10 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {cancelling === appt.id ? <LoadingSpinner size="sm" /> : <X size={14} />}
                        إلغاء
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <User size={14} className="text-amber-500" />
                      <span>{appt.barber_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Calendar size={14} className="text-amber-500" />
                      <span>{formatDate(appt.appointment_date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Clock size={14} className="text-amber-500" />
                      <span>{formatTimeArabic(appt.start_time)} - {formatTimeArabic(appt.end_time)}</span>
                    </div>
                    <div className="text-amber-500 font-bold">{appt.total_price} ₪</div>
                  </div>

                  {appt.services?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 flex flex-wrap gap-1">
                      {appt.services.map(s => (
                        <span key={s.id} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">{s.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
      <Footer />
    </div>
  );
}
