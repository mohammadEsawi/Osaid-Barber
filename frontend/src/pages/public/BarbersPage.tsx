import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Calendar, Star } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useQuery } from '@tanstack/react-query';
import { barbersApi } from '../../services/api';
import { BarberProfile } from '../../types';

export default function BarbersPage() {
  const { data, isLoading } = useQuery({ queryKey: ['barbers'], queryFn: () => barbersApi.getAll() });
  const barbers: BarberProfile[] = data?.data?.data || [];

  return (
    <div className="min-h-screen bg-zinc-950">
      <Helmet>
        <title>حلاقونا | أوسيد باربر</title>
        <meta name="description" content="تعرّف على فريق الحلاقين المحترفين في أوسيد باربر. خبرة عالية وأسلوب عصري. احجز مع حلاقك المفضل الآن." />
        <link rel="canonical" href="https://osaidsaloon.store/barbers" />
      </Helmet>
      <Navbar />
      <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h1 className="section-title">حلاقونا</h1>
          <p className="section-subtitle">فريق من الحلاقين المحترفين لخدمتك</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {barbers.map(barber => (
              <div key={barber.id} className="card card-hover text-center group">
                <div className="w-24 h-24 bg-zinc-700 rounded-full mx-auto mb-5 overflow-hidden border-2 border-zinc-700 group-hover:border-amber-500 transition-colors">
                  {barber.image_url ? (
                    <img src={barber.image_url} alt={barber.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-black text-zinc-500">
                      {barber.full_name?.charAt(0)}
                    </div>
                  )}
                </div>
                <h3 className="text-white font-bold text-xl mb-1">{barber.full_name}</h3>
                <div className="flex items-center justify-center gap-1 text-amber-500 text-sm mb-3">
                  <Star size={14} fill="currentColor" />
                  <span>{barber.experience_years} سنوات خبرة</span>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed mb-5">{barber.bio}</p>
                <Link
                  to={`/booking?barber=${barber.id}`}
                  className="btn-primary text-sm py-2 px-6 inline-flex items-center gap-2"
                >
                  <Calendar size={15} />
                  احجز مع {barber.full_name?.split(' ')[0]}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
