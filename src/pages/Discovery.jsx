import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Search, 
  Target,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Shield,
  Layers,
  Box,
  Activity,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Zap,
  Filter,
  X,
  PieChart,
  BarChart3,
  Waves
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import ebayService from '../services/ebay';
import sourcingService from '../services/sourcing';
import ProductCard from '../components/ProductCard';

/**
 * Adaptive Market Research Terminal (v12.0 Responsive)
 * Stage I: Strategic Profit Discovery & AI-Assisted Normalization.
 */
const Discovery = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [rawProducts, setRawProducts] = useState([]);
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

  // 2. CONTEXT ENGINE: AI-Assisted Normalization (Statistical Realism)
  const batchIntelligence = useMemo(() => {
    if (rawProducts.length === 0) return { avgPrice: 50, stdDev: 10, totalResults: 1000 };
    const prices = rawProducts.map(p => p.price);
    const avg = prices.reduce((a, b) => a + b, 0) / rawProducts.length;
    const stdDev = Math.sqrt(prices.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / rawProducts.length) || 10;
    
    return {
      avgPrice: avg,
      stdDev: stdDev,
      totalResults: rawProducts[0]?.totalFound || 1000
    };
  }, [rawProducts]);

  // 3. ADAPTIVE FILTERING & RANKING (Post-Processing)
  const processedProducts = useMemo(() => {
    return rawProducts
      .map(p => ({ 
        ...p, 
        sellData: sourcingService.calculateSellScore(p, batchIntelligence) 
      }))
      .filter(p => {
        const { minScore, demandLevel, profitLevel } = filters;
        if (minScore && p.sellData.score < parseInt(minScore)) return false;
        if (profitLevel && p.sellData.profitLevel !== profitLevel) return false;
        if (demandLevel === 'High' && p.sellData.score < 70) return false;
        return true;
      })
      .sort((a, b) => b.sellData.score - a.sellData.score);
  }, [rawProducts, batchIntelligence, filters]);

  // 4. WINNER DETECTION: Extracting Validated Top Picks
  const topPicks = useMemo(() => {
    return processedProducts.filter(p => p.sellData.isWinner).slice(0, 5);
  }, [processedProducts]);

  // 5. CORE INTELLIGENCE: Market Discovery Execute
  const executeSearch = useCallback(async (isAuto = false) => {
    const cacheKey = btoa(JSON.stringify({ query, categoryId: filters.categoryId, minPrice: filters.minPrice, maxPrice: filters.maxPrice, page: pagination.page }));
    
    if (cacheRegistry.current.has(cacheKey) && !isAuto) {
      setRawProducts(cacheRegistry.current.get(cacheKey));
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
          categoryId: filters.categoryId,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          limit: 20, 
          offset: (pagination.page - 1) * 20
        });
      }

      setRawProducts(results);
      cacheRegistry.current.set(cacheKey, results);
    } catch (err) {
      setError("Market intelligence offline - check marketplace link.");
    } finally {
      setLoading(false);
    }
  }, [query, filters.categoryId, filters.minPrice, filters.maxPrice, pagination.page]);

  useEffect(() => {
    const timer = setTimeout(() => executeSearch(), 450);
    return () => clearTimeout(timer);
  }, [filters.categoryId, filters.minPrice, filters.maxPrice, query, pagination.page]);

  useEffect(() => { executeSearch(true); }, []);

  const handleAddProduct = (product) => {
    navigate(`/intelligence-review/${product.id}`, { state: { product, batchContext: batchIntelligence } });
  };

  return (
    <div className="space-y-16 animate-in fade-in duration-700 pb-40 w-full max-w-full">
      
      {/* 🚀 STAGE I: TOP PICKS (Rule 2 Compliance: Dynamic Grid) */}
      {topPicks.length > 0 && !loading && (
        <section className="space-y-10">
           <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-8">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-[var(--primary-500)]/10 border border-[var(--primary-500)]/20 rounded-[1.5rem] flex items-center justify-center text-[var(--primary-500)] shadow-2xl shadow-[var(--primary-500)]/5">
                    <Zap size={32} />
                 </div>
                 <div>
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-[var(--text-primary)]">Momentum.</h2>
                    <p className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-widest mt-2 flex items-center gap-2">
                       <Sparkles size={14} className="text-[var(--success)]" /> AI-Assisted Normalization Engine
                    </p>
                 </div>
              </div>
           </div>

           <div className="dynamic-grid">
              {topPicks.map(p => (
                <ProductCard key={p.id} product={p} onAdd={handleAddProduct} batchContext={batchIntelligence} isCompact={true} />
              ))}
           </div>
        </section>
      )}

      {/* 📊 STAGE II: RESEARCH TERMINAL */}
      <div className="space-y-12">
         <div className="flex flex-col gap-6 w-full">
            <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[3rem] p-5 pl-12 shadow-3xl flex flex-col md:flex-row items-center gap-10 relative overflow-hidden w-full">
               <div className="flex-1 flex items-center gap-6 w-full">
                  <Search className="text-[var(--text-secondary)]" size={24} />
                  <input 
                    type="text" 
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setPagination({ page: 1 }); }}
                    placeholder="Analyze Marketplace Opportunities..."
                    className="flex-1 bg-transparent py-4 text-sm font-black text-[var(--text-primary)] outline-none placeholder:text-slate-600 w-full"
                  />
               </div>

               <div className="flex items-center gap-6 px-10 relative z-30 w-full md:w-auto justify-end">
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                        "flex items-center gap-3 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border shadow-lg",
                        showFilters ? "bg-white text-black border-white" : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <Filter size={16} /> Filter Suite
                  </button>
                  <div className="h-12 w-px bg-[var(--border-color)] hidden md:block" />
                  <div className="flex flex-col text-right hidden lg:flex">
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Active Batch</span>
                     <span className="text-[12px] font-black text-[var(--success)] italic tracking-tighter uppercase">High Density</span>
                  </div>
               </div>
            </section>

            {/* HIGH-CONTRAST FILTER PANEL (Rule 1 & 2 Compliance) */}
            <AnimatePresence>
               {showFilters && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0, scaleY: 0.9 }}
                    animate={{ height: 'auto', opacity: 1, scaleY: 1 }}
                    exit={{ height: 0, opacity: 0, scaleY: 0.9 }}
                    className="z-50 w-full overflow-hidden origin-top"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 p-12 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
                       <div className="space-y-4">
                          <label className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] px-2 flex items-center gap-3"><Waves size={14} /> Segment</label>
                          <select 
                            value={filters.categoryId}
                            onChange={(e) => setFilters(p => ({ ...p, categoryId: e.target.value }))}
                            className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl px-6 py-5 text-[12px] font-black text-[var(--text-primary)] outline-none cursor-pointer hover:border-[var(--primary-500)] transition-all appearance-none shadow-2xl"
                          >
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                       </div>
                       
                       <div className="space-y-4">
                          <label className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] px-2 flex items-center gap-3"><DollarSign size={14} /> Price Range</label>
                          <div className="flex items-center gap-4">
                             <input 
                               type="number" 
                               placeholder="Min"
                               value={filters.minPrice}
                               onChange={(e) => setFilters(p => ({ ...p, minPrice: e.target.value }))}
                               className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl px-6 py-5 text-[12px] font-black text-[var(--text-primary)] outline-none placeholder:text-slate-700 shadow-2xl"
                             />
                             <input 
                               type="number" 
                               placeholder="Max"
                               value={filters.maxPrice}
                               onChange={(e) => setFilters(p => ({ ...p, maxPrice: e.target.value }))}
                               className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl px-6 py-5 text-[12px] font-black text-[var(--text-primary)] outline-none placeholder:text-slate-700 shadow-2xl"
                             />
                          </div>
                       </div>

                       <div className="space-y-4">
                          <label className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] px-2 flex items-center gap-3"><BarChart3 size={14} /> Sell Ranking</label>
                          <select 
                            value={filters.minScore}
                            onChange={(e) => setFilters(p => ({ ...p, minScore: e.target.value }))}
                            className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl px-6 py-5 text-[12px] font-black text-[var(--text-primary)] outline-none appearance-none"
                          >
                            <option value="">Any Confidence</option>
                            <option value="80">Top Rated (80+)</option>
                            <option value="60">Growth (60+)</option>
                          </select>
                       </div>

                       <div className="space-y-4">
                          <label className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] px-2 flex items-center gap-3"><TrendingUp size={14} /> Yield Tier</label>
                          <select 
                            value={filters.profitLevel}
                            onChange={(e) => setFilters(p => ({ ...p, profitLevel: e.target.value }))}
                            className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl px-6 py-5 text-[12px] font-black text-[var(--text-primary)] outline-none appearance-none"
                          >
                            <option value="">All Margins</option>
                            <option value="High">High Yield</option>
                            <option value="Medium">Standard</option>
                          </select>
                       </div>

                       <div className="flex flex-col gap-4 justify-end">
                          <button 
                            onClick={() => setFilters({ categoryId: '', minPrice: '', maxPrice: '', minScore: '', demandLevel: '', profitLevel: '', sort: 'money' })}
                            className="w-full px-8 py-5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl text-[11px] font-black text-[var(--text-secondary)] hover:text-white transition-all uppercase tracking-widest"
                          >
                            Reset Logic
                          </button>
                       </div>
                    </div>
                  </motion.div>
               )}
            </AnimatePresence>
         </div>

         {/* 🌊 MARKET FEED HEADER */}
         <div className="flex items-center justify-between px-6">
            <h3 className="text-[12px] font-black text-[var(--text-secondary)] uppercase tracking-[0.4em]">Full Market Analysis Feed</h3>
            <div className="flex items-center gap-4">
               <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest hidden sm:inline">Data Normalized Relative to Batch</span>
               <div className="w-2.5 h-2.5 rounded-full bg-[var(--success)] shadow-[0_0_15px_var(--success)]" />
            </div>
         </div>

         <div className="dynamic-grid pt-4">
            {loading ? (
              Array(8).fill(0).map((_, i) => (
                <div key={i} className="h-64 bg-[var(--bg-card)] rounded-[3rem] animate-pulse border border-[var(--border-color)]" />
              ))
            ) : processedProducts.length > 0 ? (
              processedProducts.map(p => <ProductCard key={p.id} product={p} onAdd={handleAddProduct} batchContext={batchIntelligence} />)
            ) : (
              <div className="py-72 flex flex-col items-center justify-center gap-10 opacity-20 col-span-full">
                 <Waves size={100} className="text-[var(--text-secondary)]" />
                 <p className="text-[16px] font-black uppercase tracking-[1em] text-center">Neural Null Response</p>
              </div>
            )}
         </div>

         {/* PAGINATION LOGIC (Rule 2 Compliance) */}
         {!loading && rawProducts.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-16 pt-32 border-t border-[var(--border-color)]">
               <button 
                 disabled={pagination.page === 1}
                 onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                 className="flex items-center gap-5 px-12 py-6 rounded-3xl border border-[var(--border-color)] text-[11px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-white disabled:opacity-10 transition-all bg-[var(--bg-card)] shadow-2xl"
               >
                 <ChevronLeft size={24} /> Previous Segment
               </button>
               
               <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-[var(--text-primary)] text-[var(--bg-app)] flex items-center justify-center font-black italic text-2xl shadow-3xl">
                     {pagination.page}
                  </div>
                  <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Discovery Phase</span>
               </div>

               <button 
                 onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                 className="flex items-center gap-5 px-14 py-6 rounded-3xl border border-[var(--border-color)] text-[11px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-white transition-all bg-[var(--bg-card)] shadow-2xl"
               >
                 Next Signal <ChevronRight size={24} />
               </button>
            </div>
         )}
      </div>
    </div>
  );
};

export default Discovery;
