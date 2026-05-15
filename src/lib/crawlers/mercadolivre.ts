import { CrawlOptions, CrawlResult, ProductResult } from '@/types';

interface MLInstallments {
  quantity: number;
  amount: number;
  rate: number;
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
  installments?: MLInstallments;
  seller?: { nickname: string };
  reviews?: { rating_average: number; total: number };
}

function buildUrl(targetUrl: string): string {
  const key = process.env.SCRAPERAPI_KEY;
  if (!key) return targetUrl;
  return `http://api.scraperapi.com?api_key=${key}&url=${encodeURIComponent(targetUrl)}`;
}

export async function crawlMercadoLivre(options: CrawlOptions): Promise<CrawlResult> {
  const start = Date.now();
  const { query, maxResults = 20, timeout = 30000 } = options;

  try {
    if (!process.env.SCRAPERAPI_KEY) {
      throw new Error(
        'SCRAPERAPI_KEY não configurada. Crie uma conta gratuita em scraperapi.com e adicione a chave nas variáveis de ambiente.'
      );
    }

    const params = new URLSearchParams({ q: query, limit: String(maxResults) });
    const mlUrl = `https://api.mercadolibre.com/sites/MLB/search?${params}`;
    const url = buildUrl(mlUrl);

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
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
        const inst = item.installments;
        const installmentText = inst
          ? `${inst.quantity}x de ${inst.amount.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}${inst.rate === 0 ? ' sem juros' : ''}`
          : undefined;

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
