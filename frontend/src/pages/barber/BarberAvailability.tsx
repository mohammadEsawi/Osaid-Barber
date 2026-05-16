import { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, Clock, Settings, Save, Plus, Trash2, User } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { barbersApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { BarberAvailability as AvailabilityType, DAYS_AR } from '../../types';
import toast from 'react-hot-toast';

const barberNav = [
  { href: '/barber', label: 'لوحة التحكم', icon: <LayoutDashboard size={18} /> },
  { href: '/barber/appointments', label: 'المواعيد', icon: <Calendar size={18} /> },
  { href: '/barber/calendar', label: 'التقويم', icon: <Clock size={18} /> },
  { href: '/barber/availability', label: 'أوقات العمل', icon: <Settings size={18} /> },
  { href: '/barber/profile', label: 'ملفي الشخصي', icon: <User size={18} /> },
];

export default function BarberAvailability() {
  const { user } = useAuth();
  const barberId = user?.barber?.id;
  const qc = useQueryClient();

  const [availability, setAvailability] = useState<AvailabilityType[]>([]);
  const [unavailableDate, setUnavailableDate] = useState('');
  const [unavailableStart, setUnavailableStart] = useState('');
  const [unavailableEnd, setUnavailableEnd] = useState('');
  const [unavailableReason, setUnavailableReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingSlot, setIsAddingSlot] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['barber-availability', barberId],
    queryFn: () => barbersApi.getAvailability(barberId!),
    enabled: !!barberId,
  });

  const { data: slotsData, refetch: refetchSlots } = useQuery({
    queryKey: ['barber-unavailable', barberId],
    queryFn: () => barbersApi.getUnavailableSlots(barberId!),
    enabled: !!barberId,
  });

  useEffect(() => {
    const raw: AvailabilityType[] = data?.data?.data || [];
    if (raw.length > 0) { setAvailability(raw); return; }
    // Default availability for all days
    setAvailability(DAYS_AR.map((_, i) => ({ id: 0, barber_id: barberId || 0, day_of_week: i, start_time: i === 6 ? '10:00' : '09:00', end_time: i === 6 ? '17:00' : '21:00', is_available: i !== 1 })));
  }, [data, barberId]);

  const unavailableSlots = slotsData?.data?.data || [];

  const saveAvailability = async () => {
    if (!barberId) return;
    setIsSaving(true);
    try {
      await barbersApi.updateAvailability(barberId, { availability });
      toast.success('تم حفظ أوقات العمل');
      qc.invalidateQueries({ queryKey: ['barber-availability', barberId] });
    } catch { toast.error('فشل الحفظ'); } finally { setIsSaving(false); }
  };

  const addUnavailableSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barberId || !unavailableDate) return;
    setIsAddingSlot(true);
    try {
      await barbersApi.addUnavailableSlot(barberId, { unavailable_date: unavailableDate, start_time: unavailableStart || null, end_time: unavailableEnd || null, reason: unavailableReason });
      toast.success('تم إضافة الوقت غير المتاح');
      refetchSlots();
      setUnavailableDate(''); setUnavailableStart(''); setUnavailableEnd(''); setUnavailableReason('');
    } catch { toast.error('فشل الإضافة'); } finally { setIsAddingSlot(false); }
  };

  const removeSlot = async (slotId: number) => {
    if (!barberId) return;
    try {
      await barbersApi.removeUnavailableSlot(barberId, slotId);
      toast.success('تم الحذف');
      refetchSlots();
    } catch { toast.error('فشل الحذف'); }
  };

  if (isLoading) return <DashboardLayout navItems={barberNav} title="أوقات العمل"><div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div></DashboardLayout>;

  return (
    <DashboardLayout navItems={barberNav} title="إدارة أوقات العمل">
      <div className="space-y-6 page-enter max-w-2xl">
        {/* Weekly schedule */}
        <div className="card">
          <h2 className="text-white font-bold text-lg mb-4">الجدول الأسبوعي</h2>
          <div className="space-y-3">
            {availability.map((slot, idx) => (
              <div key={slot.day_of_week} className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${slot.is_available ? 'bg-zinc-800' : 'bg-zinc-900 opacity-60'}`}>
                <label className="flex items-center gap-2 w-28 cursor-pointer shrink-0">
                  <input type="checkbox" checked={slot.is_available} onChange={e => {
                    const updated = [...availability];
                    updated[idx] = { ...slot, is_available: e.target.checked };
                    setAvailability(updated);
                  }} className="w-4 h-4 accent-amber-500" />
                  <span className="text-zinc-300 font-medium text-sm">{DAYS_AR[slot.day_of_week]}</span>
                </label>
                {slot.is_available ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input type="time" value={slot.start_time} onChange={e => {
                      const updated = [...availability]; updated[idx] = { ...slot, start_time: e.target.value }; setAvailability(updated);
                    }} className="input-field text-sm py-1.5 flex-1" />
                    <span className="text-zinc-500">—</span>
                    <input type="time" value={slot.end_time} onChange={e => {
                      const updated = [...availability]; updated[idx] = { ...slot, end_time: e.target.value }; setAvailability(updated);
                    }} className="input-field text-sm py-1.5 flex-1" />
                  </div>
                ) : (
                  <span className="text-zinc-600 text-sm">يوم عطلة</span>
                )}
              </div>
            ))}
          </div>
          <button onClick={saveAvailability} disabled={isSaving} className="btn-primary flex items-center gap-2 mt-4">
            {isSaving ? <LoadingSpinner size="sm" /> : <Save size={16} />}
            حفظ الجدول
          </button>
        </div>

        {/* Unavailable slots */}
        <div className="card">
          <h2 className="text-white font-bold text-lg mb-4">أوقات غير متاحة (إجازات / مواعيد خاصة)</h2>
          <form onSubmit={addUnavailableSlot} className="grid grid-cols-2 gap-3 mb-4">
            <div className="col-span-2">
              <label className="label">التاريخ</label>
              <input type="date" value={unavailableDate} onChange={e => setUnavailableDate(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="label">من (اختياري)</label>
              <input type="time" value={unavailableStart} onChange={e => setUnavailableStart(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label">إلى (اختياري)</label>
              <input type="time" value={unavailableEnd} onChange={e => setUnavailableEnd(e.target.value)} className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="label">السبب (اختياري)</label>
              <input type="text" value={unavailableReason} onChange={e => setUnavailableReason(e.target.value)} placeholder="إجازة، موعد شخصي..." className="input-field" />
            </div>
            <button type="submit" disabled={isAddingSlot} className="btn-primary col-span-2 flex items-center justify-center gap-2">
              {isAddingSlot ? <LoadingSpinner size="sm" /> : <Plus size={16} />}
              إضافة
            </button>
          </form>

          {unavailableSlots.length > 0 && (
            <div className="space-y-2 border-t border-zinc-800 pt-4">
              {unavailableSlots.map((slot: { id: number; unavailable_date: string; start_time?: string; end_time?: string; reason?: string }) => (
                <div key={slot.id} className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2">
                  <div>
                    <span className="text-white text-sm font-medium">{slot.unavailable_date}</span>
                    {slot.start_time && <span className="text-zinc-400 text-xs mr-2">{slot.start_time.substring(0, 5)} - {slot.end_time?.substring(0, 5)}</span>}
                    {slot.reason && <span className="text-zinc-500 text-xs mr-2">({slot.reason})</span>}
                  </div>
                  <button onClick={() => removeSlot(slot.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
