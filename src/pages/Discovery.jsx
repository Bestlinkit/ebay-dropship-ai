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
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import ebayService from '../services/ebay';
import sourcingService from '../services/sourcing';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';

/**
 * AI-Powered eBay Profit Decision Engine (v9.5)
 * Money-First Workflow: Top Picks Hero + Revenue-Centric Discovery Terminal.
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
    sort: 'money' // Default to Money-First Sorting
  });
  
  const [pagination, setPagination] = useState({ page: 1 });
  const [error, setError] = useState(null);
  
  const cacheRegistry = useRef(new Map());
  const navigate = useNavigate();

  // 1. DATA PULSE: Retrieve Categorization
  useEffect(() => {
    ebayService.getCategorySuggestions('top').then(setCategories);
  }, []);

  // 2. MONEY-FIRST ENGINE: Extracting Top Picks
  const topPicks = useMemo(() => {
    return products
      .map(p => ({ ...p, sellData: sourcingService.calculateSellScore(p) }))
      .filter(p => p.sellData.status === 'TOP PICK')
      .slice(0, 10);
  }, [products]);

  // 3. CORE INTELLIGENCE: Market Discovery 执行
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
          limit: 12,
          offset: (pagination.page - 1) * 12
        });
      }

      // Money-First Baseline Sorting
      const ranked = results.sort((a, b) => {
         const scoreA = sourcingService.calculateSellScore(a).score;
         const scoreB = sourcingService.calculateSellScore(b).score;
         return scoreB - scoreA;
      });

      setProducts(ranked);
      cacheRegistry.current.set(cacheKey, ranked);
    } catch (err) {
      setError("Intelligence registry timeout - check marketplace connectivity.");
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
    // Navigate to Intelligence Review (Stage II)
    navigate(`/intelligence-review/${product.id}`, { state: { product } });
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-32 max-w-[1700px] mx-auto px-6 font-inter">
      
      {/* 🚀 STAGE I: TOP PICKS FOR FAST SALES */}
      {topPicks.length > 0 && !loading && (
        <section className="space-y-6">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center text-green-500">
                    <Zap size={24} />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Top Picks for Fast Sales.</h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                       <Sparkles size={12} className="text-green-500" /> Revenue-Prioritized Selection Nodes
                    </p>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topPicks.map(p => (
                <div key={p.id} className="relative">
                   <ProductCard product={p} onAdd={handleAddProduct} />
                   <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-2 border-green-500/10 rounded-[2rem]" />
                </div>
              ))}
           </div>
           <div className="h-px bg-slate-800/50 w-full" />
        </section>
      )}

      {/* 📊 STAGE II: INTELLIGENCE DISCOVERY TERMINAL */}
      <div className="space-y-10">
         <section className="bg-slate-900 border border-slate-800 rounded-[2rem] p-3 pl-8 shadow-2xl flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-4 flex-1 min-w-[300px]">
               <Search className="text-slate-600" size={18} />
               <input 
                 type="text" 
                 value={query}
                 onChange={(e) => { setQuery(e.target.value); setPagination({ page: 1 }); }}
                 placeholder="Search Marketplace Intelligence..."
                 className="w-full bg-transparent py-4 text-xs font-bold text-text-primary outline-none placeholder:text-slate-700"
               />
            </div>

            <div className="flex flex-wrap items-center gap-4">
               <select 
                 value={filters.categoryId}
                 onChange={(e) => setFilters(p => ({ ...p, categoryId: e.target.value }))}
                 className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-5 py-3 text-[10px] font-black uppercase text-text-muted outline-none cursor-pointer"
               >
                 <option value="">Categories</option>
                 {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>

               <div className="bg-primary text-slate-950 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <DollarSign size={14} /> Money-First Priority
               </div>
            </div>
         </section>

         <div className="grid grid-cols-1 gap-4">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-32 bg-slate-900/50 rounded-[2rem] animate-pulse border border-slate-800" />
              ))
            ) : products.length > 0 ? (
              products.map(p => <ProductCard key={p.id} product={p} onAdd={handleAddProduct} />)
            ) : (
              <div className="py-40 flex flex-col items-center justify-center gap-6 opacity-20">
                 <BarChart3 size={64} className="text-slate-500" />
                 <p className="text-[11px] font-black uppercase tracking-[0.4em]">Registry Buffer Buffer Empty</p>
              </div>
            )}
         </div>

         {!loading && products.length > 0 && (
            <div className="flex items-center justify-center gap-10 pt-16 border-t border-slate-800/50">
               <button 
                 disabled={pagination.page === 1}
                 onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                 className="w-12 h-12 rounded-full border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white disabled:opacity-20"
               >
                 <ChevronLeft size={20} />
               </button>
               <div className="text-center">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Temporal Node</p>
                  <p className="text-2xl font-black text-white italic tracking-tighter">{pagination.page}</p>
               </div>
               <button 
                 onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                 className="w-12 h-12 rounded-full border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white"
               >
                 <ChevronRight size={20} />
               </button>
            </div>
         )}
      </div>
    </div>
  );
};

export default Discovery;
