import { PriceStats as PriceStatsType } from '@/types';

function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface PriceStatsProps {
  stats: PriceStatsType;
  query: string;
}

export default function PriceStats({ stats, query }: PriceStatsProps) {
  const items = [
    { label: 'Menor preço', value: formatPrice(stats.min), color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
    { label: 'Preço médio', value: formatPrice(stats.avg), color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    { label: 'Mediana', value: formatPrice(stats.median), color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
    { label: 'Maior preço', value: formatPrice(stats.max), color: 'text-red-500', bg: 'bg-red-50 border-red-200' },
  ];

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-700 mb-3">
        Resumo de preços para{' '}
        <span className="text-blue-600">&ldquo;{query}&rdquo;</span>
        <span className="ml-2 text-sm font-normal text-gray-400">({stats.count} resultados)</span>
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={`rounded-xl border p-4 ${item.bg} flex flex-col gap-1`}
          >
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {item.label}
            </span>
            <span className={`text-xl font-bold ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
