import { useState, useRef, useEffect } from 'react';
import { Plus, Pencil, Trash2, Camera, LayoutDashboard, Calendar, Scissors, Users, Package, ShoppingBag, BarChart3, Settings, MessageSquare, Clock } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { FormInput, FormTextarea } from '../../components/ui/FormInput';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { barbersApi } from '../../services/api';
import { BarberProfile, BarberAvailability } from '../../types';
import toast from 'react-hot-toast';

const adminNav = [
  { href: '/admin', label: 'الرئيسية', icon: <LayoutDashboard size={18} /> },
  { href: '/admin/bookings', label: 'المواعيد', icon: <Calendar size={18} /> },
  { href: '/admin/services', label: 'الخدمات', icon: <Scissors size={18} /> },
  { href: '/admin/barbers', label: 'الحلاقون', icon: <Users size={18} /> },
  { href: '/admin/products', label: 'المنتجات', icon: <Package size={18} /> },
  { href: '/admin/orders', label: 'الطلبات', icon: <ShoppingBag size={18} /> },
  { href: '/admin/customers', label: 'العملاء', icon: <Users size={18} /> },
  { href: '/admin/reports', label: 'التقارير', icon: <BarChart3 size={18} /> },
  { href: '/admin/messages', label: 'الرسائل', icon: <MessageSquare size={18} /> },
  { href: '/admin/settings', label: 'الإعدادات', icon: <Settings size={18} /> },
];

const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const DEFAULT_SCHEDULE: BarberAvailability[] = DAY_NAMES.map((_, i) => ({
  id: 0,
  barber_id: 0,
  day_of_week: i,
  start_time: i === 6 ? '10:00' : '09:00',
  end_time: i === 6 ? '17:00' : '21:00',
  is_available: i !== 5,
}));

const emptyForm = { full_name: '', email: '', phone: '', password: '', bio: '', experience_years: '' };

