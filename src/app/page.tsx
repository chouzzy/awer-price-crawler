'use client';

import { useState, useMemo } from 'react';
import SearchBar from '@/components/SearchBar';
import ProductCard from '@/components/ProductCard';
import PriceStats from '@/components/PriceStats';
import LoadingSpinner from '@/components/LoadingSpinner';
import FilterBar from '@/components/FilterBar';
import { ProductResult, SearchResult, Source } from '@/types';

type SortOption = 'price_asc' | 'price_desc' | 'relevance';

export default function Home() {
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<Source | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('price_asc');
  const [lastQuery, setLastQuery] = useState('');

  async function handleSearch(query: string, sources: Source[]) {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setActiveSource(null);
    setLastQuery(query);

    try {
      const params = new URLSearchParams({ q: query, sources: sources.join(',') });
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Erro ao buscar preços');
        return;
      }

      if (data.products?.length === 0) {
        const errDetails = data.crawlerErrors
          ? Object.entries(data.crawlerErrors)
              .map(([src, msg]) => `${src}: ${msg}`)
              .join(' | ')
          : null;
        setError(
          errDetails
            ? `Nenhum produto encontrado. Erros: ${errDetails}`
            : 'Nenhum produto encontrado. Tente outros termos.'
        );
        return;
      }

      setResult(data);
    } catch {
      setError('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  const filteredAndSorted = useMemo<ProductResult[]>(() => {
    if (!result) return [];

    const products = activeSource
      ? result.products.filter((p) => p.source === activeSource)
      : result.products;

    return [...products].sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return 0;
    });
  }, [result, activeSource, sortBy]);

  const countBySource = useMemo<Record<Source, number>>(() => {
    if (!result) return {} as Record<Source, number>;
    return result.products.reduce(
      (acc, p) => ({ ...acc, [p.source]: (acc[p.source] ?? 0) + 1 }),
      {} as Record<Source, number>
    );
  }, [result]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Price Crawler
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">
            Compare preços em{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              segundos
            </span>
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Buscamos automaticamente no Mercado Livre e Shopee para você encontrar o melhor preço.
          </p>
        </header>

        <div className="mb-10">
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        </div>

        {isLoading && <LoadingSpinner message={`Buscando "${lastQuery}"...`} />}

        {error && !isLoading && (
          <div className="max-w-lg mx-auto">
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4">
              <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {result && !isLoading && (
          <div>
            {result.cachedAt && (
              <p className="text-center text-xs text-gray-400 mb-4">
                Resultado em cache de {new Date(result.cachedAt).toLocaleString('pt-BR')} ·{' '}
                <button
                  onClick={() => handleSearch(lastQuery, result.sources)}
                  className="text-blue-500 hover:underline"
                >
                  Atualizar
                </button>
              </p>
            )}

            <PriceStats stats={result.stats} query={result.query} />

            <FilterBar
              totalCount={result.products.length}
              sources={result.sources}
              activeSource={activeSource}
              onSourceChange={setActiveSource}
              sortBy={sortBy}
              onSortChange={setSortBy}
              countBySource={countBySource}
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredAndSorted.map((product) => (
                <ProductCard key={`${product.source}-${product.id}`} product={product} />
              ))}
            </div>

            {filteredAndSorted.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                Nenhum produto desta fonte encontrado.
              </div>
            )}
          </div>
        )}

        {!result && !isLoading && !error && (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-lg font-medium">Digite um produto para começar</p>
            <p className="text-sm mt-1">Exemplos: iPhone 15, Notebook Dell, Tênis Nike</p>
          </div>
        )}
      </div>
    </main>
  );
}
