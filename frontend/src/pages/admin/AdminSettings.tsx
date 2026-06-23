import { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, Scissors, Users, Package, ShoppingBag, BarChart3, Settings, Save, MessageSquare, Clock, Archive, Smartphone, Eye } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { FormInput, FormTextarea } from '../../components/ui/FormInput';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../../services/api';
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

type SettingsMap = Record<string, string>;

const DEFAULT_CONFIRMATION =
  'مرحباً {name} 👋\nتم تأكيد حجزك في صالون أسيد ✅\n\n📅 {date}\n⏰ {time}\n💈 {barber}\n✂️ {services} — {price}₪\n\nرقم حجزك: #{id}';

const DEFAULT_REMINDER =
  'تذكير 🔔\nموعدك في صالون أسيد بعد 30 دقيقة!\n\n⏰ {time}\n💈 {barber}\n\nنراك قريباً ✂️';

const VARS = [
  { key: '{name}',     label: 'اسم العميل' },
  { key: '{date}',     label: 'التاريخ' },
  { key: '{time}',     label: 'الوقت' },
  { key: '{barber}',   label: 'اسم الحلاق' },
  { key: '{services}', label: 'الخدمات' },
  { key: '{price}',    label: 'المبلغ' },
  { key: '{id}',       label: 'رقم الحجز' },
];

const DEFAULTS: SettingsMap = {
  shop_name: 'أوسيد باربر',
  shop_phone: '+972 515718974',
  shop_email: 'info@osaidbarber.com',
  shop_address: 'بيتا الفوقا - نابلس',
  shop_description: 'صالون حلاقة احترافي يقدم أفضل الخدمات',
  shop_location_url: '',
  stat_1_value: '+2000', stat_1_label: 'عميل سعيد',
  stat_2_value: '10+',   stat_2_label: 'سنوات خبرة',
  stat_3_value: '8',     stat_3_label: 'خدمة متخصصة',
  stat_4_value: '4.9',   stat_4_label: 'تقييم العملاء',
  booking_cancellation_hours: '2',
  slot_duration_minutes: '30',
  shop_open_time: '09:00',
  shop_close_time: '21:00',
  shop_break_start: '15:00',
  shop_break_end: '16:00',
  whatsapp_confirmation_enabled: 'true',
  whatsapp_reminder_enabled: 'true',
  whatsapp_confirmation_template: DEFAULT_CONFIRMATION,
  whatsapp_reminder_template: DEFAULT_REMINDER,
};

