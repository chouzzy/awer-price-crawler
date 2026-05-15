import { CrawlOptions, CrawlResult, ProductResult } from '@/types';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://shopee.com.br/',
  'Accept': 'application/json',
  'Accept-Language': 'pt-BR,pt;q=0.9',
  'X-API-SOURCE': 'pc',
  'X-Shopee-Language': 'pt',
  'If-None-Match': '',
};

interface ShopeeItem {
  itemid: number;
  shopid: number;
  name: string;
  price: number;
  price_min: number;
  price_max: number;
  price_before_discount?: number;
  image: string;
  item_rating?: {
    rating_star: number;
    rating_count: number[];
  };
  sold?: number;
  historical_sold?: number;
  show_free_shipping?: boolean;
}

export async function crawlShopee(options: CrawlOptions): Promise<CrawlResult> {
  const start = Date.now();
  const { query, maxResults = 20, timeout = 20000 } = options;

  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://shopee.com.br/api/v4/search/search_items?by=relevancy&keyword=${encodedQuery}&limit=${maxResults}&newest=0&order=desc&page_type=search&scenario=PAGE_GLOBAL_SEARCH&version=2`;

    const res = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(timeout),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();
    const items: ShopeeItem[] = (json?.items ?? []).map(
      (i: { item_basic: ShopeeItem }) => i.item_basic
    );

    const products: ProductResult[] = items
      .slice(0, maxResults)
      .map((item) => {
        const price = item.price / 100000;
        const originalPrice =
          item.price_before_discount && item.price_before_discount > item.price
            ? item.price_before_discount / 100000
            : undefined;

        const totalReviews = item.item_rating?.rating_count?.reduce((a, b) => a + b, 0) ?? 0;
        const imageUrl = item.image
          ? `https://cf.shopee.com.br/file/${item.image}`
          : undefined;

        return {
          id: String(item.itemid),
          title: item.name,
          price,
          originalPrice,
          currency: 'BRL',
          url: `https://shopee.com.br/product/${item.shopid}/${item.itemid}`,
          imageUrl,
          source: 'shopee' as const,
          rating: item.item_rating?.rating_star,
          reviewCount: totalReviews || item.historical_sold,
          condition: 'new' as const,
          scrapedAt: new Date(),
        };
      })
      .filter((p) => p.price > 0);

    return { source: 'shopee', products, duration: Date.now() - start };
  } catch (error) {
    return {
      source: 'shopee',
      products: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - start,
    };
  }
}
