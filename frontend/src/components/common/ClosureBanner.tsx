import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { closuresApi } from '../../services/api';
import { formatTimeArabic, localTodayStr } from '../../utils/helpers';
import toast from 'react-hot-toast';

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
  const shown = useRef(false);

  const { data } = useQuery({
    queryKey: ['closures-banner'],
    queryFn: () => closuresApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (shown.current) return;
    const closures: Closure[] = data?.data?.data || [];
    if (closures.length === 0) return;

    const today = localTodayStr();
    const dayName = DAYS_AR[new Date().getDay()];

    for (const c of closures) {
      const start = (c.start_date || '').substring(0, 10);
      const end = (c.end_date || '').substring(0, 10);
      if (today >= start && today <= end) {
        shown.current = true;
        const hasTime = c.start_time && c.end_time;
        const msg = hasTime
          ? `مغلق اليوم ${dayName} من ${formatTimeArabic(c.start_time!)} إلى ${formatTimeArabic(c.end_time!)}`
          : `مغلق اليوم ${dayName} — يوم كامل`;

        toast(msg, {
          icon: '🔒',
          duration: 6000,
          style: {
            background: '#27272a',
            color: '#fff',
            border: '1px solid #f87171',
            fontFamily: 'Cairo, sans-serif',
            direction: 'rtl',
            padding: '12px 16px',
            fontSize: '14px',
          },
        });
        break;
      }
    }
  }, [data]);

  return null;
}