export default function AdminSettings() {
  const [form, setForm] = useState<SettingsMap>(DEFAULTS);
  const [isSaving, setIsSaving] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: () => settingsApi.getAll() });

  useEffect(() => {
    if (data?.data?.data) {
      setForm(prev => ({ ...prev, ...data.data.data }));
    }
  }, [data]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await settingsApi.updateMany(form);
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success('تم حفظ الإعدادات بنجاح');
    } catch {
      toast.error('فشل حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <DashboardLayout navItems={adminNav} title="الإعدادات">
      <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout navItems={adminNav} title="الإعدادات">
      <div className="max-w-2xl page-enter">
        <form onSubmit={handleSave} className="space-y-6">

          {/* Shop info */}
          <div className="card">
            <h2 className="text-white font-bold text-lg mb-4">معلومات الصالون</h2>
            <div className="space-y-4">
              <FormInput label="اسم الصالون" value={form.shop_name} onChange={set('shop_name')} />
              <FormInput label="رقم الهاتف" type="tel" value={form.shop_phone} onChange={set('shop_phone')} />
              <FormInput label="البريد الإلكتروني" type="email" value={form.shop_email} onChange={set('shop_email')} />
              <FormTextarea label="العنوان" value={form.shop_address} onChange={set('shop_address')} rows={2} />
              <FormInput
                label="رابط الموقع على الخريطة (Google Maps)"
                value={form.shop_location_url}
                onChange={set('shop_location_url')}
                placeholder="الصق رابط مشاركة Google Maps هنا..."
              />
              <FormTextarea label="وصف الصالون" value={form.shop_description} onChange={set('shop_description')} rows={3} />
            </div>
          </div>

          {/* Stats */}
          <div className="card">
            <h2 className="text-white font-bold text-lg mb-4">الإحصائيات (الصفحة الرئيسية)</h2>
            <div className="space-y-3">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="grid grid-cols-2 gap-3">
                  <FormInput
                    label={`الإحصاء ${n} — القيمة`}
                    value={form[`stat_${n}_value`]}
                    onChange={set(`stat_${n}_value`)}
                    placeholder="+2000"
                  />
                  <FormInput
                    label="التسمية"
                    value={form[`stat_${n}_label`]}
                    onChange={set(`stat_${n}_label`)}
                    placeholder="عميل سعيد"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Booking */}
          <div className="card">
            <h2 className="text-white font-bold text-lg mb-4">إعدادات الحجز</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">وقت الفتح</label>
                  <input type="time" value={form.shop_open_time} onChange={set('shop_open_time')} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">وقت الإغلاق</label>
                  <input type="time" value={form.shop_close_time} onChange={set('shop_close_time')} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">بداية الاستراحة</label>
                  <input type="time" value={form.shop_break_start} onChange={set('shop_break_start')} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">نهاية الاستراحة</label>
                  <input type="time" value={form.shop_break_end} onChange={set('shop_break_end')} className="input-field" />
                </div>
              </div>
              <FormInput label="مدة الحلقة الزمنية (دقيقة)" type="number" value={form.slot_duration_minutes} onChange={set('slot_duration_minutes')} min="15" step="15" />
              <FormInput label="مهلة إلغاء الموعد (ساعات)" type="number" value={form.booking_cancellation_hours} onChange={set('booking_cancellation_hours')} min="0" />
            </div>
          </div>

          {/* WhatsApp */}
          <div className="card space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
              <div className="w-9 h-9 bg-green-500/15 rounded-xl flex items-center justify-center">
                <Smartphone size={18} className="text-green-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg leading-none">رسائل واتساب</h2>
                <p className="text-zinc-500 text-xs mt-0.5">تحكم بالرسائل التلقائية للعملاء</p>
              </div>
            </div>

            {/* المتغيرات المتاحة */}
            <div className="bg-zinc-800/50 rounded-xl p-3">
              <p className="text-zinc-400 text-xs mb-2 font-medium">المتغيرات المتاحة في الرسائل:</p>
              <div className="flex flex-wrap gap-1.5">
                {VARS.map(v => (
                  <span key={v.key} className="text-xs bg-zinc-900 border border-zinc-700 text-amber-400 px-2 py-0.5 rounded font-mono">
                    {v.key} <span className="text-zinc-500">= {v.label}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* رسالة التأكيد */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-white font-medium text-sm">رسالة تأكيد الحجز (فورية)</label>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, whatsapp_confirmation_enabled: f.whatsapp_confirmation_enabled === 'true' ? 'false' : 'true' }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${form.whatsapp_confirmation_enabled === 'true' ? 'bg-green-500' : 'bg-zinc-700'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.whatsapp_confirmation_enabled === 'true' ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <textarea
                value={form.whatsapp_confirmation_template}
                onChange={set('whatsapp_confirmation_template')}
                rows={6}
                dir="rtl"
                className="input-field w-full font-mono text-sm leading-relaxed resize-none"
                disabled={form.whatsapp_confirmation_enabled !== 'true'}
              />
              {/* معاينة */}
              {form.whatsapp_confirmation_enabled === 'true' && (
                <details className="group">
                  <summary className="flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors select-none">
                    <Eye size={13} /> معاينة الرسالة
                  </summary>
                  <div className="mt-2 bg-[#0d1117] border border-zinc-800 rounded-xl p-3 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed" dir="rtl">
                    {form.whatsapp_confirmation_template
                      .replace('{name}',     'أحمد محمد')
                      .replace('{date}',     '27 مايو 2026')
                      .replace('{time}',     '3:00 م')
                      .replace('{barber}',   'أسيد دويكات')
                      .replace('{services}', 'قص شعر + لحية')
                      .replace('{price}',    '80')
                      .replace('{id}',       '142')}
                  </div>
                </details>
              )}
            </div>

            {/* رسالة التذكير */}
            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <label className="text-white font-medium text-sm">رسالة التذكير (قبل 30 دقيقة)</label>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, whatsapp_reminder_enabled: f.whatsapp_reminder_enabled === 'true' ? 'false' : 'true' }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${form.whatsapp_reminder_enabled === 'true' ? 'bg-green-500' : 'bg-zinc-700'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.whatsapp_reminder_enabled === 'true' ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <textarea
                value={form.whatsapp_reminder_template}
                onChange={set('whatsapp_reminder_template')}
                rows={5}
                dir="rtl"
                className="input-field w-full font-mono text-sm leading-relaxed resize-none"
                disabled={form.whatsapp_reminder_enabled !== 'true'}
              />
              {form.whatsapp_reminder_enabled === 'true' && (
                <details className="group">
                  <summary className="flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors select-none">
                    <Eye size={13} /> معاينة الرسالة
                  </summary>
                  <div className="mt-2 bg-[#0d1117] border border-zinc-800 rounded-xl p-3 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed" dir="rtl">
                    {form.whatsapp_reminder_template
                      .replace('{name}',   'أحمد محمد')
                      .replace('{time}',   '3:00 م')
                      .replace('{barber}', 'أسيد دويكات')}
                  </div>
                </details>
              )}
            </div>
          </div>

          <button type="submit" disabled={isSaving} className="btn-primary flex items-center gap-2 py-3 px-8">
            {isSaving ? <LoadingSpinner size="sm" /> : <Save size={18} />}
            {isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
