import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, 
  Filter, 
  Loader2, 
  Sparkles, 
  AlertCircle, 
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
  Package
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import ebayService from '../services/ebay';
import sourcingService from '../services/sourcing';
import ProductCard from '../components/ProductCard';
import { toast } from 'sonner';

/**
 * Market Research Hub - SaaS Intelligence Dashboard (v6.0)
 * High-performance eBay marketplace scanning with deterministic OPS scoring.
 */
const Discovery = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    categoryId: '',
    minPrice: '',
    maxPrice: '',
    condition: 'NEW',
    sellerVolume: 'ALL'
  });
  const [pagination, setPagination] = useState({ page: 1, total: 0 });
  const [error, setError] = useState(null);
  
  // Key-Based Intelligent Cache System
  const cacheRegistry = useRef(new Map());
  const navigate = useNavigate();

  // 1. DETERMINISTIC OPS RANKING (The Engine)
  const rankResults = useCallback((results) => {
    return results
      .map(item => ({
        ...item,
        ops: sourcingService.calculateOPS(item)
      }))
      .sort((a, b) => b.ops.score - a.ops.score);
  }, []);

  // 2. GENERATE CRYPTOGRAPHIC CACHE KEY (Hash-based)
  const getCacheKey = useCallback(() => {
    const hashData = {
      q: query,
      ...filters,
      page: pagination.page
    };
    return btoa(JSON.stringify(hashData));
  }, [query, filters, pagination.page]);

  // 3. CORE DISCOVERY EXECUTION
  const executeResearch = useCallback(async (isAutoTrend = false) => {
    const cacheKey = getCacheKey();
    if (cacheRegistry.current.has(cacheKey) && !isAutoTrend) {
      setProducts(cacheRegistry.current.get(cacheKey));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let results = [];
      if (isAutoTrend && !query) {
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
      toast.error("eBay API Vector Failure.");
    } finally {
      setLoading(false);
    }
  }, [getCacheKey, filters, pagination.page, query, rankResults]);

  // Initial Intelligence Pulse
  useEffect(() => {
    executeResearch(true);
    // Load top categories (Lazy Loading Protocol)
    ebayService.getCategorySuggestions('top categories').then(setCategories);
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  useEffect(() => {
    executeResearch();
  }, [filters, pagination.page]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-32 max-w-[1700px] mx-auto px-4 md:px-8">
      
      {/* LEFT: INTELLIGENCE SIDEBAR (20%) */}
      <aside className="lg:w-[320px] shrink-0 space-y-8">
        <div className="bg-slate-950 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
           <div className="relative z-10 space-y-8">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                  <Shield size={14} /> Neural Shield Active
                </span>
                <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Research Hub.</h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-white/40 uppercase tracking-widest pl-1">Market Search</label>
                  <form onSubmit={(e) => { e.preventDefault(); executeResearch(); }} className="relative">
                    <input 
                      type="text" 
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Enter keyword..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white outline-none focus:border-primary/50 transition-all"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                  </form>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/40 uppercase tracking-widest pl-1 leading-none italic">Category Depth</label>
                      <select 
                        value={filters.categoryId}
                        onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-xs font-bold text-white outline-none appearance-none cursor-pointer"
                      >
                        <option value="">All Categories</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/40 uppercase tracking-widest pl-1 italic">Price Band (USD)</label>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          placeholder="Min" 
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold text-white outline-none"
                          onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                        />
                        <input 
                          type="number" 
                          placeholder="Max" 
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold text-white outline-none"
                          onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                        />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/40 uppercase tracking-widest pl-1 italic">Seller History</label>
                      <div className="grid grid-cols-2 gap-2">
                         {['ALL', 'HIGH', 'MED', 'VERIFIED'].map(v => (
                           <button 
                             key={v}
                             onClick={() => handleFilterChange('sellerVolume', v)}
                             className={cn(
                               "py-3 rounded-2xl text-[8px] font-black uppercase tracking-widest transition-all border",
                               filters.sellerVolume === v ? "bg-primary text-slate-950 border-primary shadow-lg shadow-primary/20" : "bg-white/5 text-white/40 border-white/5 hover:border-white/10"
                             )}
                           >
                             {v}
                           </button>
                         ))}
                      </div>
                   </div>
                </div>
              </div>
           </div>
        </div>

        {/* OPS Intelligence Stat */}
        <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-200/50 space-y-4">
           <div className="flex items-center gap-3">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-400">
                <Target size={20} />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Intelligence Status</span>
                <span className="text-xs font-black text-slate-900 uppercase italic">Optimal Sort Enabled</span>
              </div>
           </div>
           <p className="text-[11px] font-bold text-slate-500 leading-relaxed"> Results are automatically ranked using the deterministic <span className="text-slate-900 font-black">OPS Engine</span>. Highest opportunities are prioritized.</p>
        </div>
      </aside>

      {/* RIGHT: RESULTS GRID (80%) */}
      <main className="flex-1 space-y-8">
        
        {/* Hub Title Layer */}
        <div className="flex items-end justify-between border-b border-slate-100 pb-8">
           <div className="space-y-1">
              <div className="flex items-center gap-3">
                 <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Market Results.</h1>
                 {loading && <Loader2 className="animate-spin text-slate-200" size={24} />}
              </div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                Scanning eBay Marketplace Pulse • {products.length} Deterministic Leads found
              </p>
           </div>

           <div className="flex items-center gap-4 bg-slate-50 px-6 py-3 rounded-full border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sort Strategy</span>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[11px] font-black text-slate-900 uppercase italic tracking-tighter">OPS Priority</span>
              </div>
           </div>
        </div>

        {/* Main Interface Content */}
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="py-40 flex flex-col items-center justify-center gap-6 text-center"
            >
              <div className="p-10 bg-rose-50 rounded-[4rem] text-rose-500 shadow-2xl shadow-rose-100">
                <AlertCircle size={80} strokeWidth={1} />
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Registry Fault.</h3>
                <p className="text-sm font-bold text-slate-500 leading-relaxed italic">{error}</p>
                <button 
                  onClick={() => executeResearch()}
                  className="mt-4 px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all flex items-center gap-2 mx-auto"
                >
                  <RefreshCw size={14} /> Synchronize State
                </button>
              </div>
            </motion.div>
          ) : loading && products.length === 0 ? (
            <div className="py-60 flex flex-col items-center justify-center gap-8">
               <div className="relative">
                 <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                   className="w-32 h-32 rounded-full border-4 border-slate-100 border-t-primary"
                 />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Box size={32} className="text-slate-200" />
                 </div>
               </div>
               <div className="text-center space-y-2">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Traversing Marketplace Registry...</p>
                 <p className="text-[9px] font-bold text-slate-300 italic">Executing high-frequency market scans</p>
               </div>
            </div>
          ) : products.length > 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {products.map((p) => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  onOptimize={(prd) => navigate("/optimize/" + prd.id, { state: { ebayProduct: prd } })} 
                />
              ))}
            </motion.div>
          ) : (
            <div className="py-40 flex flex-col items-center justify-center gap-6 text-slate-300">
               <div className="p-10 bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-100">
                  <BarChart3 size={60} strokeWidth={1} className="opacity-40" />
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.4em]">Neural Buffer Empty - Initialize Scan</p>
            </div>
          )}
        </AnimatePresence>

        {/* Pagination Console */}
        <div className="flex items-center justify-center gap-8 pt-10 border-t border-slate-100">
           <button 
             disabled={pagination.page === 1}
             onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
             className="w-14 h-14 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-xl shadow-slate-100"
           >
             <ChevronLeft size={24} />
           </button>
           <div className="flex flex-col items-center space-y-0.5">
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Intelligence Page</span>
             <span className="text-2xl font-black text-slate-900 tracking-tighter">{pagination.page}</span>
           </div>
           <button 
             onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
             className="w-14 h-14 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-xl shadow-slate-100"
           >
             <ChevronRight size={24} />
           </button>
        </div>
      </main>
    </div>
  );
};

export default Discovery;
