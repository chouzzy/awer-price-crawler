import { CrawlOptions, CrawlResult, ProductResult } from '@/types';

interface ShopeeItemBasic {
  itemid: number;
  shopid: number;
  name: string;
  price: number;
  price_before_discount: number;
  image: string;
  item_rating?: { rating_star: number; rating_count: number[] };
  historical_sold?: number;
}

function buildUrl(targetUrl: string): string {
  const key = process.env.SCRAPERAPI_KEY;
  if (!key) return targetUrl;
  return `http://api.scraperapi.com?api_key=${key}&url=${encodeURIComponent(targetUrl)}`;
}

export async function crawlShopee(options: CrawlOptions): Promise<CrawlResult> {
  const start = Date.now();
  const { query, maxResults = 20, timeout = 30000 } = options;

  try {
    if (!process.env.SCRAPERAPI_KEY) {
      throw new Error(
        'SCRAPERAPI_KEY não configurada. Crie uma conta gratuita em scraperapi.com e adicione a chave nas variáveis de ambiente.'
      );
    }

    const params = new URLSearchParams({
      by: 'relevancy',
      keyword: query,
      limit: String(maxResults),
      newest: '0',
      order: 'desc',
      page_type: 'search',
      scenario: 'PAGE_GLOBAL_SEARCH',
      version: '2',
    });

    const shopeeUrl = `https://shopee.com.br/api/v4/search/search_items?${params}`;
    const url = buildUrl(shopeeUrl);

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(timeout),
    });

    if (!res.ok) {
      throw new Error(`Shopee API HTTP ${res.status}`);
    }

    const json = await res.json();
    if (json.error && json.error !== 0) {
      throw new Error(`Shopee error ${json.error}: ${json.error_msg ?? 'unknown'}`);
    }

    const rawItems: { item_basic: ShopeeItemBasic }[] = json?.items ?? [];

    const products: ProductResult[] = rawItems
      .slice(0, maxResults)
      .map(({ item_basic: item }) => {
        const price = item.price / 100000;
        if (!price || price <= 0) return null;

        const originalPrice =
          item.price_before_discount > 0 && item.price_before_discount > item.price
            ? item.price_before_discount / 100000
            : undefined;

        const totalReviews =
          item.item_rating?.rating_count?.reduce((a, b) => a + b, 0) ?? 0;

        return {
          id: String(item.itemid),
          title: item.name,
          price,
          originalPrice,
          currency: 'BRL',
          url: `https://shopee.com.br/product/${item.shopid}/${item.itemid}`,
          imageUrl: item.image ? `https://cf.shopee.com.br/file/${item.image}_tn` : undefined,
          source: 'shopee' as const,
          rating: item.item_rating?.rating_star,
          reviewCount: totalReviews || item.historical_sold,
          condition: 'new' as const,
          scrapedAt: new Date(),
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null) as ProductResult[];

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
