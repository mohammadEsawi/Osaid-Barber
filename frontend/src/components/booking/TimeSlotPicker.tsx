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

export default function TimeSlotPicker({ slots, selected, onSelect, isLoading }: Props) {
  if (isLoading) return <div className="flex justify-center py-8"><LoadingSpinner /></div>;

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        <Clock size={32} className="mx-auto mb-2 opacity-40" />
        <p>لا توجد أوقات متاحة لهذا اليوم</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map(slot => (
        <button
          key={slot.time}
          disabled={!slot.available}
          onClick={() => slot.available && onSelect(slot.time)}
          className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-150 ${
            !slot.available
              ? 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed line-through'
              : selected === slot.time
              ? 'bg-amber-500 text-white font-bold shadow-lg shadow-amber-500/20'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
          }`}
        >
          {formatTimeArabic(slot.time)}
        </button>
      ))}
    </div>
  );
}
