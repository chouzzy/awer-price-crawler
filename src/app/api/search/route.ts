import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Search from '@/models/Search';
import { crawlAll } from '@/lib/crawlers';
import { Source } from '@/types';

const CACHE_TTL_MINUTES = 30;

function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim();
  const sourcesParam = searchParams.get('sources');
  const forceRefresh = searchParams.get('refresh') === '1';

  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  if (query.length > 200) {
    return NextResponse.json({ error: 'Query too long' }, { status: 400 });
  }

  const sources: Source[] = sourcesParam
    ? (sourcesParam.split(',').filter((s) =>
        ['mercadolivre', 'shopee', 'amazon'].includes(s)
      ) as Source[])
    : ['mercadolivre', 'shopee'];

  if (sources.length === 0) {
    return NextResponse.json({ error: 'No valid sources specified' }, { status: 400 });
  }

  try {
    await connectDB();

    const normalizedQuery = normalizeQuery(query);

    if (!forceRefresh) {
      const cached = await Search.findOne({
        normalizedQuery,
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });

      if (cached) {
        return NextResponse.json({
          query: cached.query,
          products: cached.products,
          stats: cached.stats,
          sources: cached.sources,
          duration: cached.duration,
          cachedAt: cached.createdAt,
        });
      }
    }

    const result = await crawlAll({ query, maxResults: 20 }, sources);

    if (result.products.length > 0) {
      const expiresAt = new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000);
      await Search.create({
        query,
        normalizedQuery,
        products: result.products,
        stats: result.stats,
        sources: result.sources,
        duration: result.duration,
        expiresAt,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prices. Please try again.' },
      { status: 500 }
    );
  }
}
