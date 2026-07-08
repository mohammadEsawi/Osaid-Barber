import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { Search } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import ProductCard from '../../components/ui/ProductCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../../services/api';
import { Product } from '../../types';

const CATEGORIES = ['الكل', 'عناية بالشعر', 'عناية باللحية', 'تصفيف الشعر', 'أدوات'];

export default function StorePage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('الكل');

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, category],
    queryFn: () => productsApi.getAll({ search: search || undefined, category: category === 'الكل' ? undefined : category, active_only: true }),
  });
  const products: Product[] = data?.data?.data || [];

  return (
    <div className="min-h-screen bg-zinc-950">
      <Helmet>
        <title>المتجر | أوسيد باربر</title>
        <meta name="description" content="تسوق منتجات العناية بالشعر واللحية من متجر أوسيد باربر. منتجات احترافية بأسعار مناسبة." />
        <link rel="canonical" href="https://osaid-barber.vercel.app/store" />
      </Helmet>
      <Navbar />
      <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h1 className="section-title">المتجر</h1>
          <p className="section-subtitle">منتجات العناية الرجالية المميزة</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="ابحث عن منتج..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pr-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${category === cat ? 'bg-amber-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">لا توجد منتجات</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
