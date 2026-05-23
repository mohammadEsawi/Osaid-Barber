import { Clock } from 'lucide-react';
import { TimeSlot } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';
import { formatTimeArabic } from '../../utils/helpers';

interface Props {
  slots: TimeSlot[];
  selected: string;
  onSelect: (time: string) => void;
  isLoading?: boolean;
  date?: string; // YYYY-MM-DD — needed to detect past slots on today
}

interface SlotWithState extends TimeSlot {
  isPast: boolean;
}

const timeToMins = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const localDateStr = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function groupSlots(slots: SlotWithState[]) {
  const night: SlotWithState[] = [];   // 12ص – 8ص
  const day: SlotWithState[] = [];     // 8ص – 4م
  const evening: SlotWithState[] = []; // 4م – 12ل
  for (const s of slots) {
    const h = parseInt(s.time.split(':')[0]);
    if (h < 8) night.push(s);
    else if (h < 16) day.push(s);
    else evening.push(s);
  }
  return [
    { label: 'فجر / ليل', icon: '🌙', slots: night },
    { label: 'صباح / ظهر', icon: '☀️', slots: day },
    { label: 'عصر / مساء', icon: '🌆', slots: evening },
  ].filter(g => g.slots.length > 0);
}

export default function TimeSlotPicker({ slots, selected, onSelect, isLoading, date }: Props) {
  if (isLoading) return <div className="flex justify-center py-10"><LoadingSpinner /></div>;

  if (slots.length === 0) {
    return (
      <div className="text-center py-10 text-zinc-500">
        <Clock size={36} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium">لا توجد أوقات متاحة لهذا اليوم</p>
        <p className="text-sm mt-1 text-zinc-600">جرّب يوماً آخر</p>
      </div>
    );
  }

  const now = new Date();
  const isToday = date === localDateStr(now);
  const currentMins = now.getHours() * 60 + now.getMinutes();

  const enriched: SlotWithState[] = slots.map(s => ({
    ...s,
    isPast: isToday && timeToMins(s.time) <= currentMins,
  }));

  const hasSelectable = enriched.some(s => s.available && !s.isPast);

  if (!hasSelectable) {
    return (
      <div className="text-center py-10 text-zinc-500">
        <Clock size={36} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium">جميع المواعيد محجوزة أو انتهت لهذا اليوم</p>
        <p className="text-sm mt-1 text-zinc-600">جرّب يوماً آخر</p>
      </div>
    );
  }

  const groups = groupSlots(enriched);

  return (
    <div className="space-y-5">
      {groups.map(group => (
        <div key={group.label}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">{group.icon}</span>
            <span className="text-sm font-semibold text-zinc-400">{group.label}</span>
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-xs text-zinc-600">
              {group.slots.filter(s => s.available && !s.isPast).length} وقت متاح
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {group.slots.map(slot => {
              const isSelected = selected === slot.time;
              const isDisabled = !slot.available || slot.isPast;
              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => onSelect(slot.time)}
                  className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isSelected
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105'
                      : slot.isPast
                      ? 'bg-zinc-900 text-red-400/50 border border-red-900/20 line-through cursor-not-allowed'
                      : !slot.available
                      ? 'bg-red-950/40 text-red-400 border border-red-800/40 cursor-not-allowed'
                      : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700 hover:border-amber-500/50'
                  }`}
                >
                  {formatTimeArabic(slot.time)}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
