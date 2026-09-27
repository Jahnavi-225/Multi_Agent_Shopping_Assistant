import React, { useState, useEffect } from 'react';
import HeroSearch from '../components/HeroSearch';
import ComparisonGrid from '../components/ComparisonGrid';
import PriceChart from '../components/PriceChart';
import { searchProduct, getFeaturedProducts, getProductComparison } from '../services/api';
import { Sparkles, ArrowRight, Layers, ShoppingBag, ExternalLink } from 'lucide-react';

export default function Dashboard({ searchResult, setSearchResult }) {
  const [loading, setLoading] = useState(false);
  const [featuredDeals, setFeaturedDeals] = useState([]);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    getFeaturedProducts().then(res => {
      if (res.status === 'success') {
        setFeaturedDeals(res.featured || []);
        if (!searchResult && res.featured.length > 0) {
          setSearchResult(res.featured[0]);
          setSelectedListing(res.featured[0].listings[0]);
        }
      }
    }).catch(console.error);
  }, []);

  const handleSearch = async (query) => {
    setLoading(true);
    setSearchQuery(query);
    setSearchError('');
    try {
      const res = await searchProduct(query);
      if (res.status === 'success' && res.product) {
        setSearchResult(res.product);
        setSimilarProducts(res.similar_products || []);
        if (res.product.listings && res.product.listings.length > 0) {
          setSelectedListing(res.product.listings[0]);
        }
      } else {
        setSearchResult(null);
        setSearchError(`No results found for "${query}"`);
      }
    } catch (e) {
      console.error("Search error:", e);
      setSearchResult(null);
      setSearchError(`No results found for "${query}"`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = async (prodId) => {
    setLoading(true);
    try {
      const res = await getProductComparison(prodId);
      if (res.status === 'success' && res.product) {
        setSearchResult(res.product);
        if (res.product.listings && res.product.listings.length > 0) {
          setSelectedListing(res.product.listings[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 space-y-8">
      
      {/* Hero Search Bar */}
      <HeroSearch onSearch={handleSearch} isLoading={loading} />

      {/* Explicit Empty State UI for Zero Matches */}
      {searchError && !searchResult && (
        <div className="max-w-3xl mx-auto my-8 p-8 glass-card text-center space-y-4 border-amber-500/30">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto text-xl font-bold">
            🔍
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {searchError}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            We couldn't find a matching product in our verified multi-platform catalog. Try searching directly on retailer marketplaces:
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href={`https://www.amazon.in/s?k=${encodeURIComponent(searchQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center gap-1.5 transition-colors"
            >
              Search on Amazon <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href={`https://www.flipkart.com/search?q=${encodeURIComponent(searchQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/30 flex items-center gap-1.5 transition-colors"
            >
              Search on Flipkart <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href={`https://www.meesho.com/search?q=${encodeURIComponent(searchQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 border border-pink-500/30 flex items-center gap-1.5 transition-colors"
            >
              Search on Meesho <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href={`https://www.myntra.com/${encodeURIComponent(searchQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center gap-1.5 transition-colors"
            >
              Search on Myntra <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Featured Deals Carousel */}
      {featuredDeals.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Curated Deal Spotlights</h4>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {featuredDeals.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectProduct(item.id)}
                className={`p-3 rounded-xl glass-card flex items-center gap-3 flex-shrink-0 text-left transition-all ${
                  searchResult?.id === item.id ? 'ring-2 ring-indigo-500 border-indigo-500' : 'hover:border-slate-400'
                }`}
              >
                <img src={item.image_url} alt={item.title} className="w-10 h-10 object-contain bg-white rounded-lg p-1" />
                <div className="truncate max-w-[160px]">
                  <span className="font-bold text-xs truncate block text-slate-900 dark:text-white">{item.title}</span>
                  <span className="text-[11px] text-emerald-500 font-bold">From ₹{item.lowest_price?.toLocaleString()}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Comparison Matrix Grid */}
      {searchResult && (
        <div className="space-y-8">
          <ComparisonGrid
            productData={searchResult}
            onSelectListing={(listing) => setSelectedListing(listing)}
            selectedListing={selectedListing}
          />

          {/* Interactive Multi-Platform Price Trend Chart */}
          {selectedListing && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <PriceChart listing={selectedListing} allListings={searchResult.listings || []} />
            </div>
          )}

          {/* Similar & Alternative Products Discovery Section */}
          {similarProducts.length > 0 && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 border-t border-slate-200/60 dark:border-slate-800/60 text-left">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-5 h-5 text-indigo-500" />
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    Similar Products & Alternatives
                  </h3>
                  <p className="text-xs text-slate-500">
                    Discovered via vector embeddings semantic product matching.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {similarProducts.map((sim) => (
                  <div
                    key={sim.id}
                    onClick={() => handleSelectProduct(sim.id)}
                    className="glass-card p-4 flex items-center justify-between gap-3 cursor-pointer hover:border-indigo-500 transition-all group"
                  >
                    <img src={sim.image_url} alt={sim.title} className="w-14 h-14 object-contain bg-white rounded-lg p-1" />
                    <div className="flex-1 truncate">
                      <span className="text-[10px] uppercase font-bold text-indigo-500 block">{sim.brand} • {sim.category}</span>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-indigo-400 transition-colors">
                        {sim.title}
                      </h4>
                      <span className="text-xs text-emerald-500 font-bold">
                        From ₹{sim.lowest_price?.toLocaleString()}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
