import React, { useEffect, useState } from 'react';
import { X, Bell, Trash2, ExternalLink, TrendingDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getWatchlist, removeFromWatchlist } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function WatchlistModal() {
  const { isWatchlistOpen, setIsWatchlistOpen, user } = useAuth();
  const { addToast } = useToast() || {};
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await getWatchlist(user?.id || 'demo-user');
      setItems(data.watchlist || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isWatchlistOpen) fetchItems();
  }, [isWatchlistOpen]);

  const handleRemove = async (watchlistId) => {
    try {
      await removeFromWatchlist(watchlistId);
      setItems(prev => prev.filter(i => i.watchlist_id !== watchlistId));
      if (addToast) addToast('Removed from watchlist', 'info');
    } catch (e) {
      console.error(e);
    }
  };

  if (!isWatchlistOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <div className="glass-card w-full max-w-lg p-6 relative shadow-2xl border-indigo-500/30 text-left">
        
        <button
          onClick={() => setIsWatchlistOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-amber-400" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Saved Product Wishlist</h3>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading wishlist...</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No products currently saved in your Wishlist. Click "Set Price Alert" or Wishlist icon on any product to save it!
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.watchlist_id} className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3">
                <img src={item.image_url} alt={item.title} className="w-12 h-12 object-contain bg-white rounded-lg p-1" />
                <div className="flex-1 truncate">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{item.title}</h4>
                  <div className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1 mt-0.5">
                    <TrendingDown className="w-3.5 h-3.5" /> Lowest Price: ₹{item.current_lowest_price?.toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(item.watchlist_id)}
                  className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                  title="Remove from Watchlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
