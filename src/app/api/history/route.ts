import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Search from '@/models/Search';

export async function GET() {
  try {
    await connectDB();

    const history = await Search.find(
      { 'products.0': { $exists: true } },
      { query: 1, stats: 1, sources: 1, createdAt: 1, _id: 0 }
    )
      .sort({ createdAt: -1 })
      .limit(20);

    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
