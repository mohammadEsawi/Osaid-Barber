import { Helmet } from 'react-helmet-async';
import { Scissors, Award, Users, Heart } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '../../services/api';

export default function AboutPage() {
  const { data: settingsData } = useQuery({ queryKey: ['settings'], queryFn: () => settingsApi.getAll() });
  const s = settingsData?.data?.data || {};

  return (
    <div className="min-h-screen bg-zinc-950">
      <Helmet>
        <title>من نحن | أوسيد باربر</title>
        <meta name="description" content="قصة أوسيد باربر — صالون حلاقة احترافي في بيتا، نابلس. تأسس بشغف الحلاقة وتقديم أفضل تجربة للزبون." />
        <link rel="canonical" href="https://osaid-barber.vercel.app/about" />
      </Helmet>
      <Navbar />
      <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h1 className="section-title">من نحن</h1>
          <p className="section-subtitle">نبذة عن صالون أسيد وقصتنا</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px w-10 bg-amber-500" />
              <span className="text-amber-500 text-sm font-medium">قصتنا</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-6">أكثر من مجرد صالون حلاقة</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              تأسس صالون أسيد بشغف حقيقي لفن الحلاقة والعناية بالمظهر الرجالي. بدأنا رحلتنا منذ أكثر من 3 سنوات بهدف واحد: تقديم تجربة حلاقة استثنائية تجمع بين الاحترافية والراحة.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              نؤمن أن كل عميل يستحق أفضل معاملة وأعلى مستوى من الخدمة. لذلك نحرص على اختيار أمهر الحلاقين وتدريبهم باستمرار على أحدث تقنيات الحلاقة وصيحات الموضة.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Award,    label: s.stat_2_value ? `${s.stat_2_value} ${s.stat_2_label || 'سنوات خبرة'}` : 'خبرة 10+ سنوات', desc: 'في صناعة الحلاقة' },
              { icon: Users,    label: s.stat_1_value ? `${s.stat_1_value} ${s.stat_1_label || 'عميل سعيد'}` : '+2000 عميل',        desc: 'راضون عن خدماتنا' },
              { icon: Scissors, label: s.stat_3_value ? `${s.stat_3_value} ${s.stat_3_label || 'خدمة متخصصة'}` : '8 خدمات',         desc: 'متخصصة ومتنوعة' },
              { icon: Heart,    label: 'شغف حقيقي', desc: 'بفن الحلاقة' },
            ].map((item, i) => (
              <div key={i} className="card text-center">
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <item.icon size={24} className="text-amber-500" />
                </div>
                <h3 className="text-white font-bold mb-1">{item.label}</h3>
                <p className="text-zinc-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white mb-2">قيمنا</h2>
          <p className="text-zinc-400">المبادئ التي نبني عليها خدماتنا</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'الجودة', desc: 'نستخدم أفضل المنتجات وأحدث الأدوات لضمان أعلى جودة في كل خدمة.' },
            { title: 'الاحترافية', desc: 'حلاقونا مؤهلون ومتدربون باستمرار على أحدث تقنيات الحلاقة العالمية.' },
            { title: 'رضا العميل', desc: 'رضاك هو هدفنا الأول. لن نتوقف حتى تغادر بابتسامة وقصة شعر تعجبك.' },
          ].map((v, i) => (
            <div key={i} className="card border-r-2 border-r-amber-500">
              <h3 className="text-white font-bold text-lg mb-2">{v.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
