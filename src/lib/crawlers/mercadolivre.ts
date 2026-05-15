import { CrawlOptions, CrawlResult, ProductResult } from '@/types';

interface MLInstallments {
  quantity: number;
  amount: number;
  rate: number;
  currency_id: string;
}

interface MLResult {
  id: string;
  title: string;
  price: number;
  original_price: number | null;
  currency_id: string;
  permalink: string;
  thumbnail: string;
  condition: string;
  available_quantity: number;
  installments?: MLInstallments;
  seller?: { nickname: string };
  reviews?: { rating_average: number; total: number };
}

export async function crawlMercadoLivre(options: CrawlOptions): Promise<CrawlResult> {
  const start = Date.now();
  const { query, maxResults = 20, timeout = 20000 } = options;

  try {
    const params = new URLSearchParams({
      q: query,
      limit: String(maxResults),
      site_id: 'MLB',
    });

    const url = `https://api.mercadolibre.com/sites/MLB/search?${params}`;

    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; price-crawler/1.0)',
      },
      signal: AbortSignal.timeout(timeout),
    });

    if (!res.ok) {
      throw new Error(`ML API HTTP ${res.status}: ${await res.text().catch(() => '')}`);
    }

    const json = await res.json();
    const results: MLResult[] = json.results ?? [];

    const products: ProductResult[] = results
      .filter((item) => item.price > 0)
      .map((item) => {
        const installmentText =
          item.installments && item.installments.rate === 0
            ? `${item.installments.quantity}x de ${item.installments.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} sem juros`
            : item.installments
            ? `${item.installments.quantity}x de ${item.installments.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
            : undefined;

        // ML thumbnail: replace small size with larger
        const imageUrl = item.thumbnail
          ? item.thumbnail.replace('I.jpg', 'O.jpg').replace('-I.', '-O.')
          : undefined;

        return {
          id: item.id,
          title: item.title,
          price: item.price,
          originalPrice: item.original_price ?? undefined,
          currency: item.currency_id,
          url: item.permalink,
          imageUrl,
          source: 'mercadolivre' as const,
          seller: item.seller?.nickname,
          rating: item.reviews?.rating_average,
          reviewCount: item.reviews?.total,
          installments: installmentText,
          condition: item.condition === 'used' ? 'used' : 'new',
          scrapedAt: new Date(),
        };
      });

    return { source: 'mercadolivre', products, duration: Date.now() - start };
  } catch (error) {
    return {
      source: 'mercadolivre',
      products: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - start,
    };
  }
}
