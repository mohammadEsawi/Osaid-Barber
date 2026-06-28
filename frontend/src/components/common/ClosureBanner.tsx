import { useQuery } from '@tanstack/react-query';
import { Lock, X } from 'lucide-react';
import { useState } from 'react';
import { closuresApi } from '../../services/api';
import { formatTimeArabic, localTodayStr } from '../../utils/helpers';

interface Closure {
  id: number;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
}

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export default function ClosureBanner() {
  const [dismissed, setDismissed] = useState<number[]>([]);

  const { data } = useQuery({
    queryKey: ['closures-banner'],
    queryFn: () => closuresApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const closures: Closure[] = data?.data?.data || [];
  const today = localTodayStr();
  const dayName = DAYS_AR[new Date().getDay()];

  const active = closures.filter(c => {
    const start = (c.start_date || '').substring(0, 10);
    const end = (c.end_date || '').substring(0, 10);
    return today >= start && today <= end && !dismissed.includes(c.id);
  });

  if (active.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999]">
      {active.map(c => {
        const hasTime = c.start_time && c.end_time;
        const reason = c.reason || 'إغلاق';

        return (
          <div key={c.id} className="bg-red-600 text-white px-4 py-3.5 shadow-lg" dir="rtl">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <Lock size={18} />
                </div>
                <div>
                  <div className="font-bold text-base">
                    {hasTime ? `مغلق اليوم (${dayName}) في فترة ${formatTimeArabic(c.start_time!)} — ${formatTimeArabic(c.end_time!)}` : `مغلق اليوم (${dayName}) — يوم كامل`}
                  </div>
                  {reason !== 'إغلاق' && (
                    <div className="text-red-100 text-sm mt-0.5">السبب: {reason}</div>
                  )}
                </div>
              </div>
              <button onClick={() => setDismissed(d => [...d, c.id])} className="p-1.5 hover:bg-red-700 rounded-lg shrink-0">
                <X size={18} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
