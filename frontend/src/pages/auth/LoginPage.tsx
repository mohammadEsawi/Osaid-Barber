import { useState } from 'react';
import { Scissors, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FormInput } from '../../components/ui/FormInput';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const loggedInUser = await login(form.email, form.password);
      toast.success('مرحباً بك!');
      navigate(loggedInUser.role === 'admin' ? '/admin' : '/barber');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'بيانات الدخول غير صحيحة');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center">
              <Scissors size={26} className="text-white" />
            </div>
            <span className="text-white font-bold text-2xl">أوسيد باربر</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">تسجيل الدخول</h1>
          <p className="text-zinc-400 mt-1">لوحة تحكم المشرف والحلاق</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="البريد الإلكتروني"
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="admin@osaidbarber.com"
              required
              autoComplete="email"
            />
            <div>
              <label className="label">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  className="input-field pl-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              {isLoading ? <><LoadingSpinner size="sm" /> جاري الدخول...</> : 'تسجيل الدخول'}
            </button>
          </form>


        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-zinc-400 hover:text-amber-500 text-sm transition-colors">
            ← العودة للموقع
          </Link>
        </div>
      </div>
    </div>
  );
}
