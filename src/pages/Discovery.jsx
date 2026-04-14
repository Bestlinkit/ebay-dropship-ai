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
 * Adaptive Market Research Terminal (v11.0)
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
        // Demand Level mapping (High = High Velocity, Med = Stable)
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
          limit: 20, // Fetch more for better normalization
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

  // Reactive Debounce
  useEffect(() => {
    const timer = setTimeout(() => executeSearch(), 450);
    return () => clearTimeout(timer);
  }, [filters.categoryId, filters.minPrice, filters.maxPrice, query, pagination.page]);

  // Init
  useEffect(() => { executeSearch(true); }, []);

  const handleAddProduct = (product) => {
    navigate(`/intelligence-review/${product.id}`, { state: { product, batchContext: batchIntelligence } });
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-40 max-w-[1700px] mx-auto px-6 font-inter text-text-primary">
      
      {/* 🚀 STAGE I: TOP PICKS (RANKED BY RELEVANCE) */}
      {topPicks.length > 0 && !loading && (
        <section className="space-y-8">
           <div className="flex items-center justify-between border-b border-slate-800 pb-6">
              <div className="flex items-center gap-5">
                 <div className="w-14 h-14 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center justify-center text-green-500 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                    <Zap size={28} />
                 </div>
                 <div>
                    <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Market Momentum.</h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                       <Sparkles size={12} className="text-green-500" /> AI-Assisted Normalization (Query Batch)
                    </p>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {topPicks.map(p => (
                <ProductCard key={p.id} product={p} onAdd={handleAddProduct} batchContext={batchIntelligence} isCompact={true} />
              ))}
           </div>
        </section>
      )}

      {/* 📊 STAGE II: RESEARCH TERMINAL */}
      <div className="space-y-10">
         <div className="flex flex-col gap-4">
            <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-4 pl-10 shadow-2xl flex items-center gap-8 relative overflow-hidden">
               <div className="flex-1 flex items-center gap-6">
                  <Search className="text-slate-600" size={20} />
                  <input 
                    type="text" 
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setPagination({ page: 1 }); }}
                    placeholder="Analyze Marketplace Opportunities..."
                    className="flex-1 bg-transparent py-4 text-sm font-bold text-white outline-none placeholder:text-slate-700"
                  />
               </div>

               <div className="flex items-center gap-4 px-6 relative z-30">
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                        showFilters ? "bg-white text-slate-950 border-white" : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                    )}
                  >
                    <Filter size={14} /> Intelligence Filter
                  </button>
                  <div className="h-10 w-px bg-slate-800" />
                  <div className="flex flex-col text-right">
                     <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Live Density</span>
                     <span className="text-[11px] font-black text-emerald-500 italic">Adaptive Stream</span>
                  </div>
               </div>
            </section>

            {/* HIGH-CONTRAST FILTER STRIP (ADAPTIVE UI) */}
            <AnimatePresence>
               {showFilters && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0, y: -20 }}
                    animate={{ height: 'auto', opacity: 1, y: 0 }}
                    exit={{ height: 0, opacity: 0, y: -20 }}
                    className="z-50"
                  >
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 p-10 bg-[#111C33] border border-[#2A3A55] rounded-[3rem] shadow-3xl">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 flex items-center gap-2"><Waves size={12} /> Category</label>
                          <select 
                            value={filters.categoryId}
                            onChange={(e) => setFilters(p => ({ ...p, categoryId: e.target.value }))}
                            className="w-full bg-[#1A2742] border border-[#2A3A55] rounded-2xl px-5 py-4 text-[11px] font-black text-[#EAF0FF] outline-none cursor-pointer hover:bg-[#1f2e4d] transition-colors appearance-none shadow-inner"
                          >
                            <option value="">All Segments</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                       </div>
                       
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 flex items-center gap-2"><DollarSign size={12} /> Price Ceiling</label>
                          <div className="flex items-center gap-3">
                             <input 
                               type="number" 
                               placeholder="Min"
                               value={filters.minPrice}
                               onChange={(e) => setFilters(p => ({ ...p, minPrice: e.target.value }))}
                               className="w-full bg-[#1A2742] border border-[#2A3A55] rounded-2xl px-5 py-4 text-[11px] font-black text-[#EAF0FF] outline-none placeholder:text-slate-800 shadow-inner"
                             />
                             <input 
                               type="number" 
                               placeholder="Max"
                               value={filters.maxPrice}
                               onChange={(e) => setFilters(p => ({ ...p, maxPrice: e.target.value }))}
                               className="w-full bg-[#1A2742] border border-[#2A3A55] rounded-2xl px-5 py-4 text-[11px] font-black text-[#EAF0FF] outline-none placeholder:text-slate-800 shadow-inner"
                             />
                          </div>
                       </div>

                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 flex items-center gap-2"><BarChart3 size={12} /> Sell Score</label>
                          <select 
                            value={filters.minScore}
                            onChange={(e) => setFilters(p => ({ ...p, minScore: e.target.value }))}
                            className="w-full bg-[#1A2742] border border-[#2A3A55] rounded-2xl px-5 py-4 text-[11px] font-black text-[#EAF0FF] outline-none appearance-none"
                          >
                            <option value="">Any Confidence</option>
                            <option value="80">Top Rated (80+)</option>
                            <option value="60">Growth (60+)</option>
                          </select>
                       </div>

                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 flex items-center gap-2"><TrendingUp size={12} /> Profit Potential</label>
                          <select 
                            value={filters.profitLevel}
                            onChange={(e) => setFilters(p => ({ ...p, profitLevel: e.target.value }))}
                            className="w-full bg-[#1A2742] border border-[#2A3A55] rounded-2xl px-5 py-4 text-[11px] font-black text-[#EAF0FF] outline-none appearance-none"
                          >
                            <option value="">All Marigins</option>
                            <option value="High">High Yield</option>
                            <option value="Medium">Stable</option>
                          </select>
                       </div>

                       <div className="flex flex-col gap-3 justify-end pb-1">
                          <button 
                            onClick={() => setFilters({ categoryId: '', minPrice: '', maxPrice: '', minScore: '', demandLevel: '', profitLevel: '', sort: 'money' })}
                            className="w-full px-6 py-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-2xl text-[10px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest"
                          >
                            Reset Logic
                          </button>
                          <button 
                            onClick={() => setShowFilters(false)}
                            className="w-full px-8 py-4 bg-white text-slate-950 font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-white/5 hover:scale-[1.02] transition-transform"
                          >
                            Apply Intelligence
                          </button>
                       </div>
                    </div>
                  </motion.div>
               )}
            </AnimatePresence>
         </div>

         {/* 🌊 MARKET FEED HEADER */}
         <div className="flex items-center justify-between px-2 pt-4">
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Full Market Analysis Feed</h3>
            <div className="flex items-center gap-3">
               <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Confidence Normalized Per Query</span>
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
            </div>
         </div>

         <div className="grid grid-cols-1 gap-6 pt-4">
            {loading ? (
              Array(8).fill(0).map((_, i) => (
                <div key={i} className="h-36 bg-slate-900/50 rounded-[3rem] animate-pulse border border-slate-800/30" />
              ))
            ) : processedProducts.length > 0 ? (
              processedProducts.map(p => <ProductCard key={p.id} product={p} onAdd={handleAddProduct} batchContext={batchIntelligence} />)
            ) : (
              <div className="col-span-full py-56 flex flex-col items-center justify-center gap-8 opacity-10">
                 <Waves size={80} className="text-slate-400" />
                 <p className="text-[14px] font-black uppercase tracking-[0.8em] text-center">Zero Market Alignment Detected</p>
              </div>
            )}
         </div>

         {/* PAGINATION LOGIC */}
         {!loading && rawProducts.length > 0 && (
            <div className="flex items-center justify-center gap-16 pt-24 border-t border-slate-800/30">
               <button 
                 disabled={pagination.page === 1}
                 onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                 className="flex items-center gap-4 px-10 py-5 rounded-[2rem] border border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white disabled:opacity-10 transition-all font-outfit"
               >
                 <ChevronLeft size={20} /> Previous Phase
               </button>
               
               <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-2xl bg-[#EAF0FF] text-slate-950 flex items-center justify-center font-black italic text-xl shadow-2xl shadow-blue-500/10">
                     {pagination.page}
                  </div>
                  <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Terminal View</span>
               </div>

               <button 
                 onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                 className="flex items-center gap-4 px-12 py-5 rounded-[2rem] border border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all font-outfit"
               >
                 Next Discovery <ChevronRight size={20} />
               </button>
            </div>
         )}
      </div>
    </div>
  );
};

export default Discovery;
