import { useState } from 'react';
import { MessageSquare, Trash2, CheckCircle, Mail, Phone, LayoutDashboard, Calendar, Scissors, Users, Package, ShoppingBag, BarChart3, Settings, Clock, Archive } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../../services/api';
import toast from 'react-hot-toast';

const adminNav = [
  { href: '/admin', label: 'الرئيسية', icon: <LayoutDashboard size={18} /> },
  { href: '/admin/bookings', label: 'المواعيد', icon: <Calendar size={18} /> },
  { href: '/admin/archive', label: 'الأرشيف', icon: <Archive size={18} /> },
  { href: '/admin/services', label: 'الخدمات', icon: <Scissors size={18} /> },
  { href: '/admin/barbers', label: 'الحلاقون', icon: <Users size={18} /> },
  { href: '/admin/availability', label: 'أوقات العمل', icon: <Clock size={18} /> },
  { href: '/admin/products', label: 'المنتجات', icon: <Package size={18} /> },
  { href: '/admin/orders', label: 'الطلبات', icon: <ShoppingBag size={18} /> },
  { href: '/admin/customers', label: 'العملاء', icon: <Users size={18} /> },
  { href: '/admin/reports', label: 'التقارير', icon: <BarChart3 size={18} /> },
  { href: '/admin/messages', label: 'الرسائل', icon: <MessageSquare size={18} /> },
  { href: '/admin/settings', label: 'الإعدادات', icon: <Settings size={18} /> },
];

interface ContactMessage {
  id: number;
  sender_name: string;
  sender_phone: string | null;
  sender_email: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function AdminMessages() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['messages', unreadOnly],
    queryFn: () => messagesApi.getAll({ unread_only: unreadOnly }),
  });

  const messages: ContactMessage[] = data?.data?.data || [];
  const unreadCount: number = data?.data?.unread_count || 0;

  const markReadMutation = useMutation({
    mutationFn: (id: number) => messagesApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => messagesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast.success('تم حذف الرسالة');
    },
  });

  return (
    <DashboardLayout navItems={adminNav} title="الرسائل">
      <div className="page-enter">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">رسائل التواصل</h2>
            {unreadCount > 0 && (
              <span className="bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount} جديدة
              </span>
            )}
          </div>
          <button
            onClick={() => setUnreadOnly(v => !v)}
            className={`text-sm px-4 py-2 rounded-lg transition-colors ${unreadOnly ? 'bg-amber-500 text-black font-bold' : 'btn-secondary'}`}
          >
            {unreadOnly ? 'كل الرسائل' : 'غير المقروءة فقط'}
          </button>
        </div>

        {isLoading && <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>}

        {!isLoading && messages.length === 0 && (
          <div className="card text-center py-16">
            <MessageSquare size={48} className="text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400">
              {unreadOnly ? 'لا توجد رسائل غير مقروءة' : 'لا توجد رسائل بعد'}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`card transition-all ${!msg.is_read ? 'border-amber-500/40 bg-amber-500/5' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-white font-bold">{msg.sender_name}</span>
                    {!msg.is_read && (
                      <span className="text-xs bg-amber-500 text-black font-bold px-2 py-0.5 rounded-full">جديدة</span>
                    )}
                    <span className="text-zinc-500 text-xs">
                      {new Date(msg.created_at).toLocaleString('ar', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 mb-3 text-sm">
                    {msg.sender_phone && (
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Phone size={13} className="text-amber-500" />
                        {msg.sender_phone}
                      </span>
                    )}
                    {msg.sender_email && (
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Mail size={13} className="text-amber-500" />
                        {msg.sender_email}
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!msg.is_read && (
                    <button
                      onClick={() => markReadMutation.mutate(msg.id)}
                      title="تعليم كمقروء"
                      className="text-green-400 hover:text-green-300 p-2 hover:bg-green-400/10 rounded-lg transition-colors"
                    >
                      <CheckCircle size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(msg.id)}
                    title="حذف"
                    className="text-red-400 hover:text-red-300 p-2 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
