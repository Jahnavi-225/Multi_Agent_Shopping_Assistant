import React from 'react';
import { ExternalLink, Star, Truck, ShieldCheck, Tag, Award } from 'lucide-react';

export default function ProductCard({ listing, onSelect, isSelected }) {
  const {
    platform,
    price,
    original_price,
    currency = '₹',
    rating = 4.5,
    review_count = 120,
    seller,
    shipping,
    url,
    badge,
    discount_percent,
    savings,
    deal_score,
    is_lowest_price
  } = listing;

  const platformColors = {
    Amazon: "from-amber-500 to-yellow-600 border-amber-500/30 text-amber-500",
    Flipkart: "from-blue-600 to-indigo-600 border-blue-500/30 text-blue-400",
    Myntra: "from-pink-500 to-rose-600 border-pink-500/30 text-pink-400",
    "Reliance Digital": "from-red-600 to-red-700 border-red-500/30 text-red-400",
    Croma: "from-teal-500 to-emerald-600 border-teal-500/30 text-teal-400",
    Snapdeal: "from-red-500 to-orange-600 border-red-500/30 text-orange-400"
  };

  const currentPlatformStyle = platformColors[platform] || "from-slate-600 to-slate-700 border-slate-500/30 text-indigo-400";

  const normalizeUrl = (targetUrl) => {
    if (!targetUrl) return '#';
    if (/^https?:\/\//i.test(targetUrl)) return targetUrl;
    return `https://${targetUrl.replace(/^\/+/, '')}`;
  };

  return (
    <div 
      className={`glass-card p-5 relative transition-all duration-300 ${
        is_lowest_price ? 'ring-2 ring-emerald-500/80 shadow-emerald-500/10' : ''
      } ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-500' : 'hover:scale-[1.01]'}`}
    >
      {/* Lowest Price Glow Badge */}
      {is_lowest_price && (
        <div className="absolute -top-3 left-4 px-3 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-md badge-glow">
          <Award className="w-3.5 h-3.5" /> Best Deal • Lowest Price
        </div>
      )}

      {/* Header: Platform & Deal Score */}
      <div className="flex items-center justify-between gap-2 mt-1 mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-lg font-black text-xs uppercase tracking-wide bg-slate-100 dark:bg-slate-800 border ${currentPlatformStyle.split(' ')[2]}`}>
            {platform}
          </span>
          {badge && !is_lowest_price && (
            <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold">
              {badge}
            </span>
          )}
        </div>

        {deal_score && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Score:</span>
            <span className={deal_score >= 85 ? 'text-emerald-500 font-bold' : 'text-indigo-400'}>{deal_score}/100</span>
          </div>
        )}
      </div>

      {/* Pricing Section */}
      <div className="my-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {currency}{price.toLocaleString()}
          </span>
          {original_price > price && (
            <span className="text-xs sm:text-sm text-slate-400 line-through">
              {currency}{original_price.toLocaleString()}
            </span>
          )}
          {discount_percent > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold text-xs">
              {discount_percent}% OFF
            </span>
          )}
        </div>

        {savings > 0 && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <Tag className="w-3 h-3" /> Save {currency}{savings.toLocaleString()} off list price
          </p>
        )}
      </div>

      {/* Meta Info */}
      <div className="space-y-1.5 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <strong className="text-slate-900 dark:text-slate-200">{rating}</strong> ({review_count.toLocaleString()} ratings)
          </span>
          {seller && <span className="truncate max-w-[120px]" title={seller}>By {seller}</span>}
        </div>

        <div className="flex items-center gap-1 text-slate-500">
          <Truck className="w-3.5 h-3.5 text-indigo-400" />
          <span>{shipping || 'Free Shipping'}</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 flex items-center gap-2">
        <button
          onClick={() => onSelect && onSelect(listing)}
          className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
        >
          View Price History
        </button>

        <a
          href={normalizeUrl(url)}
          target="_blank"
          rel="noopener noreferrer"
          className="py-2 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center gap-1.5 shadow-md transition-all"
        >
          <span>Buy Now</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

    </div>
  );
}
