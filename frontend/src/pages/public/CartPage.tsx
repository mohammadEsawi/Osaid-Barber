import { useState } from 'react';
import { Trash2, ShoppingBag, Minus, Plus, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { FormInput, FormTextarea } from '../../components/ui/FormInput';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useCart } from '../../contexts/CartContext';
import { ordersApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart();
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name || !form.customer_phone) {
      toast.error('يرجى إدخال الاسم ورقم الهاتف');
      return;
    }
    setIsSubmitting(true);
    try {
      await ordersApi.create({
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        notes: form.notes,
        items: items.map(i => ({ product_id: i.product.id, quantity: i.quantity })),
      });
      toast.success('تم إرسال طلبك بنجاح! سنتواصل معك قريباً');
      clearCart();
      navigate('/store');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'حدث خطأ في الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <div className="pt-24 pb-20 max-w-lg mx-auto px-4 sm:px-6 text-center">
          <ShoppingBag size={64} className="text-zinc-700 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-3">السلة فارغة</h1>
          <p className="text-zinc-400 mb-8">لم تقم بإضافة أي منتجات بعد</p>
          <Link to="/store" className="btn-primary inline-flex items-center gap-2">
            <ArrowRight size={18} />
            تصفح المتجر
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="pt-24 pb-20 max-w-5xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-black text-white mb-8">سلة التسوق</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.product.id} className="card flex items-center gap-4">
                <div className="w-16 h-16 bg-zinc-800 rounded-xl overflow-hidden shrink-0">
                  {item.product.image_url ? (
                    <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs text-center p-1">{item.product.name}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{item.product.name}</h3>
                  <p className="text-amber-500 font-bold">{item.product.price} ₪</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center hover:bg-zinc-700">
                    <Minus size={14} />
                  </button>
                  <span className="text-white w-8 text-center font-bold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center hover:bg-zinc-700">
                    <Plus size={14} />
                  </button>
                </div>
                <div className="text-white font-bold shrink-0 w-20 text-center">
                  {(item.product.price * item.quantity).toFixed(2)} ₪
                </div>
                <button onClick={() => removeItem(item.product.id)} className="text-red-400 hover:text-red-300 p-1 shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div>
            <div className="card mb-4">
              <h2 className="text-white font-bold text-lg mb-4">ملخص الطلب</h2>
              <div className="space-y-2 mb-4">
                {items.map(i => (
                  <div key={i.product.id} className="flex justify-between text-sm">
                    <span className="text-zinc-400">{i.product.name} × {i.quantity}</span>
                    <span className="text-zinc-300">{(i.product.price * i.quantity).toFixed(2)} ₪</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-lg pt-3 border-t border-zinc-800">
                <span className="text-white">الإجمالي</span>
                <span className="text-amber-500">{total.toFixed(2)} ₪</span>
              </div>
            </div>

            <div className="card">
              <h2 className="text-white font-bold text-lg mb-4">بيانات التسليم</h2>
              <form onSubmit={handleOrder} className="space-y-3">
                <FormInput label="الاسم الكامل" value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} placeholder="اسمك الكامل" required />
                <FormInput label="رقم الهاتف" type="tel" value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} placeholder="+972xxxxxxxxx" required />
                <FormTextarea label="ملاحظات" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="أي ملاحظات للتوصيل..." rows={2} />
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  {isSubmitting ? <LoadingSpinner size="sm" /> : <ShoppingBag size={18} />}
                  تأكيد الطلب
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
