import { ShoppingCart, Package } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { Link } from 'react-router-dom';

interface Props { product: Product; }

export default function ProductCard({ product }: Props) {
  const { addItem } = useCart();

  return (
    <div className="card card-hover group">
      <Link to={`/store/${product.id}`}>
        <div className="aspect-square bg-zinc-800 rounded-xl mb-4 overflow-hidden flex items-center justify-center">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <Package size={48} className="text-zinc-600" />
          )}
        </div>
        {product.category && (
          <span className="text-xs text-amber-500 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full">{product.category}</span>
        )}
        <h3 className="font-bold text-white mt-2 mb-1 group-hover:text-amber-400 transition-colors">{product.name}</h3>
        {product.description && <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{product.description}</p>}
      </Link>
      <div className="flex items-center justify-between mt-auto">
        <span className="text-amber-500 font-bold text-lg">{product.price} ₪</span>
        <div className="flex items-center gap-2">
          {product.stock_quantity === 0 ? (
            <span className="text-red-400 text-xs">نفذت الكمية</span>
          ) : (
            <button
              onClick={() => addItem(product)}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <ShoppingCart size={14} />
              أضف للسلة
            </button>
          )}
        </div>
      </div>
      {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
        <p className="text-yellow-500 text-xs mt-2">⚠ بقي {product.stock_quantity} فقط</p>
      )}
    </div>
  );
}
