import mongoose, { Schema, Document, Model } from 'mongoose';
import { ProductResult, Source } from '@/types';

export interface IProductResult {
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

export interface ISearch extends Document {
  query: string;
  normalizedQuery: string;
  products: IProductResult[];
  stats: {
    min: number;
    max: number;
    avg: number;
    median: number;
    count: number;
  };
  sources: Source[];
  duration: number;
  createdAt: Date;
  expiresAt: Date;
}

const ProductResultSchema = new Schema<IProductResult>({
  id: String,
  title: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: Number,
  currency: { type: String, default: 'BRL' },
  url: { type: String, required: true },
  imageUrl: String,
  source: { type: String, enum: ['mercadolivre', 'shopee', 'amazon'], required: true },
  seller: String,
  rating: Number,
  reviewCount: Number,
  installments: String,
  condition: { type: String, enum: ['new', 'used'] },
  scrapedAt: { type: Date, default: Date.now },
});

const SearchSchema = new Schema<ISearch>(
  {
    query: { type: String, required: true },
    normalizedQuery: { type: String, required: true, index: true },
    products: [ProductResultSchema],
    stats: {
      min: Number,
      max: Number,
      avg: Number,
      median: Number,
      count: Number,
    },
    sources: [{ type: String, enum: ['mercadolivre', 'shopee', 'amazon'] }],
    duration: Number,
    expiresAt: { type: Date, index: { expires: 0 } },
  },
  { timestamps: true }
);

SearchSchema.index({ normalizedQuery: 1, createdAt: -1 });

const Search: Model<ISearch> =
  mongoose.models.Search || mongoose.model<ISearch>('Search', SearchSchema);

export default Search;
