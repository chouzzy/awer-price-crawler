import { CrawlOptions, CrawlResult, ProductResult } from '@/types';

interface ShopeeItemBasic {
  itemid: number;
  shopid: number;
  name: string;
  price: number;
  price_min: number;
  price_before_discount: number;
  image: string;
  item_rating?: {
    rating_star: number;
    rating_count: number[];
  };
  historical_sold?: number;
  sold?: number;
}

export async function crawlShopee(options: CrawlOptions): Promise<CrawlResult> {
  const start = Date.now();
  const { query, maxResults = 20, timeout = 20000 } = options;

  try {
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

    const url = `https://shopee.com.br/api/v4/search/search_items?${params}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'Referer': `https://shopee.com.br/search?keyword=${encodeURIComponent(query)}`,
        'X-API-SOURCE': 'pc',
        'X-Requested-With': 'XMLHttpRequest',
        'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
      },
      signal: AbortSignal.timeout(timeout),
    });

    if (!res.ok) {
      throw new Error(`Shopee API HTTP ${res.status}`);
    }

    const json = await res.json();

    if (json.error && json.error !== 0) {
      throw new Error(`Shopee API error code: ${json.error}`);
    }

    const rawItems: { item_basic: ShopeeItemBasic }[] = json?.items ?? [];

    if (rawItems.length === 0 && json?.redirect_url) {
      throw new Error('Shopee redirected — possible bot detection');
    }

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

        const imageUrl = item.image
          ? `https://cf.shopee.com.br/file/${item.image}_tn`
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
      .filter((p): p is NonNullable<typeof p> => p !== null && p.price > 0) as ProductResult[];

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
