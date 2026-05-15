'use client';

import { FormEvent, useState } from 'react';
import { Source } from '@/types';

interface SearchBarProps {
  onSearch: (query: string, sources: Source[]) => void;
  isLoading: boolean;
}

const SOURCES: { id: Source; label: string; color: string }[] = [
  { id: 'mercadolivre', label: 'Mercado Livre', color: 'peer-checked:bg-yellow-400 peer-checked:text-yellow-900 peer-checked:border-yellow-400' },
  { id: 'shopee', label: 'Shopee', color: 'peer-checked:bg-orange-500 peer-checked:text-white peer-checked:border-orange-500' },
];

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [selectedSources, setSelectedSources] = useState<Set<Source>>(
    new Set(['mercadolivre', 'shopee'])
  );

  function toggleSource(source: Source) {
    setSelectedSources((prev) => {
      const next = new Set(prev);
      if (next.has(source) && next.size > 1) {
        next.delete(source);
      } else {
        next.add(source);
      }
      return next;
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onSearch(query.trim(), Array.from(selectedSources));
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: iPhone 15 Pro, Notebook Dell, Tênis Nike..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-base"
            disabled={isLoading}
            maxLength={200}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-2xl shadow-sm transition-colors duration-150 whitespace-nowrap flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Buscando...
            </>
          ) : (
            'Buscar preços'
          )}
        </button>
      </div>

      <div className="flex items-center gap-2 justify-center">
        <span className="text-xs text-gray-400 font-medium">Buscar em:</span>
        {SOURCES.map(({ id, label, color }) => (
          <label key={id} className="cursor-pointer">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={selectedSources.has(id)}
              onChange={() => toggleSource(id)}
            />
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border border-gray-200 text-gray-500 bg-white transition-all duration-150 select-none ${color}`}
            >
              {label}
            </span>
          </label>
        ))}
      </div>
    </form>
  );
}
