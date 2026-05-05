import { AppointmentStatus, OrderStatus, STATUS_COLORS, STATUS_LABELS, ORDER_STATUS_LABELS } from '../../types';

interface Props {
  status: AppointmentStatus | OrderStatus;
  type?: 'appointment' | 'order';
}

const ORDER_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  delivered: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

export default function StatusBadge({ status, type = 'appointment' }: Props) {
  const label = type === 'order'
    ? ORDER_STATUS_LABELS[status as OrderStatus]
    : STATUS_LABELS[status as AppointmentStatus];
  const color = type === 'order'
    ? ORDER_COLORS[status as OrderStatus]
    : STATUS_COLORS[status as AppointmentStatus];

  return (
    <span className={`badge ${color}`}>{label}</span>
  );
}
