import { CrawlOptions, CrawlResult, ProductResult } from '@/types';

interface MLToken {
  access_token: string;
  expiresAt: number;
}

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

// In-memory token cache (lives for the duration of the Node process)
let cachedToken: MLToken | null = null;

async function getMLToken(): Promise<string | null> {
  const appId = process.env.MERCADOLIBRE_APP_ID;
  const secret = process.env.MERCADOLIBRE_APP_SECRET;
  if (!appId || !secret) return null;

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.access_token;
  }

  const res = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: appId,
      client_secret: secret,
    }),
  });

  if (!res.ok) {
    console.error('[ML] Token fetch failed:', res.status, await res.text().catch(() => ''));
    return null;
  }

  const data = await res.json();
  cachedToken = {
    access_token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 21600) * 1000,
  };
  return cachedToken.access_token;
}

export async function crawlMercadoLivre(options: CrawlOptions): Promise<CrawlResult> {
  const start = Date.now();
  const { query, maxResults = 20, timeout = 20000 } = options;

  try {
    const token = await getMLToken();

    const params = new URLSearchParams({ q: query, limit: String(maxResults) });
    const url = `https://api.mercadolibre.com/sites/MLB/search?${params}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; PriceCrawler/1.0)',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, { headers, signal: AbortSignal.timeout(timeout) });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(
        token
          ? `ML API HTTP ${res.status}: ${body}`
          : `ML API HTTP ${res.status} — configure MERCADOLIBRE_APP_ID e MERCADOLIBRE_APP_SECRET nas variáveis de ambiente`
      );
    }

    const json = await res.json();
    const results: MLResult[] = json.results ?? [];

    const products: ProductResult[] = results
      .filter((item) => item.price > 0)
      .map((item) => {
        const inst = item.installments;
        const installmentText = inst
          ? `${inst.quantity}x de ${inst.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}${inst.rate === 0 ? ' sem juros' : ''}`
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
