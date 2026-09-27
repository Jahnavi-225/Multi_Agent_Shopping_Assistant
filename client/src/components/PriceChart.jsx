import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingDown, Calendar, Store } from 'lucide-react';

export default function PriceChart({ listing, allListings = [] }) {
  if (!listing || !listing.price_history || listing.price_history.length === 0) {
    return null;
  }

  const [selectedPlatform, setSelectedPlatform] = useState(listing.platform);
  const activeListing = allListings.find(l => l.platform === selectedPlatform) || listing;

  const chartData = (activeListing.price_history || []).map(item => ({
    date: item.date,
    Price: item.price
  }));

  const minPrice = Math.min(...(activeListing.price_history || []).map(p => p.price));
  const maxPrice = Math.max(...(activeListing.price_history || []).map(p => p.price));
  const priceChange = activeListing.price_history?.length > 1
    ? activeListing.price_history[activeListing.price_history.length - 1].price - activeListing.price_history[0].price
    : 0;

  return (
    <div className="glass-card p-6 space-y-4 text-left">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
        <div>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Historical Price Trends</span>
            <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
              APScheduler Tracker
            </span>
          </h4>
          <p className="text-xs text-slate-500">Tracked across platforms per product snapshot in database.</p>
        </div>

        {/* Platform Selector Buttons */}
        {allListings.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Store className="w-3.5 h-3.5" /> Store:
            </span>
            {allListings.map((l) => (
              <button
                key={l.id}
                onClick={() => setSelectedPlatform(l.platform)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  selectedPlatform === l.platform
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {l.platform}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                color: '#fff',
                fontSize: '12px'
              }}
              formatter={(value) => [`₹${value.toLocaleString()}`, `${selectedPlatform} Price`]}
            />
            <Area
              type="monotone"
              dataKey="Price"
              stroke="#6366f1"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#priceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Insight Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
        <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
          <span className="text-slate-400 block">{selectedPlatform} Lowest Recorded</span>
          <strong className="text-emerald-500 font-bold text-sm">₹{minPrice.toLocaleString()}</strong>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
          <span className="text-slate-400 block">{selectedPlatform} Highest Recorded</span>
          <strong className="text-slate-900 dark:text-slate-100 font-bold text-sm">₹{maxPrice.toLocaleString()}</strong>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
          <span className="text-slate-400 block">30-Day Net Price Trend</span>
          <strong className={priceChange <= 0 ? "text-emerald-500 font-bold text-sm" : "text-amber-500 font-bold text-sm"}>
            {priceChange <= 0 ? `Dropped by ₹${Math.abs(priceChange).toLocaleString()}` : `Increased by ₹${priceChange.toLocaleString()}`}
          </strong>
        </div>
      </div>

    </div>
  );
}
