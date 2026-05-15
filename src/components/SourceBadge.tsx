import { Source } from '@/types';

const sourceConfig: Record<Source, { label: string; color: string }> = {
  mercadolivre: { label: 'Mercado Livre', color: 'bg-yellow-400 text-yellow-900' },
  shopee: { label: 'Shopee', color: 'bg-orange-500 text-white' },
  amazon: { label: 'Amazon', color: 'bg-amber-500 text-white' },
};

interface SourceBadgeProps {
  source: Source;
  size?: 'sm' | 'md';
}

export default function SourceBadge({ source, size = 'md' }: SourceBadgeProps) {
  const config = sourceConfig[source];
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${sizeClass} ${config.color}`}>
      {config.label}
    </span>
  );
}
