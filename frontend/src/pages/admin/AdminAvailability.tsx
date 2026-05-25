import { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, Scissors, Users, Package, ShoppingBag, BarChart3, Settings, Save, Plus, Trash2, MessageSquare, Clock, Archive } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { barbersApi } from '../../services/api';
import { BarberProfile, BarberAvailability, DAYS_AR } from '../../types';
import toast from 'react-hot-toast';

const adminNav = [
  { href: '/admin', label: 'الرئيسية', icon: <LayoutDashboard size={18} /> },
  { href: '/admin/bookings', label: 'المواعيد', icon: <Calendar size={18} /> },
  { href: '/admin/archive', label: 'الأرشيف', icon: <Archive size={18} /> },
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

const DEFAULT_AVAIL = (): BarberAvailability[] =>
  DAYS_AR.map((_, i) => ({
    id: 0, barber_id: 0, day_of_week: i,
    start_time: i === 6 ? '10:00' : '09:00',
    end_time: i === 6 ? '17:00' : '21:00',
    is_available: i !== 1,
  }));

interface UnavailableSlot {
  id: number;
  unavailable_date: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
}

function BarberSchedulePanel({ barber }: { barber: BarberProfile }) {
  const qc = useQueryClient();
  const [schedule, setSchedule] = useState<BarberAvailability[]>(DEFAULT_AVAIL());
  const [isSaving, setIsSaving] = useState(false);
  const [blockDate, setBlockDate] = useState('');
  const [blockStart, setBlockStart] = useState('');
  const [blockEnd, setBlockEnd] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const { data: availData, isLoading: availLoading } = useQuery({
    queryKey: ['barber-availability-admin', barber.id],
    queryFn: () => barbersApi.getAvailability(barber.id),
  });

  const { data: slotsData, refetch: refetchSlots } = useQuery({
    queryKey: ['barber-blocked-admin', barber.id],
    queryFn: () => barbersApi.getUnavailableSlots(barber.id),
  });

  const unavailableSlots: UnavailableSlot[] = slotsData?.data?.data || [];

  useEffect(() => {
    const raw: BarberAvailability[] = availData?.data?.data || [];
    if (raw.length > 0) {
      setSchedule(
        DEFAULT_AVAIL().map(def => {
          const found = raw.find(r => r.day_of_week === def.day_of_week);
          return found ? { ...found } : def;
        })
      );
    }
  }, [availData]);

  const updateDay = (idx: number, field: keyof BarberAvailability, value: string | boolean) => {
    setSchedule(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await barbersApi.updateAvailability(barber.id, { availability: schedule });
      toast.success(`تم حفظ جدول ${barber.full_name}`);
      qc.invalidateQueries({ queryKey: ['barber-availability'] });
    } catch { toast.error('فشل الحفظ'); }
    finally { setIsSaving(false); }
  };

  const handleBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDate) return;
    setIsBlocking(true);
    try {
      await barbersApi.addUnavailableSlot(barber.id, {
        unavailable_date: blockDate,
        start_time: blockStart || null,
        end_time: blockEnd || null,
        reason: blockReason || 'عطلة',
      });
      toast.success('تم إضافة الإغلاق');
      refetchSlots();
      setBlockDate(''); setBlockStart(''); setBlockEnd(''); setBlockReason('');
    } catch { toast.error('فشل الإضافة'); }
    finally { setIsBlocking(false); }
  };

  const handleRemove = async (slotId: number) => {
    try {
      await barbersApi.removeUnavailableSlot(barber.id, slotId);
      toast.success('تم إلغاء الإغلاق');
      refetchSlots();
    } catch { toast.error('فشل الحذف'); }
  };

  if (availLoading) return <div className="flex justify-center py-8"><LoadingSpinner /></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Weekly schedule */}
      <div>
        <h3 className="text-white font-semibold mb-3 text-sm">الجدول الأسبوعي</h3>
        <div className="space-y-1.5">
          {schedule.map((slot, idx) => (
            <div key={slot.day_of_week} className={`flex items-center gap-3 p-2.5 rounded-xl ${slot.is_available ? 'bg-zinc-800' : 'bg-zinc-900 opacity-50'}`}>
              <label className="flex items-center gap-2 w-24 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={slot.is_available}
                  onChange={e => updateDay(idx, 'is_available', e.target.checked)}
                  className="w-4 h-4 accent-amber-500"
                />
                <span className="text-zinc-300 font-medium text-sm">{DAYS_AR[slot.day_of_week]}</span>
              </label>
              {slot.is_available ? (
                <div className="flex items-center gap-1.5 flex-1">
                  <input
                    type="time"
                    value={slot.start_time}
                    onChange={e => updateDay(idx, 'start_time', e.target.value)}
                    className="input-field text-xs py-1 flex-1 text-center"
                  />
                  <span className="text-zinc-600 text-xs">—</span>
                  <input
                    type="time"
                    value={slot.end_time}
                    onChange={e => updateDay(idx, 'end_time', e.target.value)}
                    className="input-field text-xs py-1 flex-1 text-center"
                  />
                  <span className="text-[10px] font-mono text-amber-600 bg-zinc-900 px-1.5 py-0.5 rounded shrink-0 border border-zinc-700">
                    {slot.start_time}—{slot.end_time}
                  </span>
                </div>
              ) : (
                <span className="text-zinc-600 text-xs">مغلق</span>
              )}
            </div>
          ))}
        </div>
        <button onClick={handleSave} disabled={isSaving} className="btn-primary flex items-center gap-2 mt-3 w-full justify-center text-sm py-2">
          {isSaving ? <><LoadingSpinner size="sm" />جاري الحفظ...</> : <><Save size={14} />حفظ الجدول</>}
        </button>
      </div>

      {/* Unavailable slots */}
      <div>
        <h3 className="text-white font-semibold mb-3 text-sm">إغلاق يوم / وقت محدد</h3>

        {/* Existing blocks */}
        {unavailableSlots.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {unavailableSlots.map(slot => (
              <div key={slot.id} className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <div className="text-sm">
                  <span className="text-white font-medium">{slot.unavailable_date}</span>
                  {slot.start_time && (
                    <span className="text-zinc-400 text-xs mr-2">
                      {slot.start_time.substring(0, 5)} — {slot.end_time?.substring(0, 5)}
                    </span>
                  )}
                  {slot.reason && <span className="text-red-300 text-xs mr-1">({slot.reason})</span>}
                </div>
                <button onClick={() => handleRemove(slot.id)} className="text-red-400 hover:text-red-300 p-1">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add block */}
        <form onSubmit={handleBlock} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="block text-xs text-zinc-500 mb-1">التاريخ</label>
              <input type="date" min={today} value={blockDate} onChange={e => setBlockDate(e.target.value)}
                className="input-field text-sm py-1.5 w-full" required />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">من (اختياري)</label>
              <input type="time" value={blockStart} onChange={e => setBlockStart(e.target.value)}
                className="input-field text-sm py-1.5" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">إلى (اختياري)</label>
              <input type="time" value={blockEnd} onChange={e => setBlockEnd(e.target.value)}
                className="input-field text-sm py-1.5" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-zinc-500 mb-1">السبب</label>
              <input type="text" value={blockReason} onChange={e => setBlockReason(e.target.value)}
                placeholder="عطلة، ظروف طارئة، تأخير..." className="input-field text-sm py-1.5 w-full" />
            </div>
          </div>
          <button type="submit" disabled={isBlocking || !blockDate} className="btn-danger flex items-center gap-2 w-full justify-center text-sm py-2 disabled:opacity-40">
            {isBlocking ? <><LoadingSpinner size="sm" />جاري الإضافة...</> : <><Plus size={14} />إضافة إغلاق</>}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminAvailability() {
  const [activeBarber, setActiveBarber] = useState<number | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['barbers-avail-page'], queryFn: () => barbersApi.getAll() });
  const barbers: BarberProfile[] = data?.data?.data || [];

  useEffect(() => {
    if (barbers.length > 0 && activeBarber === null) {
      setActiveBarber(barbers[0].id);
    }
  }, [barbers, activeBarber]);

  const selected = barbers.find(b => b.id === activeBarber);

  return (
    <DashboardLayout navItems={adminNav} title="إدارة أوقات العمل">
      <div className="page-enter space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : (
          <>
            {/* Barber tabs */}
            <div className="flex gap-2 flex-wrap">
              {barbers.map(b => (
                <button
                  key={b.id}
                  onClick={() => setActiveBarber(b.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                    activeBarber === b.id
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                  }`}
                >
                  {b.image_url ? (
                    <img src={b.image_url} alt={b.full_name} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-zinc-600 flex items-center justify-center text-xs font-bold">
                      {b.full_name?.charAt(0)}
                    </div>
                  )}
                  {b.full_name}
                </button>
              ))}
            </div>

            {/* Selected barber panel */}
            {selected && (
              <div className="card">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                  <div className="w-10 h-10 bg-zinc-700 rounded-full overflow-hidden shrink-0">
                    {selected.image_url
                      ? <img src={selected.image_url} alt={selected.full_name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-lg font-bold text-zinc-400">{selected.full_name?.charAt(0)}</div>
                    }
                  </div>
                  <div>
                    <h2 className="text-white font-bold">{selected.full_name}</h2>
                    <p className="text-zinc-400 text-xs">{selected.experience_years} سنوات خبرة</p>
                  </div>
                </div>
                <BarberSchedulePanel key={selected.id} barber={selected} />
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
