'use client';

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = 'Buscando preços...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-blue-100 animate-pulse" />
        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-gray-600 font-medium">{message}</p>
        <p className="text-gray-400 text-sm mt-1">Consultando Mercado Livre e Shopee...</p>
      </div>
      <div className="flex gap-2">
        {['Mercado Livre', 'Shopee'].map((source, i) => (
          <span
            key={source}
            className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-500 animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          >
            {source}
          </span>
        ))}
      </div>
    </div>
  );
}
