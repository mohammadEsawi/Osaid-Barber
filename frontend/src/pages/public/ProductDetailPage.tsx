import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, ArrowRight, Package, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../../services/api';
import { useCart } from '../../contexts/CartContext';
import { Product } from '../../types';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();

  const { data, isLoading } = useQuery({ queryKey: ['product', id], queryFn: () => productsApi.getById(Number(id)) });
  const product: Product = data?.data?.data;

  if (isLoading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (!product) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><p className="text-zinc-400">المنتج غير موجود</p></div>;

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="pt-24 pb-20 max-w-5xl mx-auto px-4 sm:px-6">
        <Link to="/store" className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 text-sm">
          <ArrowRight size={16} />
          العودة للمتجر
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Image */}
          <div className="aspect-square bg-zinc-800 rounded-2xl overflow-hidden flex items-center justify-center">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package size={80} className="text-zinc-600" />
            )}
          </div>

          {/* Info */}
          <div>
            {product.category && (
              <span className="text-xs text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full font-medium">{product.category}</span>
            )}
            <h1 className="text-3xl font-black text-white mt-3 mb-2">{product.name}</h1>
            <p className="text-zinc-400 leading-relaxed mb-6">{product.description}</p>
            <div className="text-4xl font-black text-amber-500 mb-6">{product.price} ₪</div>

            {product.stock_quantity === 0 ? (
              <div className="bg-red-500/20 text-red-400 rounded-xl p-4 text-center font-medium">نفذت الكمية</div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center hover:bg-zinc-700">
                    <Minus size={16} />
                  </button>
                  <span className="text-white font-bold text-xl w-12 text-center">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock_quantity, q + 1))} className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center hover:bg-zinc-700">
                    <Plus size={16} />
                  </button>
                  <span className="text-zinc-500 text-sm">متوفر: {product.stock_quantity}</span>
                </div>
                <button
                  onClick={() => addItem(product, qty)}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-lg"
                >
                  <ShoppingCart size={20} />
                  إضافة للسلة — {(product.price * qty).toFixed(2)} ₪
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
