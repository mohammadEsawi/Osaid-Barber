import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Scissors, Star, Clock, Users, Award, ChevronLeft, Calendar } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { useQuery } from '@tanstack/react-query';
import { servicesApi, barbersApi, settingsApi } from '../../services/api';
import { Service, BarberProfile } from '../../types';

export default function HomePage() {
  const { data: servicesData } = useQuery({ queryKey: ['services-home'], queryFn: () => servicesApi.getAll(true) });
  const { data: barbersData } = useQuery({ queryKey: ['barbers-home'], queryFn: () => barbersApi.getAll() });
  const { data: settingsData } = useQuery({ queryKey: ['settings'], queryFn: () => settingsApi.getAll() });

  const services: Service[] = servicesData?.data?.data?.slice(0, 4) || [];
  const barbers: BarberProfile[] = barbersData?.data?.data?.slice(0, 3) || [];
  const s = settingsData?.data?.data || {};

  const stats = [
    { icon: Users,    value: s.stat_1_value || '+2000', label: s.stat_1_label || 'عميل سعيد' },
    { icon: Award,    value: s.stat_2_value || '10+',   label: s.stat_2_label || 'سنوات خبرة' },
    { icon: Scissors, value: s.stat_3_value || '8',     label: s.stat_3_label || 'خدمة متخصصة' },
    { icon: Star,     value: s.stat_4_value || '4.9',   label: s.stat_4_label || 'تقييم العملاء' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950">
      <Helmet>
        <title>أوسيد باربر | صالون الحلاقة الاحترافي — بيتا، نابلس</title>
        <meta name="description" content="أوسيد باربر، صالون حلاقة احترافي في بيتا الفوقا، نابلس. احجز موعدك أونلاين الآن واحصل على أفضل خدمات الحلاقة وتشكيل اللحية." />
        <link rel="canonical" href="https://osaidsaloon.store/" />
      </Helmet>
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-16">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-amber-600/3 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-px w-12 bg-amber-500" />
              <span className="text-amber-500 font-medium text-sm tracking-wider uppercase">الأفضل في مجاله</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-black text-white leading-tight mb-12">
              احجز موعدك في
              <span className="block text-amber-500 mt-7" >صالون أسيــد</span>
            </h1>
            <p className="text-zinc-400 text-xl leading-relaxed mb-10 max-w-2xl">
              نقدم لك تجربة حلاقة فريدة تجمع بين الأسلوب الاحترافي والعناية الشخصية. حلاقوننا المتخصصون يضمنون لك أفضل نتيجة.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/booking" className="btn-primary flex items-center gap-2 text-lg py-3 px-8">
                <Calendar size={20} />
                احجز موعدك الآن
              </Link>
              <Link to="/services" className="btn-secondary flex items-center gap-2 text-lg py-3 px-8">
                استعرض خدماتنا
                <ChevronLeft size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-zinc-900/50 border-y border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <stat.icon size={24} className="text-amber-500" />
                </div>
                <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-zinc-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      {services.length > 0 && (
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="section-title">خدماتنا المميزة</h2>
            <p className="section-subtitle">اختر من بين مجموعة واسعة من خدمات الحلاقة الاحترافية</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {services.map(service => (
              <div key={service.id} className="card card-hover text-center group">
                <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-500 transition-colors">
                  <Scissors size={26} className="text-amber-500 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{service.name}</h3>
                <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{service.description}</p>
                <div className="flex items-center justify-center gap-3 text-sm">
                  <span className="text-amber-500 font-bold">{service.price} ₪</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-400 flex items-center gap-1"><Clock size={13} />{service.duration_minutes} د</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link to="/services" className="btn-secondary">عرض جميع الخدمات</Link>
          </div>
        </section>
      )}

      {/* Barbers */}
      {barbers.length > 0 && (
        <section className="py-20 bg-zinc-900/30 border-y border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="section-title">حلاقونا المحترفون</h2>
              <p className="section-subtitle">فريق متخصص يضمن لك أفضل تجربة</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {barbers.map((barber) => (
                <div key={barber.id} className="card card-hover text-center">
                  <div className="w-20 h-20 bg-zinc-700 rounded-full mx-auto mb-4 overflow-hidden">
                    {barber.image_url ? (
                      <img src={barber.image_url} alt={barber.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-zinc-500">
                        {barber.full_name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3 className="text-white font-bold text-xl mb-1">{barber.full_name}</h3>
                  <p className="text-amber-500 text-sm mb-3">{barber.experience_years} سنوات خبرة</p>
                  <p className="text-zinc-400 text-sm line-clamp-2">{barber.bio}</p>
                </div>
              ))}
            </div>
            <div className="text-center">
              <Link to="/barbers" className="btn-secondary">عرض جميع الحلاقين</Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="card text-center py-16 px-8 relative overflow-hidden">
          <div className="absolute inset-0 gold-gradient opacity-5" />
          <div className="relative">
            <Scissors size={48} className="text-amber-500 mx-auto mb-6" />
            <h2 className="text-4xl font-black text-white mb-4">جاهز لتجربة مختلفة؟</h2>
            <p className="text-zinc-400 text-lg mb-8 max-w-lg mx-auto">احجز موعدك الآن واستمتع بأفضل تجربة حلاقة مع حلاقينا المحترفين</p>
            <Link to="/booking" className="btn-primary text-lg py-3 px-10 inline-flex items-center gap-2">
              <Calendar size={20} />
              احجز موعدك الآن
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
