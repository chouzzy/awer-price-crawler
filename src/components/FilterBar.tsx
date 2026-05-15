'use client';

import { Source } from '@/types';
import SourceBadge from './SourceBadge';

type SortOption = 'price_asc' | 'price_desc' | 'relevance';

interface FilterBarProps {
  totalCount: number;
  sources: Source[];
  activeSource: Source | null;
  onSourceChange: (source: Source | null) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  countBySource: Record<Source, number>;
}

export default function FilterBar({
  totalCount,
  sources,
  activeSource,
  onSourceChange,
  sortBy,
  onSortChange,
  countBySource,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => onSourceChange(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            activeSource === null
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
          }`}
        >
          Todos ({totalCount})
        </button>
        {sources.map((source) => (
          <button
            key={source}
            onClick={() => onSourceChange(source)}
            className={`transition-opacity ${activeSource !== null && activeSource !== source ? 'opacity-50' : ''}`}
          >
            <SourceBadge source={source} size="sm" />
            <span className="ml-1 text-xs text-gray-400">({countBySource[source] ?? 0})</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Ordenar:</span>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="price_asc">Menor preço</option>
          <option value="price_desc">Maior preço</option>
          <option value="relevance">Relevância</option>
        </select>
      </div>
    </div>
  );
}
