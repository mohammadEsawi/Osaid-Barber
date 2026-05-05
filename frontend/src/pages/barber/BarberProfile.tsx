import { useState, useRef } from 'react';
import { Camera, User, LayoutDashboard, Calendar, Clock, Settings } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { barbersApi } from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const barberNav = [
  { href: '/barber', label: 'لوحة التحكم', icon: <LayoutDashboard size={18} /> },
  { href: '/barber/appointments', label: 'المواعيد', icon: <Calendar size={18} /> },
  { href: '/barber/calendar', label: 'التقويم', icon: <Clock size={18} /> },
  { href: '/barber/availability', label: 'أوقات العمل', icon: <Settings size={18} /> },
  { href: '/barber/profile', label: 'ملفي الشخصي', icon: <User size={18} /> },
];

export default function BarberProfile() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>(user?.barber?.image_url || '');
  const qc = useQueryClient();

  const barberId = user?.barber?.id;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !barberId) return;

    // Optimistic preview
    const localUrl = URL.createObjectURL(file);
    setImageUrl(localUrl);
    setUploading(true);
    try {
      const res = await barbersApi.uploadImage(barberId, file);
      setImageUrl(res.data.data.image_url);
      toast.success('تم تحديث صورتك بنجاح');
      qc.invalidateQueries({ queryKey: ['barbers'] });
      qc.invalidateQueries({ queryKey: ['barbers-admin'] });
      qc.invalidateQueries({ queryKey: ['barbers-home'] });
    } catch {
      setImageUrl(user?.barber?.image_url || '');
      toast.error('فشل رفع الصورة');
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <DashboardLayout navItems={barberNav} title="ملفي الشخصي">
      <div className="max-w-sm mx-auto page-enter">
        <div className="card text-center">
          {/* Avatar with upload button */}
          <div className="relative w-32 h-32 mx-auto mb-5">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={user?.full_name}
                className="w-full h-full rounded-full object-cover border-4 border-zinc-700"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-zinc-700 border-4 border-zinc-600 flex items-center justify-center text-5xl font-black text-zinc-400">
                {user?.full_name?.charAt(0)}
              </div>
            )}

            {/* Camera overlay button */}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-1 left-1 w-9 h-9 bg-amber-500 hover:bg-amber-400 rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-60"
            >
              {uploading ? <LoadingSpinner size="sm" /> : <Camera size={16} className="text-black" />}
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFile}
          />

          <h2 className="text-white text-xl font-bold mb-1">{user?.full_name}</h2>
          <p className="text-zinc-400 text-sm">{user?.email}</p>
          <p className="text-amber-500 text-sm mt-1">{user?.phone}</p>

          {user?.barber?.experience_years ? (
            <p className="text-zinc-500 text-sm mt-1">{user.barber.experience_years} سنوات خبرة</p>
          ) : null}

          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="btn-secondary mt-5 w-full flex items-center justify-center gap-2"
          >
            <Camera size={16} />
            {uploading ? 'جاري الرفع...' : 'تغيير الصورة'}
          </button>

          <p className="text-zinc-600 text-xs mt-3">
            JPG أو PNG أو WebP — الحد الأقصى 5 ميغابايت
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
