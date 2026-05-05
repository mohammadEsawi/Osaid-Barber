import { Link, useLocation } from 'react-router-dom';
import { Scissors, X } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface Props {
  items: NavItem[];
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
}

export default function Sidebar({ items, isOpen, onClose, title = 'القائمة' }: Props) {
  const { pathname } = useLocation();

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between p-5 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
            <Scissors size={16} className="text-white" />
          </div>
          <span className="text-white font-bold">أوسيد باربر</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-zinc-400 hover:text-white p-1">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {items.map(item => (
          <Link
            key={item.href}
            to={item.href}
            onClick={onClose}
            className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
          >
            {item.icon}
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-zinc-950 border-l border-zinc-800 fixed top-0 bottom-0 right-0 z-30">
        {content}
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <div className="relative w-64 bg-zinc-950 border-l border-zinc-800 h-full">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
