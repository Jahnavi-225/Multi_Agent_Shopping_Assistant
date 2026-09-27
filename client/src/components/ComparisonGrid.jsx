import React, { useState } from 'react';
import ProductCard from './ProductCard';
import { ArrowUpDown, CheckCircle2, Info, Bell, AlertTriangle, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { addToWatchlist } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ComparisonGrid({ productData, onSelectListing, selectedListing }) {
  const { user } = useAuth();
  const { addToast } = useToast() || {};
  const [sortBy, setSortBy] = useState('price_asc');
  const [watchAdded, setWatchAdded] = useState(false);

  if (!productData) return null;

  const {
    id,
    title,
    brand,
    category,
    image_url,
    specs = {},
    key_features = [],
    listings = [],
    unavailable_platforms = [],
    lowest_price,
    highest_price,
    max_savings
  } = productData;

  // Numerical sorting logic
  const sortedListings = [...listings].sort((a, b) => {
    const pA = Number(a.price) || 0;
    const pB = Number(b.price) || 0;

    if (sortBy === 'price_asc') return pA - pB;
    if (sortBy === 'price_desc') return pB - pA;
    if (sortBy === 'deal_score') return (Number(b.deal_score) || 0) - (Number(a.deal_score) || 0);
    if (sortBy === 'rating') return (Number(b.rating) || 0) - (Number(a.rating) || 0);
    if (sortBy === 'discount') return (Number(b.discount_percent) || 0) - (Number(a.discount_percent) || 0);
    return 0;
  });

  const handleAddWatchlist = async () => {
    try {
      await addToWatchlist(id, lowest_price, user?.id || 'demo-user');
      setWatchAdded(true);
      if (addToast) addToast('Added to watchlist', 'success');
      setTimeout(() => setWatchAdded(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Product Overview Header */}
      <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
        <div className="w-full md:w-64 h-64 bg-white rounded-xl p-4 flex items-center justify-center border border-slate-200 dark:border-slate-800 flex-shrink-0">
          <img src={image_url} alt={title} className="max-h-full max-w-full object-contain hover:scale-105 transition-transform" />
        </div>

        <div className="flex-1 space-y-4 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-semibold text-xs border border-indigo-200 dark:border-indigo-800">
              {brand}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-xs">
              {category}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
            {title}
          </h2>

          {/* Quick Specs Pill Badges */}
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(specs).slice(0, 4).map(([k, v], idx) => (
              <div key={idx} className="glass-pill px-3 py-1 text-slate-700 dark:text-slate-300 font-medium">
                <span className="text-slate-400">{k}:</span> {v}
              </div>
            ))}
          </div>

          {/* Savings Highlight Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Best Platform Price Spread</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white flex items-baseline gap-2">
                <span className="text-emerald-500">₹{lowest_price?.toLocaleString()}</span>
                <span className="text-xs text-slate-400 font-normal">up to ₹{highest_price?.toLocaleString()}</span>
              </div>
              {max_savings > 0 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  🎉 Potential savings across stores: ₹{max_savings?.toLocaleString()}
                </p>
              )}
            </div>

            <button
              onClick={handleAddWatchlist}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all ${
                watchAdded
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                  : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'
              }`}
            >
              {watchAdded ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Added to Price Alerts!
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 text-amber-400" /> Set Price Alert
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Retailer Comparison Header & Sort Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Verified Retailer Listings</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400">
              {listings.length} Active Stores
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Automatically verified across Amazon, Flipkart, Myntra, Reliance Digital, Croma, Snapdeal, Meesho, Tata CLIQ, Ajio.
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none font-semibold"
          >
            <option value="price_asc">Lowest Price First</option>
            <option value="price_desc">Highest Price First</option>
            <option value="deal_score">Highest Deal Score</option>
            <option value="rating">Top Store Rating</option>
            <option value="discount">Highest Discount %</option>
          </select>
        </div>
      </div>

      {/* Platform Listing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedListings.map((listing) => (
          <ProductCard
            key={listing.id}
            listing={listing}
            onSelect={onSelectListing}
            isSelected={selectedListing?.id === listing.id}
          />
        ))}
      </div>

      {/* Platform Availability Awareness Section */}
      {unavailable_platforms.length > 0 && (
        <div className="pt-6 border-t border-slate-200/60 dark:border-slate-800/60 text-left space-y-4">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-slate-400" />
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Platform Availability Status ({unavailable_platforms.length} Stores Excluded)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {unavailable_platforms.map((un, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 flex items-start gap-2.5 opacity-75 hover:opacity-100 transition-opacity"
              >
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{un.platform}</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 font-semibold text-[10px]">
                      Not Listed
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-snug">
                    {un.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
