import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import { closuresApi } from '../../services/api';
import { formatDate, formatTimeArabic, localTodayStr } from '../../utils/helpers';

interface Closure {
  id: number;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
}

export default function ClosureBanner() {
  const [dismissed, setDismissed] = useState<number[]>([]);

  const { data } = useQuery({
    queryKey: ['closures-banner'],
    queryFn: () => closuresApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const closures: Closure[] = data?.data?.data || [];
  const today = localTodayStr();

  const active = closures.filter(c => {
    const start = (c.start_date || '').substring(0, 10);
    const end = (c.end_date || '').substring(0, 10);
    return today >= start && today <= end && !dismissed.includes(c.id);
  });

  if (active.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999]">
      {active.map(c => (
        <div key={c.id} className="bg-red-600 text-white px-4 py-3 flex items-center justify-center gap-3 text-sm font-medium shadow-lg" dir="rtl">
          <AlertTriangle size={18} className="shrink-0" />
          <span>
            {c.reason || 'الصالون مغلق'} — {formatDate(today)}
            {c.start_time && c.end_time
              ? ` من ${formatTimeArabic(c.start_time)} إلى ${formatTimeArabic(c.end_time)}`
              : ' — يوم كامل'}
          </span>
          <button onClick={() => setDismissed(d => [...d, c.id])} className="p-1 hover:bg-red-700 rounded shrink-0">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
