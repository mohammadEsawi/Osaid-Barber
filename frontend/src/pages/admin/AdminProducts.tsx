import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Camera, Package, LayoutDashboard, Calendar, Scissors, Users, ShoppingBag, BarChart3, Settings, MessageSquare, Clock } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { FormInput, FormTextarea, FormSelect } from '../../components/ui/FormInput';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../../services/api';
import { Product } from '../../types';
import toast from 'react-hot-toast';

const adminNav = [
  { href: '/admin', label: 'الرئيسية', icon: <LayoutDashboard size={18} /> },
  { href: '/admin/bookings', label: 'المواعيد', icon: <Calendar size={18} /> },
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

const emptyForm = { name: '', description: '', price: '', stock_quantity: '', image_url: '', category: '', is_active: 'true' };
const CATEGORIES = ['عناية بالشعر', 'عناية باللحية', 'تصفيف الشعر', 'أدوات', 'أخرى'];

export default function AdminProducts() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['products-admin'], queryFn: () => productsApi.getAll() });
  const products: Product[] = data?.data?.data || [];

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description || '', price: String(p.price), stock_quantity: String(p.stock_quantity), image_url: p.image_url || '', category: p.category || '', is_active: String(p.is_active) });
    setModalOpen(true);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm(f => ({ ...f, image_url: URL.createObjectURL(file) }));
    setUploadingImage(true);
    try {
      const res = await productsApi.uploadImage(file);
      setForm(f => ({ ...f, image_url: res.data.data.image_url }));
    } catch {
      toast.error('فشل رفع الصورة');
      setForm(f => ({ ...f, image_url: editing?.image_url || '' }));
    } finally {
      setUploadingImage(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingImage) { toast.error('يرجى انتظار اكتمال رفع الصورة'); return; }
    setIsSaving(true);
    try {
      const payload = { ...form, price: parseFloat(form.price), stock_quantity: parseInt(form.stock_quantity), is_active: form.is_active === 'true' };
      if (editing) { await productsApi.update(editing.id, payload); toast.success('تم تحديث المنتج'); }
      else { await productsApi.create(payload); toast.success('تم إضافة المنتج'); }
      qc.invalidateQueries({ queryKey: ['products-admin'] });
      setModalOpen(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'حدث خطأ');
    } finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await productsApi.delete(deleteTarget.id);
      toast.success('تم حذف المنتج');
      qc.invalidateQueries({ queryKey: ['products-admin'] });
      setDeleteTarget(null);
    } catch { toast.error('فشل الحذف'); } finally { setIsDeleting(false); }
  };

  const columns = [
    { header: 'المنتج', render: (r: Product) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-zinc-800 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
          {r.image_url
            ? <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" />
            : <Package size={18} className="text-zinc-600" />}
        </div>
        <div>
          <div className="text-white font-medium">{r.name}</div>
          <div className="text-zinc-400 text-xs">{r.category}</div>
        </div>
      </div>
    )},
    { header: 'السعر', render: (r: Product) => <span className="text-amber-500 font-bold">{r.price} ₪</span> },
    { header: 'المخزون', render: (r: Product) => <span className={r.stock_quantity < 5 ? 'text-red-400 font-bold' : ''}>{r.stock_quantity}</span> },
    { header: 'الحالة', render: (r: Product) => <span className={`badge ${r.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{r.is_active ? 'نشط' : 'معطل'}</span> },
    { header: 'إجراءات', render: (r: Product) => (
      <div className="flex gap-2">
        <button onClick={() => openEdit(r)} className="p-1.5 text-zinc-400 hover:text-amber-500 hover:bg-zinc-800 rounded-lg"><Pencil size={14} /></button>
        <button onClick={() => setDeleteTarget(r)} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg"><Trash2 size={14} /></button>
      </div>
    )},
  ];

  return (
    <DashboardLayout navItems={adminNav} title="إدارة المنتجات">
      <div className="page-enter">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">المنتجات ({products.length})</h2>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} />إضافة منتج</button>
        </div>
        <div className="card p-0 overflow-hidden">
          <DataTable<Product> columns={columns} data={products} isLoading={isLoading} emptyMessage="لا توجد منتجات" />
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'تعديل المنتج' : 'إضافة منتج جديد'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          {/* Image picker */}
          <div>
            <label className="block text-zinc-400 text-sm mb-2">صورة المنتج</label>
            <div
              onClick={() => !uploadingImage && fileRef.current?.click()}
              className="relative w-full h-40 bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-xl overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:border-amber-500/50 transition-colors"
            >
              {form.image_url ? (
                <>
                  <img src={form.image_url} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="flex flex-col items-center gap-2 text-white">
                      {uploadingImage
                        ? <LoadingSpinner size="sm" />
                        : <Camera size={24} />}
                      <span className="text-sm">{uploadingImage ? 'جاري الرفع...' : 'تغيير الصورة'}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-zinc-500">
                  {uploadingImage ? <LoadingSpinner size="sm" /> : <Camera size={32} />}
                  <span className="text-sm">{uploadingImage ? 'جاري رفع الصورة...' : 'اضغط لاختيار صورة'}</span>
                  <span className="text-xs text-zinc-600">JPG أو PNG أو WebP — الحد الأقصى 5 ميغابايت</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageSelect} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput label="اسم المنتج" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="col-span-2" />
            <FormInput label="السعر (₪)" type="number" step="0.5" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
            <FormInput label="الكمية في المخزون" type="number" min="0" value={form.stock_quantity} onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))} required />
          </div>
          <FormSelect label="الفئة" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            <option value="">اختر الفئة</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </FormSelect>
          <FormTextarea label="الوصف" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
          <FormSelect label="الحالة" value={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.value }))}>
            <option value="true">نشط</option>
            <option value="false">معطل</option>
          </FormSelect>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">إلغاء</button>
            <button type="submit" disabled={isSaving || uploadingImage} className="btn-primary flex-1">
              {isSaving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="حذف المنتج" message={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟`} confirmText="حذف" isLoading={isDeleting} />
    </DashboardLayout>
  );
}
