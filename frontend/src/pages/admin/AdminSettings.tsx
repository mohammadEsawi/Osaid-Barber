import { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, Scissors, Users, Package, ShoppingBag, BarChart3, Settings, Save, MessageSquare } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { FormInput, FormTextarea } from '../../components/ui/FormInput';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../../services/api';
import toast from 'react-hot-toast';

const adminNav = [
  { href: '/admin', label: 'الرئيسية', icon: <LayoutDashboard size={18} /> },
  { href: '/admin/bookings', label: 'المواعيد', icon: <Calendar size={18} /> },
  { href: '/admin/services', label: 'الخدمات', icon: <Scissors size={18} /> },
  { href: '/admin/barbers', label: 'الحلاقون', icon: <Users size={18} /> },
  { href: '/admin/products', label: 'المنتجات', icon: <Package size={18} /> },
  { href: '/admin/orders', label: 'الطلبات', icon: <ShoppingBag size={18} /> },
  { href: '/admin/customers', label: 'العملاء', icon: <Users size={18} /> },
  { href: '/admin/reports', label: 'التقارير', icon: <BarChart3 size={18} /> },
  { href: '/admin/messages', label: 'الرسائل', icon: <MessageSquare size={18} /> },
  { href: '/admin/settings', label: 'الإعدادات', icon: <Settings size={18} /> },
];

type SettingsMap = Record<string, string>;

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
              <FormInput label="مدة الحلقة الزمنية (دقيقة)" type="number" value={form.slot_duration_minutes} onChange={set('slot_duration_minutes')} min="15" step="15" />
              <FormInput label="مهلة إلغاء الموعد (ساعات)" type="number" value={form.booking_cancellation_hours} onChange={set('booking_cancellation_hours')} min="0" />
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
