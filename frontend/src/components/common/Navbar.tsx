import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Scissors, ShoppingCart, Menu, X, Phone } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

const navLinks = [
  { href: '/', label: 'الرئيسية' },
  { href: '/about', label: 'من نحن' },
  { href: '/services', label: 'الخدمات' },
  { href: '/barbers', label: 'الحلاقون' },
  { href: '/store', label: 'المتجر' },
  { href: '/contact', label: 'تواصل معنا' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();
  const { itemCount } = useCart();
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 bg-amber-600 rounded-xl flex items-center justify-center">
              <Scissors size={20} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl">صالــون أسيــد</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href ? 'text-amber-500 bg-amber-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link to="/booking" className="hidden sm:flex btn-primary text-sm py-2 px-4">
              احجز موعدك
            </Link>

            <Link to="/cart" className="relative p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -left-1 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              )}
            </Link>

            {user ? (
              <Link
                to={user.role === 'admin' ? '/admin' : '/barber'}
                className="hidden sm:block btn-secondary text-sm py-2 px-4"
              >
                لوحة التحكم
              </Link>
            ) : (
              <Link to="/login" className="hidden sm:block btn-ghost text-sm">
                تسجيل الدخول
              </Link>
            )}

            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-zinc-400 hover:text-white rounded-lg">
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-zinc-950 border-t border-zinc-800 px-4 py-4 space-y-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-3 rounded-lg text-sm font-medium ${pathname === link.href ? 'text-amber-500 bg-amber-500/10' : 'text-zinc-400'}`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-zinc-800 flex gap-2">
            <Link to="/booking" onClick={() => setIsOpen(false)} className="btn-primary text-sm py-2 px-4 flex-1 text-center">
              احجز موعدك
            </Link>
            {user ? (
              <Link to={user.role === 'admin' ? '/admin' : '/barber'} onClick={() => setIsOpen(false)} className="btn-secondary text-sm py-2 px-4">
                لوحة التحكم
              </Link>
            ) : (
              <Link to="/login" onClick={() => setIsOpen(false)} className="btn-ghost text-sm py-2 px-4">
                دخول
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
