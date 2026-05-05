import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Calendar, User, Clock, Phone, Home, Search } from 'lucide-react';
import Navbar from '../../components/common/Navbar';

export default function BookingConfirmationPage() {
  const { state } = useLocation();
  const { appointment, services, barberName } = state || {};

  if (!appointment) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">لا توجد بيانات موعد</p>
          <Link to="/booking" className="btn-primary">احجز موعداً</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="pt-24 pb-20 max-w-lg mx-auto px-4 sm:px-6 text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-400" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2">تم الحجز بنجاح!</h1>
        <p className="text-zinc-400 mb-8">سيتم تأكيد موعدك قريباً</p>

        <div className="card text-right space-y-4 mb-8">
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-amber-500 font-bold">#{appointment.id}</span>
            </div>
            <div>
              <div className="text-white font-bold">رقم الحجز</div>
              <div className="text-zinc-400 text-sm">احتفظ بهذا الرقم للمتابعة</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <User size={18} className="text-amber-500 shrink-0" />
            <div>
              <div className="text-zinc-400 text-xs">الحلاق</div>
              <div className="text-white font-medium">{barberName}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-amber-500 shrink-0" />
            <div>
              <div className="text-zinc-400 text-xs">التاريخ</div>
              <div className="text-white font-medium">{appointment.appointment_date}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock size={18} className="text-amber-500 shrink-0" />
            <div>
              <div className="text-zinc-400 text-xs">الوقت</div>
              <div className="text-white font-medium">{appointment.start_time?.substring(0, 5)} - {appointment.end_time?.substring(0, 5)}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone size={18} className="text-amber-500 shrink-0" />
            <div>
              <div className="text-zinc-400 text-xs">الهاتف</div>
              <div className="text-white font-medium">{appointment.customer_phone}</div>
            </div>
          </div>

          {services?.length > 0 && (
            <div className="pt-4 border-t border-zinc-800">
              <div className="text-zinc-400 text-xs mb-2">الخدمات المحجوزة</div>
              <div className="space-y-1">
                {services.map((s: { id: number; name: string; price: number }) => (
                  <div key={s.id} className="flex justify-between text-sm">
                    <span className="text-zinc-300">{s.name}</span>
                    <span className="text-amber-500 font-medium">{s.price} ₪</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold mt-3 pt-3 border-t border-zinc-800">
                <span className="text-white">الإجمالي</span>
                <span className="text-amber-500">{appointment.total_price} ₪</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Link to="/" className="btn-secondary flex-1 flex items-center justify-center gap-2">
            <Home size={16} />
            الرئيسية
          </Link>
          <Link to="/my-booking" className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Search size={16} />
            متابعة موعدي
          </Link>
        </div>
      </div>
    </div>
  );
}
