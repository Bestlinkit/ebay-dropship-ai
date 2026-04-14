import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Search, 
  Target,
  ChevronRight,
  ChevronLeft,
  ShoppingBag,
  ExternalLink,
  Shield,
  Layers,
  RefreshCw,
  Box,
  Activity,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Zap,
  Layout,
  BarChart3,
  Filter,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import ebayService from '../services/ebay';
import sourcingService from '../services/sourcing';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';

/**
 * AI-Powered eBay Market Research Terminal (v10.0)
 * Stage I: Strategic Profit Discovery & Real-Time Intelligence.
 */
const Discovery = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    categoryId: '',
    minPrice: '',
    maxPrice: '',
    minScore: '',
    demandLevel: '',
    profitLevel: '',
    sort: 'money'
  });
  
  const [pagination, setPagination] = useState({ page: 1 });
  const [error, setError] = useState(null);
  
  const cacheRegistry = useRef(new Map());
  const navigate = useNavigate();

  // 1. DATA PULSE: Retrieve Categorization
  useEffect(() => {
    ebayService.getCategorySuggestions('top').then(setCategories);
  }, []);

  // 2. CONTEXT ENGINE: Calculate Batch Statistics for Real Intelligence
  const batchContext = useMemo(() => {
    if (products.length === 0) return { avgPrice: 50, totalResults: 1000 };
    const prices = products.map(p => p.price);
    return {
      avgPrice: (prices.reduce((a, b) => a + b, 0) / products.length) || 50,
      totalResults: products[0]?.totalFound || 1000
    };
  }, [products]);

  // 3. WINNER DETECTION: Extracting Validated Top Picks
  const topPicks = useMemo(() => {
    return products
      .map(p => ({ ...p, sellData: sourcingService.calculateSellScore(p, batchContext) }))
      .filter(p => p.sellData.isWinner)
      .slice(0, 10);
  }, [products, batchContext]);

  // 4. CORE INTELLIGENCE: Market Discovery Execute
  const executeSearch = useCallback(async (isAuto = false) => {
    const cacheKey = btoa(JSON.stringify({ query, ...filters, page: pagination.page }));
    
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
          limit: 15,
          offset: (pagination.page - 1) * 15
        });
      }

      // Context-Aware Ranking (Deterministic)
      const currentAvg = results.length > 0 ? (results.reduce((a,b) => a+b.price, 0) / results.length) : 50;
      const tmpContext = { avgPrice: currentAvg, totalResults: results[0]?.totalFound || 1000 };

      const ranked = results.sort((a, b) => {
         const scoreA = sourcingService.calculateSellScore(a, tmpContext).score;
         const scoreB = sourcingService.calculateSellScore(b, tmpContext).score;
         return scoreB - scoreA;
      });

      setProducts(ranked);
      cacheRegistry.current.set(cacheKey, ranked);
    } catch (err) {
      setError("Market intelligence offline - check marketplace link.");
    } finally {
      setLoading(false);
    }
  }, [query, filters, pagination.page]);

  // Reactive Debounce
  useEffect(() => {
    const timer = setTimeout(() => executeSearch(), 450);
    return () => clearTimeout(timer);
  }, [filters, query, pagination.page]);

  // Init
  useEffect(() => { executeSearch(true); }, []);

  const handleAddProduct = (product) => {
    navigate(`/intelligence-review/${product.id}`, { state: { product, batchContext } });
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-40 max-w-[1700px] mx-auto px-6 font-inter text-text-primary">
      
      {/* 🚀 STAGE I: TOP PICKS FOR FAST SALES */}
      {topPicks.length > 0 && !loading && (
        <section className="space-y-8">
           <div className="flex items-center justify-between border-b border-slate-800 pb-6">
              <div className="flex items-center gap-5">
                 <div className="w-14 h-14 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center justify-center text-green-500 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                    <Zap size={28} />
                 </div>
                 <div>
                    <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Market Leaders.</h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                       <Sparkles size={12} className="text-green-500" /> High-Confidence Arbitrage Signals
                    </p>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topPicks.map(p => (
                <div key={p.id} className="relative group">
                   <ProductCard product={p} onAdd={handleAddProduct} batchContext={batchContext} />
                   <div className="absolute inset-0 pointer-events-none border-2 border-green-500/10 rounded-[2rem] group-hover:border-green-500/30 transition-colors" />
                </div>
              ))}
           </div>
        </section>
      )}

      {/* 📊 STAGE II: RESEARCH TERMINAL */}
      <div className="space-y-10">
         <div className="flex flex-col gap-4">
            <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-4 pl-10 shadow-2xl flex items-center gap-8 relative overflow-hidden">
               <Search className="text-slate-600" size={20} />
               <input 
                 type="text" 
                 value={query}
                 onChange={(e) => { setQuery(e.target.value); setPagination({ page: 1 }); }}
                 placeholder="Analyze Marketplace Opportunities..."
                 className="flex-1 bg-transparent py-4 text-sm font-bold text-white outline-none placeholder:text-slate-700"
               />

               <div className="flex items-center gap-4 px-6">
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        showFilters ? "bg-white text-slate-950" : "bg-slate-800 text-slate-400 hover:text-white"
                    )}
                  >
                    <Filter size={14} /> Filters
                  </button>
                  <div className="h-10 w-px bg-slate-800" />
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">
                     Ready for Analysis
                  </div>
               </div>
            </section>

            {/* EXPANDABLE FILTER STRIP */}
            <AnimatePresence>
               {showFilters && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-8 bg-slate-900/50 border border-slate-800/50 rounded-[2rem]">
                       <div className="space-y-2">
                          <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-2">Market Path</label>
                          <select 
                            value={filters.categoryId}
                            onChange={(e) => setFilters(p => ({ ...p, categoryId: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-[10px] font-black text-white outline-none appearance-none cursor-pointer"
                          >
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                       </div>
                       
                       <div className="space-y-2">
                          <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-2">Yield Range</label>
                          <div className="flex items-center gap-2">
                             <input 
                               type="number" 
                               placeholder="Min"
                               value={filters.minPrice}
                               onChange={(e) => setFilters(p => ({ ...p, minPrice: e.target.value }))}
                               className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-[10px] font-black text-white outline-none placeholder:text-slate-800"
                             />
                             <input 
                               type="number" 
                               placeholder="Max"
                               value={filters.maxPrice}
                               onChange={(e) => setFilters(p => ({ ...p, maxPrice: e.target.value }))}
                               className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-[10px] font-black text-white outline-none placeholder:text-slate-800"
                             />
                          </div>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-2">Sell Score</label>
                          <select 
                            value={filters.minScore}
                            onChange={(e) => setFilters(p => ({ ...p, minScore: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-[10px] font-black text-white outline-none"
                          >
                            <option value="">Any Score</option>
                            <option value="80">Top Picks (80+)</option>
                            <option value="50">Opportunities (50+)</option>
                          </select>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-2">Demand Pulse</label>
                          <select 
                            value={filters.demandLevel}
                            onChange={(e) => setFilters(p => ({ ...p, demandLevel: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-[10px] font-black text-white outline-none"
                          >
                            <option value="">All Density</option>
                            <option value="High">High Velocity</option>
                            <option value="Medium">Stable</option>
                          </select>
                       </div>

                       <button 
                         onClick={() => setFilters({ categoryId: '', minPrice: '', maxPrice: '', minScore: '', demandLevel: '', profitLevel: '', sort: 'money' })}
                         className="lg:col-start-6 self-end px-6 py-3 border border-slate-800 rounded-xl text-[9px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
                       >
                         Reset
                       </button>
                    </div>
                  </motion.div>
               )}
            </AnimatePresence>
         </div>

         <div className="grid grid-cols-1 gap-4">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-32 bg-slate-900/50 rounded-[2.5rem] animate-pulse border border-slate-800" />
              ))
            ) : products.length > 0 ? (
              products.map(p => <ProductCard key={p.id} product={p} onAdd={handleAddProduct} batchContext={batchContext} />)
            ) : (
              <div className="py-48 flex flex-col items-center justify-center gap-6 opacity-20">
                 <BarChart3 size={64} className="text-slate-500" />
                 <p className="text-[11px] font-black uppercase tracking-[0.5em]">Market Analysis Registry Empty</p>
              </div>
            )}
         </div>

         {!loading && products.length > 0 && (
            <div className="flex items-center justify-center gap-12 pt-16 border-t border-slate-800/50">
               <button 
                 disabled={pagination.page === 1}
                 onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                 className="flex items-center gap-3 px-8 py-4 rounded-2xl border border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white disabled:opacity-20 transition-all"
               >
                 <ChevronLeft size={16} /> Previous
               </button>
               
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white text-slate-950 flex items-center justify-center font-black italic text-lg shadow-xl shadow-white/5">
                     {pagination.page}
                  </div>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Page</span>
               </div>

               <button 
                 onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                 className="flex items-center gap-3 px-8 py-4 rounded-2xl border border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all"
               >
                 Next <ChevronRight size={16} />
               </button>
            </div>
         )}
      </div>
    </div>
  );
};

export default Discovery;
