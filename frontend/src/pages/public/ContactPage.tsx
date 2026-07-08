import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, ExternalLink } from 'lucide-react';
import { FaInstagram, FaFacebook, FaTiktok } from 'react-icons/fa';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { FormInput, FormTextarea } from '../../components/ui/FormInput';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { messagesApi, settingsApi } from '../../services/api';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const { data: settingsData } = useQuery({ queryKey: ['settings'], queryFn: () => settingsApi.getAll() });
  const s = settingsData?.data?.data || {};
  const locationUrl = s.shop_location_url || '';

  const [form, setForm] = useState({ sender_name: '', sender_phone: '', sender_email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sender_name || !form.message) {
      toast.error('يرجى إدخال الاسم والرسالة');
      return;
    }
    setIsSubmitting(true);
    try {
      await messagesApi.send(form);
      toast.success('تم إرسال رسالتك بنجاح، سنتواصل معك قريباً');
      setForm({ sender_name: '', sender_phone: '', sender_email: '', message: '' });
    } catch {
      toast.error('حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <Helmet>
        <title>تواصل معنا | أوسيد باربر</title>
        <meta name="description" content="تواصل مع أوسيد باربر. عنواننا: بيتا الفوقا، نابلس. رقم الهاتف: 0515718974. أو أرسل لنا رسالة مباشرة." />
        <link rel="canonical" href="https://osaid-barber.vercel.app/contact" />
      </Helmet>
      <Navbar />
      <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h1 className="section-title">تواصل معنا</h1>
          <p className="section-subtitle">نحن هنا للإجابة على جميع استفساراتك</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Contact info */}
          <div>
            <h2 className="text-xl font-bold text-white mb-6">معلومات التواصل</h2>
            <div className="space-y-4 mb-8">
              {[
                { icon: Phone,  label: 'الهاتف',               value: s.shop_phone || '+972 515718974', href: null },
                { icon: Mail,   label: 'البريد الإلكتروني',    value: s.shop_email || 'info@osaidbarber.com', href: null },
                { icon: MapPin, label: 'العنوان',               value: s.shop_address || 'بيتا الفوقا - نابلس', href: locationUrl },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 card py-4">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0">
                    <item.icon size={18} className="text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <div className="text-zinc-400 text-xs mb-0.5">{item.label}</div>
                    {item.href ? (
                      <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-white font-medium hover:text-amber-500 transition-colors flex items-center gap-1">
                        {item.value}
                        <ExternalLink size={13} className="text-amber-500" />
                      </a>
                    ) : (
                      <div className="text-white font-medium">{item.value}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="card">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Clock size={18} className="text-amber-500" />
                ساعات العمل
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-zinc-400">الأحد - الخميس</span><span className="text-white">9 ص - 9 م</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">السبت</span><span className="text-white">10 ص - 5 م</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">الاثنين</span><span className="text-red-400">مغلق</span></div>
              </div>
            </div>

            {/* Social media */}
            <div className="card">
              <h3 className="text-white font-semibold mb-4">تابعنا على</h3>
              <div className="flex gap-3">
                {[
                  { href: 'https://www.instagram.com/osaid.dwikat', icon: FaInstagram, label: 'انستقرام', color: 'hover:bg-pink-600' },
                  { href: 'https://www.facebook.com/osaid.dwikat', icon: FaFacebook,  label: 'فيسبوك',   color: 'hover:bg-blue-600' },
                  { href: 'https://www.tiktok.com/@osaid.dwikat',   icon: FaTiktok,   label: 'تيك توك',   color: 'hover:bg-zinc-600' },
                ].map(({ href, icon: Icon, label, color }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={label}
                    className={`flex items-center gap-2 px-4 py-2.5 bg-zinc-800 ${color} rounded-xl text-zinc-400 hover:text-white transition-all text-sm font-medium`}
                  >
                    <Icon size={18} />
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="card mt-12">
            <h2 className="text-xl font-bold text-white mb-6">أرسل لنا رسالة</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput
                label="الاسم الكامل"
                placeholder="أدخل اسمك الكامل"
                value={form.sender_name}
                onChange={e => setForm(f => ({ ...f, sender_name: e.target.value }))}
                required
              />
              <FormInput
                label="رقم الهاتف"
                type="tel"
                placeholder="+972xxxxxxxxx"
                value={form.sender_phone}
                onChange={e => setForm(f => ({ ...f, sender_phone: e.target.value }))}
              />
              <FormInput
                label="البريد الإلكتروني"
                type="email"
                placeholder="your@email.com"
                value={form.sender_email}
                onChange={e => setForm(f => ({ ...f, sender_email: e.target.value }))}
              />
              <FormTextarea
                label="الرسالة"
                placeholder="اكتب رسالتك هنا..."
                rows={5}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                required
              />
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                {isSubmitting ? <LoadingSpinner size="sm" /> : null}
                إرسال الرسالة
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
