import { CrawlOptions, PriceStats, ProductResult, SearchResult, Source } from '@/types';
import { crawlMercadoLivre } from './mercadolivre';
import { crawlShopee } from './shopee';

function computeStats(products: ProductResult[]): PriceStats {
  if (products.length === 0) {
    return { min: 0, max: 0, avg: 0, median: 0, count: 0 };
  }

  const prices = products.map((p) => p.price).sort((a, b) => a - b);
  const sum = prices.reduce((acc, p) => acc + p, 0);
  const mid = Math.floor(prices.length / 2);
  const median =
    prices.length % 2 === 0 ? (prices[mid - 1] + prices[mid]) / 2 : prices[mid];

  return {
    min: prices[0],
    max: prices[prices.length - 1],
    avg: Math.round((sum / prices.length) * 100) / 100,
    median: Math.round(median * 100) / 100,
    count: prices.length,
  };
}

export async function crawlAll(
  options: CrawlOptions,
  sources: Source[] = ['mercadolivre', 'shopee']
): Promise<SearchResult> {
  const start = Date.now();

  const crawlers: Record<Source, (opts: CrawlOptions) => Promise<{ source: Source; products: ProductResult[]; error?: string; duration: number }>> = {
    mercadolivre: crawlMercadoLivre,
    shopee: crawlShopee,
    amazon: async () => ({ source: 'amazon', products: [], error: 'Not implemented', duration: 0 }),
  };

  const results = await Promise.allSettled(
    sources.map((source) => crawlers[source](options))
  );

  const allProducts: ProductResult[] = [];
  const activeSources: Source[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.products.length > 0) {
      allProducts.push(...result.value.products);
      activeSources.push(result.value.source);
    }
  }

  allProducts.sort((a, b) => a.price - b.price);

  return {
    query: options.query,
    products: allProducts,
    sources: activeSources,
    stats: computeStats(allProducts),
    duration: Date.now() - start,
  };
}
