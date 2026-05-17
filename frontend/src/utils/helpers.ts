import { DAYS_AR } from '../types';

export const CURRENCY = '₪';

export const formatPrice = (price: number | string): string =>
  `${CURRENCY}${parseFloat(String(price)).toFixed(2)}`;

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('ar-SA', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
};

export const formatTime = (timeStr: string): string => {
  if (!timeStr) return '';
  return timeStr.substring(0, 5);
};

export const formatTimeArabic = (timeStr: string): string => {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.substring(0, 5).split(':');
  const h = parseInt(hStr);
  const period = h < 12 ? 'ص' : 'م';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${mStr} ${period}`;
};

export const formatDateTime = (dateStr: string, timeStr?: string): string => {
  const date = formatDate(dateStr);
  if (!timeStr) return date;
  return `${date} — ${formatTime(timeStr)}`;
};

export const getDayName = (dayOfWeek: number): string => DAYS_AR[dayOfWeek] ?? '';

export const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

export const generateTimeSlots = (start: string, end: string, step = 30): string[] => {
  const slots: string[] = [];
  let current = timeToMinutes(start);
  const endMins = timeToMinutes(end);
  while (current < endMins) {
    slots.push(minutesToTime(current));
    current += step;
  }
  return slots;
};

export const calcTotalDuration = (services: { duration_minutes: number }[]): number =>
  services.reduce((sum, s) => sum + s.duration_minutes, 0);

export const calcTotalPrice = (services: { price: number }[]): number =>
  services.reduce((sum, s) => sum + Number(s.price), 0);

export const truncate = (str: string, max = 60): string =>
  str?.length > max ? str.substring(0, max) + '...' : str;

export const classNames = (...classes: (string | undefined | false | null)[]): string =>
  classes.filter(Boolean).join(' ');

// Palestinian/Israeli mobile: starts with 05, exactly 10 digits
export const validatePhone = (phone: string): string | null => {
  const cleaned = phone.replace(/\s+/g, '');
  if (!/^05\d{8}$/.test(cleaned)) {
    return 'رقم الهاتف يجب أن يبدأ بـ 05 ويتكون من 10 أرقام';
  }
  return null;
};
