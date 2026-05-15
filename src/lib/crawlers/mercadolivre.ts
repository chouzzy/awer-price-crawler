import * as cheerio from 'cheerio';
import { CrawlOptions, CrawlResult, ProductResult } from '@/types';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
};

function parseMLPrice(intText: string, centsText: string): number {
  const int = parseFloat(intText.replace(/\./g, '').trim()) || 0;
  const cents = parseFloat(centsText.trim()) / 100 || 0;
  return int + cents;
}

export async function crawlMercadoLivre(options: CrawlOptions): Promise<CrawlResult> {
  const start = Date.now();
  const { query, maxResults = 20, timeout = 20000 } = options;

  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://lista.mercadolivre.com.br/${encodedQuery}`;

    const res = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(timeout),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const products: ProductResult[] = [];

    $('.ui-search-layout__item, .results-item').each((_, el) => {
      if (products.length >= maxResults) return false;

      const titleEl = $(el).find('.ui-search-item__title, h2.poly-box, .item__title').first();
      const title = titleEl.text().trim();
      if (!title) return;

      const linkEl = $(el).find('a.ui-search-link, a.poly-component__title, .item__title a').first();
      const href = linkEl.attr('href');
      if (!href) return;
      const productUrl = href.startsWith('http') ? href : `https://www.mercadolivre.com.br${href}`;

      const intEl = $(el).find('.andes-money-amount__fraction, .price-tag-fraction').first();
      const centsEl = $(el).find('.andes-money-amount__cents, .price-tag-cents').first();
      const priceInt = intEl.text();
      if (!priceInt) return;

      const price = parseMLPrice(priceInt, centsEl.text() || '00');
      if (!price || price <= 0) return;

      const origIntEl = $(el)
        .find('.ui-search-price__original-value .andes-money-amount__fraction')
        .first();
      const origCentsEl = $(el)
        .find('.ui-search-price__original-value .andes-money-amount__cents')
        .first();
      const originalPrice = origIntEl.text()
        ? parseMLPrice(origIntEl.text(), origCentsEl.text() || '00')
        : undefined;

      const imageEl = $(el).find(
        '.ui-search-result-image__element img, .poly-component__picture img'
      );
      const imageUrl =
        imageEl.attr('data-src') ?? imageEl.attr('src') ?? undefined;

      const installments = $(el)
        .find('.ui-search-installments, .poly-price__installments')
        .first()
        .text()
        .trim() || undefined;

      const ratingText = $(el).find('.ui-search-reviews__rating-number').text().trim();
      const rating = ratingText ? parseFloat(ratingText) : undefined;

      const reviewText = $(el)
        .find('.ui-search-reviews__amount')
        .text()
        .replace(/[()]/g, '')
        .trim();
      const reviewCount = reviewText ? parseInt(reviewText) : undefined;

      const conditionText = $(el)
        .find('.ui-search-item__condition-tag')
        .text()
        .toLowerCase();
      const condition: 'new' | 'used' = conditionText.includes('usado') ? 'used' : 'new';

      products.push({
        id: Math.random().toString(36).substring(2),
        title,
        price,
        originalPrice,
        currency: 'BRL',
        url: productUrl,
        imageUrl,
        source: 'mercadolivre',
        installments,
        rating,
        reviewCount,
        condition,
        scrapedAt: new Date(),
      });
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
