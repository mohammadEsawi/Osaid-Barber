import { Clock, DollarSign, Scissors } from 'lucide-react';
import { Service } from '../../types';

interface Props {
  service: Service;
  onSelect?: (service: Service) => void;
  isSelected?: boolean;
  selectable?: boolean;
}

export default function ServiceCard({ service, onSelect, isSelected, selectable }: Props) {
  return (
    <div
      onClick={() => selectable && onSelect?.(service)}
      className={`card card-hover transition-all duration-200 ${selectable ? 'cursor-pointer' : ''} ${
        isSelected ? 'border-amber-500 bg-amber-500/5' : 'hover:border-zinc-600'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-amber-500' : 'bg-zinc-800'}`}>
          <Scissors size={22} className={isSelected ? 'text-white' : 'text-amber-500'} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-lg mb-1">{service.name}</h3>
          {service.description && <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{service.description}</p>}
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-amber-500 font-bold text-base">
              <DollarSign size={14} />
              {service.price} ₪
            </span>
            <span className="flex items-center gap-1 text-zinc-400">
              <Clock size={14} />
              {service.duration_minutes} دقيقة
            </span>
          </div>
        </div>
        {selectable && (
          <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-1 ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-zinc-600'}`}>
            {isSelected && <div className="w-full h-full flex items-center justify-center text-white text-xs">✓</div>}
          </div>
        )}
      </div>
    </div>
  );
}
