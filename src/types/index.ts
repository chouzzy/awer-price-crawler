export type Source = 'mercadolivre' | 'shopee' | 'amazon';

export interface ProductResult {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  currency: string;
  url: string;
  imageUrl?: string;
  source: Source;
  seller?: string;
  rating?: number;
  reviewCount?: number;
  installments?: string;
  condition?: 'new' | 'used';
  scrapedAt: Date;
}

export interface SearchResult {
  query: string;
  products: ProductResult[];
  sources: Source[];
  stats: PriceStats;
  duration: number;
  cachedAt?: Date;
  crawlerErrors?: Record<string, string>;
}

export interface PriceStats {
  min: number;
  max: number;
  avg: number;
  median: number;
  count: number;
}

export interface CrawlOptions {
  query: string;
  maxResults?: number;
  timeout?: number;
}

export interface CrawlResult {
  source: Source;
  products: ProductResult[];
  error?: string;
  duration: number;
}
