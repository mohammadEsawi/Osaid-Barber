import { useState, ReactNode } from 'react';
import { Menu, Bell, LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

interface Props {
  children: ReactNode;
  navItems: NavItem[];
  title: string;
}

export default function DashboardLayout({ children, navItems, title }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <Sidebar items={navItems} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 lg:mr-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-zinc-400 hover:text-white rounded-lg">
              <Menu size={20} />
            </button>
            <h1 className="text-white font-semibold text-lg">{title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
              <Bell size={18} />
            </button>
            <div className="flex items-center gap-2 bg-zinc-900 rounded-lg px-3 py-1.5 border border-zinc-800">
              <div className="w-7 h-7 bg-amber-600 rounded-full flex items-center justify-center">
                <User size={14} className="text-white" />
              </div>
              <span className="text-zinc-300 text-sm hidden sm:block">{user?.full_name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}