export default function AdminBarbers() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BarberProfile | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<BarberProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingImageUrl, setEditingImageUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Availability modal
  const [availBarber, setAvailBarber] = useState<BarberProfile | null>(null);
  const [schedule, setSchedule] = useState<BarberAvailability[]>(DEFAULT_SCHEDULE);
  const [isSavingAvail, setIsSavingAvail] = useState(false);

  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['barbers-admin'], queryFn: () => barbersApi.getAll() });
  const barbers: BarberProfile[] = data?.data?.data || [];

  const { data: availData } = useQuery({
    queryKey: ['barber-availability-admin', availBarber?.id],
    queryFn: () => barbersApi.getAvailability(availBarber!.id),
    enabled: !!availBarber,
  });

  useEffect(() => {
    if (availData?.data?.data?.length) {
      const fetched: BarberAvailability[] = availData.data.data;
      setSchedule(
        DEFAULT_SCHEDULE.map(def => {
          const found = fetched.find(f => f.day_of_week === def.day_of_week);
          return found ? { ...found } : def;
        })
      );
    }
  }, [availData]);

  const updateDay = (dow: number, field: keyof BarberAvailability, value: string | boolean) => {
    setSchedule(prev => prev.map(d => d.day_of_week === dow ? { ...d, [field]: value } : d));
  };

  const handleSaveAvailability = async () => {
    if (!availBarber) return;
    setIsSavingAvail(true);
    try {
      await barbersApi.updateAvailability(availBarber.id, { availability: schedule });
      toast.success('تم حفظ جدول العمل');
      qc.invalidateQueries({ queryKey: ['barber-availability'] });
      qc.invalidateQueries({ queryKey: ['barber-availability-admin'] });
      setAvailBarber(null);
    } catch {
      toast.error('فشل حفظ جدول العمل');
    } finally {
      setIsSavingAvail(false);
    }
  };

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (b: BarberProfile) => {
    setEditing(b);
    setEditingImageUrl(b.image_url || '');
    setForm({ full_name: b.full_name || '', email: b.email || '', phone: b.phone || '', password: '', bio: b.bio || '', experience_years: String(b.experience_years) });
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setEditingImageUrl(URL.createObjectURL(file));
    setUploadingImage(true);
    try {
      const res = await barbersApi.uploadImage(editing.id, file);
      setEditingImageUrl(res.data.data.image_url);
      qc.invalidateQueries({ queryKey: ['barbers-admin'] });
      qc.invalidateQueries({ queryKey: ['barbers-home'] });
      toast.success('تم تحديث الصورة');
    } catch {
      setEditingImageUrl(editing.image_url || '');
      toast.error('فشل رفع الصورة');
    } finally {
      setUploadingImage(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { ...form, experience_years: parseInt(form.experience_years) || 0 };
      if (editing) {
        await barbersApi.update(editing.id, payload);
        toast.success('تم تحديث بيانات الحلاق');
      } else {
        await barbersApi.create(payload);
        toast.success('تم إضافة الحلاق بنجاح');
      }
      qc.invalidateQueries({ queryKey: ['barbers-admin'] });
      setModalOpen(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await barbersApi.delete(deleteTarget.id);
      toast.success('تم تعطيل الحلاق');
      qc.invalidateQueries({ queryKey: ['barbers-admin'] });
      setDeleteTarget(null);
    } catch {
      toast.error('فشل تعطيل الحلاق');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    { header: 'الحلاق', render: (r: BarberProfile) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-zinc-700 rounded-full overflow-hidden flex items-center justify-center font-bold text-zinc-400 shrink-0">
          {r.image_url
            ? <img src={r.image_url} alt={r.full_name} className="w-full h-full object-cover" />
            : r.full_name?.charAt(0)}
        </div>
        <div><div className="text-white font-medium">{r.full_name}</div><div className="text-zinc-400 text-xs">{r.email}</div></div>
      </div>
    )},
    { header: 'الهاتف', accessor: 'phone' as keyof BarberProfile },
    { header: 'الخبرة', render: (r: BarberProfile) => <span>{r.experience_years} سنوات</span> },
    { header: 'الحالة', render: (r: BarberProfile) => <span className={`badge ${r.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{r.is_active ? 'نشط' : 'معطل'}</span> },
    { header: 'إجراءات', render: (r: BarberProfile) => (
      <div className="flex gap-2">
        <button onClick={() => { setSchedule(DEFAULT_SCHEDULE); setAvailBarber(r); }} title="جدول العمل" className="p-1.5 text-zinc-400 hover:text-amber-500 hover:bg-zinc-800 rounded-lg"><Clock size={14} /></button>
        <button onClick={() => openEdit(r)} className="p-1.5 text-zinc-400 hover:text-amber-500 hover:bg-zinc-800 rounded-lg"><Pencil size={14} /></button>
        <button onClick={() => setDeleteTarget(r)} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg"><Trash2 size={14} /></button>
      </div>
    )},
  ];

  return (
    <DashboardLayout navItems={adminNav} title="إدارة الحلاقين">
      <div className="page-enter">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">الحلاقون ({barbers.length})</h2>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} />إضافة حلاق</button>
        </div>
        <div className="card p-0 overflow-hidden">
          <DataTable<BarberProfile> columns={columns} data={barbers} isLoading={isLoading} emptyMessage="لا يوجد حلاقون" />
        </div>
      </div>

      {/* Availability modal */}
      <Modal
        isOpen={!!availBarber}
        onClose={() => setAvailBarber(null)}
        title={`جدول عمل — ${availBarber?.full_name}`}
        size="lg"
      >
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-[1fr_80px_100px_16px_100px] gap-2 text-xs text-zinc-500 font-medium pb-1 border-b border-zinc-800">
            <span>اليوم</span>
            <span className="text-center">الحالة</span>
            <span className="text-center">من</span>
            <span />
            <span className="text-center">إلى</span>
          </div>

          {schedule.map(day => (
            <div key={day.day_of_week} className={`grid grid-cols-[1fr_80px_100px_16px_100px] gap-2 items-center py-2 rounded-lg px-1 transition-colors ${!day.is_available ? 'opacity-50' : ''}`}>
              <span className="text-white font-medium text-sm">{DAY_NAMES[day.day_of_week]}</span>

              {/* Toggle */}
              <button
                type="button"
                onClick={() => updateDay(day.day_of_week, 'is_available', !day.is_available)}
                className={`text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${
                  day.is_available
                    ? 'bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400'
                    : 'bg-red-500/20 text-red-400 hover:bg-green-500/20 hover:text-green-400'
                }`}
              >
                {day.is_available ? 'مفتوح' : 'مغلق'}
              </button>

              {/* Start time */}
              <input
                type="time"
                value={day.start_time}
                disabled={!day.is_available}
                onChange={e => updateDay(day.day_of_week, 'start_time', e.target.value)}
                className="input-field text-sm py-1.5 text-center disabled:opacity-30 disabled:cursor-not-allowed"
              />

              <span className="text-zinc-600 text-xs text-center">←</span>

              {/* End time */}
              <input
                type="time"
                value={day.end_time}
                disabled={!day.is_available}
                onChange={e => updateDay(day.day_of_week, 'end_time', e.target.value)}
                className="input-field text-sm py-1.5 text-center disabled:opacity-30 disabled:cursor-not-allowed"
              />
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800 mt-4">
            <button onClick={() => setAvailBarber(null)} className="btn-ghost">إلغاء</button>
            <button onClick={handleSaveAvailability} disabled={isSavingAvail} className="btn-primary flex items-center gap-2">
              {isSavingAvail ? <><LoadingSpinner size="sm" />جاري الحفظ...</> : 'حفظ الجدول'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit/Add barber modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'تعديل بيانات الحلاق' : 'إضافة حلاق جديد'}>
        <form onSubmit={handleSave} className="space-y-4">
          {editing && (
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-20 h-20">
                {editingImageUrl
                  ? <img src={editingImageUrl} alt={editing.full_name} className="w-full h-full rounded-full object-cover border-2 border-zinc-600" />
                  : <div className="w-full h-full rounded-full bg-zinc-700 flex items-center justify-center text-3xl font-bold text-zinc-400">{editing.full_name?.charAt(0)}</div>
                }
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingImage}
                  className="absolute bottom-0 left-0 w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center hover:bg-amber-400 transition-colors"
                >
                  {uploadingImage ? <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Camera size={13} className="text-black" />}
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingImage} className="text-xs text-amber-500 hover:text-amber-400">
                {uploadingImage ? 'جاري الرفع...' : 'تغيير الصورة'}
              </button>
            </div>
          )}
          <FormInput label="الاسم الكامل" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required />
          <FormInput label="البريد الإلكتروني" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required={!editing} disabled={!!editing} />
          <FormInput label="رقم الهاتف" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
          {!editing && <FormInput label="كلمة المرور" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />}
          <FormInput label="سنوات الخبرة" type="number" min="0" value={form.experience_years} onChange={e => setForm(f => ({ ...f, experience_years: e.target.value }))} />
          <FormTextarea label="النبذة التعريفية" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} placeholder="نبذة عن الحلاق..." />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">إلغاء</button>
            <button type="submit" disabled={isSaving} className="btn-primary flex-1">{isSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="تعطيل الحلاق" message={`هل أنت متأكد من تعطيل "${deleteTarget?.full_name}"؟`} confirmText="تعطيل" isLoading={isDeleting} />
    </DashboardLayout>
  );
}
