import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import ServiceCard from '../../components/ui/ServiceCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useQuery } from '@tanstack/react-query';
import { servicesApi } from '../../services/api';
import { Service } from '../../types';

export default function ServicesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['services'], queryFn: () => servicesApi.getAll(true) });
  const services: Service[] = data?.data?.data || [];

  return (
    <div className="min-h-screen bg-zinc-950">
      <Helmet>
        <title>خدماتنا | أوسيد باربر</title>
        <meta name="description" content="تعرّف على جميع خدمات أوسيد باربر: قص الشعر، تشكيل اللحية، الحلاقة الكلاسيكية وأكثر. أسعار مناسبة وحلاقون محترفون." />
        <link rel="canonical" href="https://osaidsaloon.store/services" />
      </Helmet>
      <Navbar />
      <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h1 className="section-title">خدماتنا</h1>
          <p className="section-subtitle">مجموعة متنوعة من خدمات الحلاقة والعناية الاحترافية</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link to="/booking" className="btn-primary text-lg py-3 px-10 inline-flex items-center gap-2">
            <Calendar size={20} />
            احجز الآن
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
