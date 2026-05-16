import { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BarberAvailability } from '../../types';
import { formatTimeArabic } from '../../utils/helpers';

const DAY_NAMES = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

interface Props {
  selected: string;
  onSelect: (date: string) => void;
  availability: BarberAvailability[];
}

export default function DayPicker({ selected, onSelect, availability }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const availMap = Object.fromEntries(availability.map(a => [a.day_of_week, a]));

  // Scroll selected day into view on mount or selection change
  useEffect(() => {
    if (scrollRef.current && selected) {
      const el = scrollRef.current.querySelector(`[data-date="${selected}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selected]);

  const scroll = (dir: 'prev' | 'next') => {
    scrollRef.current?.scrollBy({ left: dir === 'next' ? 200 : -200, behavior: 'smooth' });
  };

  const shortHours = (avail: BarberAvailability) => {
    const s = formatTimeArabic(avail.start_time).replace(':00', '');
    const e = formatTimeArabic(avail.end_time).replace(':00', '');
    return `${s}-${e}`;
  };

  return (
    <div className="relative" dir="ltr">
      {/* Prev button */}
      <button
        type="button"
        onClick={() => scroll('prev')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-zinc-800 hover:bg-amber-500 text-zinc-300 hover:text-white rounded-full p-1.5 shadow transition-colors"
      >
        <ChevronLeft size={14} />
      </button>

      {/* Scrollable days */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto px-8 py-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {days.map(d => {
          const dateStr = d.toISOString().split('T')[0];
          const dow = d.getDay();
          const avail = availMap[dow];
          const isOff = !avail || !avail.is_available;
          const isSelected = selected === dateStr;
          const isToday = d.getTime() === today.getTime();

          return (
            <button
              key={dateStr}
              data-date={dateStr}
              type="button"
              disabled={isOff}
              onClick={() => onSelect(dateStr)}
              className={`flex-shrink-0 w-[72px] rounded-xl py-2.5 px-1 text-center transition-all duration-150 ${
                isOff
                  ? 'bg-zinc-900 border border-zinc-800 cursor-not-allowed opacity-50'
                  : isSelected
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25 border border-amber-400'
                  : isToday
                  ? 'bg-zinc-800 border border-amber-500/50 text-white hover:border-amber-500'
                  : 'bg-zinc-800 border border-zinc-700 hover:border-amber-500/60 text-zinc-300'
              }`}
            >
              <div className="text-[11px] font-medium mb-0.5 opacity-80">
                {DAY_NAMES[dow]}
              </div>
              <div className="text-xl font-bold leading-none">
                {isToday ? <span className="text-sm">اليوم</span> : d.getDate()}
              </div>
              <div className="text-[10px] mt-0.5 opacity-60">
                {d.toLocaleDateString('ar-SA', { month: 'short' })}
              </div>
              <div className={`text-[10px] mt-1 font-medium leading-tight ${isOff ? 'text-red-400' : isSelected ? 'text-white/90' : 'text-amber-400'}`}>
                {isOff ? 'عطلة' : shortHours(avail)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Next button */}
      <button
        type="button"
        onClick={() => scroll('next')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-zinc-800 hover:bg-amber-500 text-zinc-300 hover:text-white rounded-full p-1.5 shadow transition-colors"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
