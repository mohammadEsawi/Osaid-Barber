import { useState } from 'react';
import { Plus, Pencil, Trash2, LayoutDashboard, Calendar, Scissors, Users, Package, ShoppingBag, BarChart3, Settings, MessageSquare, Clock, Archive } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { FormInput, FormTextarea, FormSelect } from '../../components/ui/FormInput';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '../../services/api';
import { Service } from '../../types';
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

const emptyForm = { name: '', description: '', price: '', duration_minutes: '', image_url: '', is_active: 'true' };

export default function AdminServices() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['services-admin'], queryFn: () => servicesApi.getAll() });
  const services: Service[] = data?.data?.data || [];

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({ name: s.name, description: s.description || '', price: String(s.price), duration_minutes: String(s.duration_minutes), image_url: s.image_url || '', is_active: String(s.is_active) });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { ...form, price: parseFloat(form.price), duration_minutes: parseInt(form.duration_minutes), is_active: form.is_active === 'true' };
      if (editing) {
        await servicesApi.update(editing.id, payload);
        toast.success('تم تحديث الخدمة');
      } else {
        await servicesApi.create(payload);
        toast.success('تم إضافة الخدمة');
      }
      qc.invalidateQueries({ queryKey: ['services-admin'] });
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
      await servicesApi.delete(deleteTarget.id);
      toast.success('تم حذف الخدمة');
      qc.invalidateQueries({ queryKey: ['services-admin'] });
      setDeleteTarget(null);
    } catch {
      toast.error('فشل الحذف');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    { header: 'الخدمة', render: (r: Service) => <span className="text-white font-medium">{r.name}</span> },
    { header: 'السعر', render: (r: Service) => <span className="text-amber-500 font-bold">{r.price} ₪</span> },
    { header: 'المدة', render: (r: Service) => <span>{r.duration_minutes} دقيقة</span> },
    { header: 'الحالة', render: (r: Service) => <span className={`badge ${r.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{r.is_active ? 'نشطة' : 'معطلة'}</span> },
    { header: 'إجراءات', render: (r: Service) => (
      <div className="flex gap-2">
        <button onClick={() => openEdit(r)} className="p-1.5 text-zinc-400 hover:text-amber-500 hover:bg-zinc-800 rounded-lg"><Pencil size={14} /></button>
        <button onClick={() => setDeleteTarget(r)} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg"><Trash2 size={14} /></button>
      </div>
    )},
  ];

  return (
    <DashboardLayout navItems={adminNav} title="إدارة الخدمات">
      <div className="page-enter">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">الخدمات ({services.length})</h2>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} />إضافة خدمة</button>
        </div>
        <div className="card p-0 overflow-hidden">
          <DataTable<Service> columns={columns} data={services} isLoading={isLoading} emptyMessage="لا توجد خدمات" />
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}>
        <form onSubmit={handleSave} className="space-y-4">
          <FormInput label="اسم الخدمة" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: قص الشعر" required />
          <FormTextarea label="الوصف" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="وصف الخدمة..." rows={3} />
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="السعر (₪)" type="number" step="0.5" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
            <FormInput label="المدة (دقيقة)" type="number" min="1" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} required />
          </div>
          <FormInput label="رابط الصورة (اختياري)" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
          <FormSelect label="الحالة" value={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.value }))}>
            <option value="true">نشطة</option>
            <option value="false">معطلة</option>
          </FormSelect>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">إلغاء</button>
            <button type="submit" disabled={isSaving} className="btn-primary flex-1">{isSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف الخدمة"
        message={`هل أنت متأكد من حذف خدمة "${deleteTarget?.name}"؟`}
        confirmText="حذف"
        isLoading={isDeleting}
      />
    </DashboardLayout>
  );
}
