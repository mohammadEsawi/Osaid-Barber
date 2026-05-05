import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning';
}

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'تأكيد', isLoading, variant = 'danger' }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${variant === 'danger' ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
          <AlertTriangle size={28} className={variant === 'danger' ? 'text-red-400' : 'text-yellow-400'} />
        </div>
        <p className="text-zinc-300 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className="btn-secondary px-8">إلغاء</button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`font-semibold px-8 py-2.5 rounded-lg transition-all disabled:opacity-50 ${variant === 'danger' ? 'btn-danger' : 'bg-yellow-600 hover:bg-yellow-700 text-white'}`}
          >
            {isLoading ? 'جاري...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
