import { Clock } from 'lucide-react';
import { TimeSlot } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';
import { formatTimeArabic } from '../../utils/helpers';

interface Props {
  slots: TimeSlot[];
  selected: string;
  onSelect: (time: string) => void;
  isLoading?: boolean;
}

interface Group {
  label: string;
  icon: string;
  slots: TimeSlot[];
}

function groupSlots(slots: TimeSlot[]): Group[] {
  const morning: TimeSlot[] = [];
  const afternoon: TimeSlot[] = [];
  const evening: TimeSlot[] = [];

  for (const s of slots) {
    const h = parseInt(s.time.split(':')[0]);
    if (h < 12) morning.push(s);
    else if (h < 17) afternoon.push(s);
    else evening.push(s);
  }

  return [
    { label: 'الصباح', icon: '🌅', slots: morning },
    { label: 'بعد الظهر', icon: '☀️', slots: afternoon },
    { label: 'المساء', icon: '🌙', slots: evening },
  ].filter(g => g.slots.length > 0);
}

export default function TimeSlotPicker({ slots, selected, onSelect, isLoading }: Props) {
  if (isLoading) return <div className="flex justify-center py-10"><LoadingSpinner /></div>;

  const available = slots.filter(s => s.available);

  if (slots.length === 0) {
    return (
      <div className="text-center py-10 text-zinc-500">
        <Clock size={36} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium">لا توجد أوقات متاحة لهذا اليوم</p>
        <p className="text-sm mt-1 text-zinc-600">جرّب يوماً آخر</p>
      </div>
    );
  }

  if (available.length === 0) {
    return (
      <div className="text-center py-10 text-zinc-500">
        <Clock size={36} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium">جميع المواعيد محجوزة لهذا اليوم</p>
        <p className="text-sm mt-1 text-zinc-600">جرّب يوماً آخر</p>
      </div>
    );
  }

  const groups = groupSlots(available);

  return (
    <div className="space-y-5">
      {groups.map(group => (
        <div key={group.label}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">{group.icon}</span>
            <span className="text-sm font-semibold text-zinc-400">{group.label}</span>
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-xs text-zinc-600">{group.slots.length} وقت متاح</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {group.slots.map(slot => {
              const isSelected = selected === slot.time;
              return (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => onSelect(slot.time)}
                  className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isSelected
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105'
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
