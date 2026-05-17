import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ChevronLeft, ChevronRight, User, Scissors, Calendar, Clock } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import ServiceCard from '../../components/ui/ServiceCard';
import DayPicker from '../../components/booking/DayPicker';
import TimeSlotPicker from '../../components/booking/TimeSlotPicker';
import { FormInput, FormTextarea } from '../../components/ui/FormInput';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useQuery } from '@tanstack/react-query';
import { servicesApi, barbersApi, appointmentsApi } from '../../services/api';
import { Service, BarberProfile, TimeSlot, BarberAvailability } from '../../types';
import { formatTimeArabic } from '../../utils/helpers';
import toast from 'react-hot-toast';

const STEPS = ['الخدمات', 'الحلاق', 'الموعد', 'البيانات'];

export default function BookingPage() {
  const [step, setStep] = useState(0);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<BarberProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedBarber = searchParams.get('barber');

  const { data: servicesData } = useQuery({ queryKey: ['services'], queryFn: () => servicesApi.getAll(true) });
  const { data: barbersData } = useQuery({ queryKey: ['barbers'], queryFn: () => barbersApi.getAll() });
  const { data: availData } = useQuery({
    queryKey: ['barber-availability', selectedBarber?.id],
    queryFn: () => barbersApi.getAvailability(selectedBarber!.id),
    enabled: !!selectedBarber,
  });

  const services: Service[] = servicesData?.data?.data || [];
  const barbers: BarberProfile[] = barbersData?.data?.data || [];
  const barberAvailability: BarberAvailability[] = availData?.data?.data || [];

  useEffect(() => {
    if (preSelectedBarber && barbers.length > 0) {
      const barber = barbers.find(b => b.id === parseInt(preSelectedBarber));
      if (barber) { setSelectedBarber(barber); setStep(1); }
    }
  }, [preSelectedBarber, barbers]);

  const totalDuration = selectedServices.reduce((s, sv) => s + sv.duration_minutes, 0);
  const totalPrice = selectedServices.reduce((s, sv) => s + sv.price, 0);

  const toggleService = (service: Service) => {
    setSelectedServices(prev =>
      prev.find(s => s.id === service.id) ? prev.filter(s => s.id !== service.id) : [...prev, service]
    );
  };

  // Reset time when date or barber changes
  useEffect(() => {
    setSelectedTime('');
    setSlots([]);
    if (selectedBarber && selectedDate && totalDuration > 0) {
      setSlotsLoading(true);
      appointmentsApi.checkAvailability(selectedBarber.id, selectedDate, totalDuration)
        .then(res => setSlots(res.data.data || []))
        .catch(() => setSlots([]))
        .finally(() => setSlotsLoading(false));
    }
  }, [selectedBarber?.id, selectedDate, totalDuration]);

  const handleSubmit = async () => {
    if (!form.customer_name || !form.customer_phone) {
      toast.error('يرجى إدخال الاسم ورقم الهاتف');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await appointmentsApi.create({
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        barber_id: selectedBarber!.id,
        appointment_date: selectedDate,
        start_time: selectedTime,
        service_ids: selectedServices.map(s => s.id),
        notes: form.notes,
      });
      toast.success('تم حجز موعدك بنجاح!');
      navigate('/booking/confirmation', {
        state: { appointment: res.data.data, services: selectedServices, barberName: selectedBarber?.full_name },
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'حدث خطأ في الحجز');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = [
    selectedServices.length > 0,
    !!selectedBarber,
    !!selectedDate && !!selectedTime,
    !!form.customer_name && !!form.customer_phone,
  ][step];

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="pt-24 pb-20 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h1 className="section-title">احجز موعدك</h1>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center mb-10 gap-0">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                i === step ? 'bg-amber-500 text-white' : i < step ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-500'
              }`}>
                {i < step ? <CheckCircle size={16} /> : <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">{i + 1}</span>}
                {s}
              </div>
              {i < STEPS.length - 1 && <div className={`h-px w-8 ${i < step ? 'bg-green-500' : 'bg-zinc-700'}`} />}
            </div>
          ))}
        </div>

        {/* Summary bar */}
        {(selectedServices.length > 0 || selectedBarber || selectedDate) && (
          <div className="card mb-6 flex flex-wrap gap-4 text-sm">
            {selectedServices.length > 0 && (
              <div className="flex items-center gap-2 text-zinc-300">
                <Scissors size={15} className="text-amber-500" />
                <span>{selectedServices.map(s => s.name).join('، ')}</span>
                <span className="text-amber-500 font-bold">({totalPrice} ₪ / {totalDuration} د)</span>
              </div>
            )}
            {selectedBarber && (
              <div className="flex items-center gap-2 text-zinc-300">
                <User size={15} className="text-amber-500" />
                <span>{selectedBarber.full_name}</span>
              </div>
            )}
            {selectedDate && (
              <div className="flex items-center gap-2 text-zinc-300">
                <Calendar size={15} className="text-amber-500" />
                <span>{selectedDate}</span>
                {selectedTime && (
                  <span className="text-amber-500 font-bold">{formatTimeArabic(selectedTime)}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 0: Services */}
        {step === 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">اختر الخدمة أو الخدمات</h2>
            {services.length === 0 ? <LoadingSpinner /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {services.map(service => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    selectable
                    isSelected={!!selectedServices.find(s => s.id === service.id)}
                    onSelect={toggleService}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 1: Barber */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">اختر الحلاق</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {barbers.map(barber => (
                <div
                  key={barber.id}
                  onClick={() => setSelectedBarber(barber)}
                  className={`card card-hover cursor-pointer flex items-center gap-4 transition-all ${selectedBarber?.id === barber.id ? 'border-amber-500 bg-amber-500/5' : 'hover:border-zinc-600'}`}
                >
                  <div className="w-14 h-14 bg-zinc-700 rounded-full overflow-hidden shrink-0">
                    {barber.image_url ? (
                      <img src={barber.image_url} alt={barber.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-zinc-500">{barber.full_name?.charAt(0)}</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold">{barber.full_name}</h3>
                    <p className="text-amber-500 text-sm">{barber.experience_years} سنوات خبرة</p>
                    <p className="text-zinc-400 text-xs mt-1 line-clamp-1">{barber.bio}</p>
                  </div>
                  {selectedBarber?.id === barber.id && <CheckCircle size={20} className="text-amber-500 shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Date + Time */}
        {step === 2 && (
          <div className="space-y-8">
            {/* Day picker */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-amber-500" /> اختر اليوم
              </h2>
              {barberAvailability.length === 0 ? (
                <div className="flex justify-center py-6"><LoadingSpinner /></div>
              ) : (
                <DayPicker
                  selected={selectedDate}
                  onSelect={date => { setSelectedDate(date); setSelectedTime(''); }}
                  availability={barberAvailability}
                />
              )}
            </div>

            {/* Time slots — appear after day is picked */}
            {selectedDate && (
              <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-amber-500" /> اختر الوقت
                </h2>
                <TimeSlotPicker
                  slots={slots}
                  selected={selectedTime}
                  onSelect={setSelectedTime}
                  isLoading={slotsLoading}
                  date={selectedDate}
                />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Customer Info */}
        {step === 3 && (
          <div className="space-y-4 max-w-md">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <User size={20} className="text-amber-500" /> بياناتك
            </h2>
            <FormInput
              label="الاسم الكامل"
              value={form.customer_name}
              onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
              placeholder="أدخل اسمك الكامل"
              required
            />
            <FormInput
              label="رقم الهاتف"
              type="tel"
              value={form.customer_phone}
              onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))}
              placeholder="+972xxxxxxxxx"
              required
            />
            <FormTextarea
              label="ملاحظات (اختياري)"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="أي طلبات خاصة أو ملاحظات..."
              rows={3}
            />
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-zinc-800">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="btn-secondary flex items-center gap-2 disabled:opacity-30"
          >
            <ChevronRight size={18} />
            السابق
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed}
              className="btn-primary flex items-center gap-2 disabled:opacity-30"
            >
              التالي
              <ChevronLeft size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed || isSubmitting}
              className="btn-primary flex items-center gap-2 disabled:opacity-30 px-8"
            >
              {isSubmitting ? <><LoadingSpinner size="sm" /> جاري الحجز...</> : 'تأكيد الحجز'}
            </button>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
