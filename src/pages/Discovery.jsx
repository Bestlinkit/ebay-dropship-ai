import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Loader2, 
  TrendingUp,
  Target,
  ChevronRight,
  ChevronLeft,
  ShoppingBag,
  ExternalLink,
  Shield,
  Layers,
  ArrowUpRight,
  RefreshCw,
  Box,
  BarChart3,
  CheckCircle2,
  Package,
  Zap,
  DollarSign,
  AlertCircle,
  Eye,
  Activity,
  History,
  Layout
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import ebayService from '../services/ebay';
import ebayTrading from '../services/ebay_trading';
import sourcingService from '../services/sourcing';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

/**
 * Market Research Intelligence Terminal (v7.0)
 * Transforming 'Optimization' into a high-performance, full-width SaaS research hub.
 */
const MarketResearch = () => {
  const [activeTab, setActiveTab] = useState('intelligence'); // 'intelligence' or 'my-listings'
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [filters, setFilters] = useState({
    categoryId: '',
    minPrice: '',
    maxPrice: '',
    condition: 'NEW',
    sellerHistory: 'ALL',
    sort: 'ops'
  });
  
  const [pagination, setPagination] = useState({ page: 1, total: 0 });
  const [error, setError] = useState(null);
  
  const cacheRegistry = useRef(new Map());
  const { user } = useAuth();
  const navigate = useNavigate();

  // 1. DATA PULSE: My Listings Synchronization
  const fetchMyListings = useCallback(async () => {
    if (!user?.ebayToken) return;
    try {
      const liveProducts = await ebayTrading.getActiveListings(user.ebayToken);
      setMyListings(liveProducts || []);
    } catch (e) {
      console.warn("[Inventory Sync] Fetch failure on 'My Listings' tab.");
    }
  }, [user]);

  // 2. INTELLIGENCE ENGINE: Deterministic Ranking
  const rankResults = useCallback((results) => {
    return results
      .map(item => ({
        ...item,
        ops: sourcingService.calculateOPS(item)
      }))
      .sort((a, b) => {
         if (filters.sort === 'ops') return b.ops.score - a.ops.score;
         if (filters.sort === 'price_asc') return a.price - b.price;
         if (filters.sort === 'price_desc') return b.price - a.price;
         return 0;
      });
  }, [filters.sort]);

  // 3. CACHE REGISTRY: Key-Based Integrity
  const getCacheKey = useCallback(() => {
    const hashData = { q: query, ...filters, page: pagination.page };
    return btoa(JSON.stringify(hashData));
  }, [query, filters, pagination.page]);

  // 4. CORE EXECUTION: Intelligence Feed
  const executeResearch = useCallback(async (isAuto = false) => {
    const cacheKey = getCacheKey();
    if (cacheRegistry.current.has(cacheKey) && !isAuto) {
      setProducts(cacheRegistry.current.get(cacheKey));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let results = [];
      if (isAuto && !query) {
        results = await ebayService.fetchTrendingProducts(filters.categoryId || null);
      } else {
        results = await ebayService.searchProducts(query || 'best sellers', {
          ...filters,
          limit: 12,
          offset: (pagination.page - 1) * 12
        });
      }

      const intelligenceRanked = rankResults(results);
      setProducts(intelligenceRanked);
      cacheRegistry.current.set(cacheKey, intelligenceRanked);
    } catch (err) {
      setError("Market data temporarily unavailable - Registry synchronization fault.");
    } finally {
      setLoading(false);
    }
  }, [getCacheKey, filters, pagination.page, query, rankResults]);

  // Reactive Pulse (Automatic trigger on filter change)
  useEffect(() => {
    const timer = setTimeout(() => executeResearch(), 400); // 400ms Debounce
    return () => clearTimeout(timer);
  }, [filters, query, pagination.page]);

  useEffect(() => {
    // Top-Level Categorization Preloader
    if (!categories.length) {
       ebayService.getCategorySuggestions('top').then(setCategories);
    }
    // Inventory Synchronization
    if (activeTab === 'my-listings') {
      fetchMyListings();
    }
  }, [activeTab, fetchMyListings]);

  // Default Value Induction
  useEffect(() => {
    executeResearch(true);
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-32 max-w-[1700px] mx-auto px-6">
      
      {/* 🚀 TOP BAR: FULL-WIDTH FILTER STRIP */}
      <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-3 pl-8 shadow-2xl flex flex-wrap items-center gap-6">
         <div className="flex items-center gap-4 flex-1 min-w-[300px]">
            <Search className="text-slate-500" size={20} />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Instant Market Intelligence Query..."
              className="w-full bg-transparent py-4 text-sm font-bold text-white outline-none placeholder:text-slate-600"
            />
         </div>

         <div className="h-10 w-px bg-slate-800 hidden md:block" />

         <div className="flex flex-wrap items-center gap-4">
            <select 
              value={filters.categoryId}
              onChange={(e) => setFilters(p => ({ ...p, categoryId: e.target.value }))}
              className="bg-slate-800/50 border border-slate-700/50 rounded-2xl px-5 py-3 text-[11px] font-black uppercase text-text-primary outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
            >
              <option value="">Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <div className="flex items-center gap-2 bg-slate-800/30 rounded-2xl border border-slate-700/50 px-4">
               <DollarSign size={14} className="text-slate-500" />
               <input 
                 type="number" 
                 placeholder="Min" 
                 className="w-16 bg-transparent py-3 text-[11px] font-black text-white outline-none"
                 onChange={(e) => setFilters(p => ({ ...p, minPrice: e.target.value }))}
               />
               <span className="text-slate-700">—</span>
               <input 
                 type="number" 
                 placeholder="Max" 
                 className="w-16 bg-transparent py-3 text-[11px] font-black text-white outline-none"
                 onChange={(e) => setFilters(p => ({ ...p, maxPrice: e.target.value }))}
               />
            </div>

            <select 
              value={filters.sellerHistory}
              onChange={(e) => setFilters(p => ({ ...p, sellerHistory: e.target.value }))}
              className="bg-slate-800/50 border border-slate-700/50 rounded-2xl px-5 py-3 text-[11px] font-black uppercase text-text-primary outline-none cursor-pointer"
            >
              <option value="ALL">All History</option>
              <option value="HIGH">High Volume</option>
              <option value="MED">Established</option>
              <option value="VERIFIED">Verified Only</option>
            </select>

            <select 
              value={filters.sort}
              onChange={(e) => setFilters(p => ({ ...p, sort: e.target.value }))}
              className="bg-primary text-slate-950 font-black px-6 py-3 rounded-2xl text-[11px] uppercase outline-none cursor-pointer"
            >
              <option value="ops">Sort by OPS Priority</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
         </div>
      </section>

      {/* 📊 TABS: INTELLIGENCE HUB NAVIGATION */}
      <div className="flex items-center gap-6 border-b border-slate-800 pb-4">
         <button 
           onClick={() => setActiveTab('intelligence')}
           className={cn(
             "px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3",
             activeTab === 'intelligence' ? "bg-primary/10 text-primary border border-primary/20 shadow-xl shadow-primary/5" : "text-slate-500 hover:text-white"
           )}
         >
           <Activity size={18} />
           Market Intelligence Feed
         </button>
         <button 
           onClick={() => setActiveTab('my-listings')}
           className={cn(
             "px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3",
             activeTab === 'my-listings' ? "bg-primary/10 text-primary border border-primary/20 shadow-xl shadow-primary/5" : "text-slate-500 hover:text-white"
           )}
         >
           <ShoppingBag size={18} />
           My Imported Listings
         </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'intelligence' ? (
          <motion.div 
            key="market-feed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-12"
          >
            {/* SEARCH RESULTS / TRENDING FEED */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
               {loading && products.length === 0 ? (
                 Array(12).fill(0).map((_, i) => (
                   <div key={i} className="bg-slate-900 h-[450px] rounded-[2.5rem] animate-pulse relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                   </div>
                 ))
               ) : products.length > 0 ? (
                 products.map((p) => (
                   <ProductCard 
                     key={p.id} 
                     product={p} 
                     onOptimize={() => navigate("/optimize/" + p.id, { state: { ebayProduct: p } })} 
                   />
                 ))
               ) : (
                 <div className="col-span-full py-40 flex flex-col items-center justify-center gap-6 opacity-30 italic">
                    <BarChart3 size={64} className="text-slate-500" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Intelligence Matrix Vacant</p>
                 </div>
               )}
            </div>

            {/* PAGINATION */}
            {products.length > 0 && (
               <div className="flex items-center justify-center gap-8 pt-12 border-t border-slate-800">
                  <button 
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                    className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 hover:bg-primary hover:text-slate-950 transition-all shadow-2xl disabled:opacity-20 translate-y-[-2px] active:translate-y-[0px]"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Page Registry</span>
                    <span className="text-2xl font-black text-white">{pagination.page}</span>
                  </div>
                  <button 
                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                    className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 hover:bg-primary hover:text-slate-950 transition-all shadow-2xl translate-y-[-2px] active:translate-y-[0px]"
                  >
                    <ChevronRight size={24} />
                  </button>
               </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="my-listings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
             {/* MY LISTINGS GRID */}
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {!loading && myListings.length > 0 ? (
                  myListings.map((p) => (
                    <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 hover:border-primary/30 transition-all group relative overflow-hidden">
                       <div className="flex items-center justify-between mb-4">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[9px] font-black uppercase">
                            <CheckCircle2 size={12} /> {p.status}
                          </div>
                          <History size={16} className="text-slate-700" />
                       </div>
                       <h3 className="text-[13px] font-bold text-white line-clamp-2 leading-tight mb-4">{p.title}</h3>
                       <div className="flex items-center justify-between mt-auto">
                          <span className="text-lg font-black text-white italic tracking-tighter">${p.price}</span>
                          <button 
                            onClick={() => navigate("/optimize/" + p.id, { state: { ebayProduct: p } })}
                            className="bg-white text-slate-950 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary transition-all"
                          >
                             Revise Node
                          </button>
                       </div>
                    </div>
                  ))
                ) : loading ? (
                  Array(8).fill(0).map((_, i) => <div key={i} className="bg-slate-900 h-40 rounded-[2rem] animate-pulse" />)
                ) : (
                  <div className="col-span-full py-40 flex flex-col items-center justify-center gap-6 opacity-30 italic">
                    <History size={64} className="text-slate-500" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Personal Node Registry Empty</p>
                  </div>
                )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔮 ALWAYS-ON INTELLIGENCE FEED */}
      <section className="bg-slate-950 border border-slate-800 rounded-[3rem] p-12 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -mr-48 -mt-48" />
         
         <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1 space-y-6">
               <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary">
                  <TrendingUp size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">Market Intelligence Broadcast</span>
               </div>
               <h2 className="text-4xl font-black text-white italic tracking-tighter leading-none">Deterministic Winners Feed.</h2>
               <p className="text-slate-400 text-sm font-medium max-w-lg leading-relaxed">
                 Real-time marketplace telemetry analysis identifying high-velocity arbitrage opportunities across 32 unique category nodes.
               </p>
            </div>
            <div className="flex gap-4">
               {[
                 { label: 'Hot Zones', value: '7', icon: Zap },
                 { label: 'High OPS', value: '142', icon: Target },
                 { label: 'Trending', value: '2.4k', icon: Layers }
               ].map((stat, i) => (
                 <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 text-center space-y-2 min-w-[120px]">
                    <stat.icon className="mx-auto text-primary" size={20} />
                    <p className="text-2xl font-black text-white italic tracking-tighter leading-none">{stat.value}</p>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>
    </div>
  );
};

export default MarketResearch;
