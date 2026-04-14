import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Loader2, 
  Target,
  ChevronRight,
  ChevronLeft,
  ShoppingBag,
  ExternalLink,
  Shield,
  Layers,
  RefreshCw,
  Box,
  BarChart3,
  Activity,
  History,
  Layout,
  DollarSign,
  AlertCircle
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
 * Market Research Intelligence Terminal (v8.0)
 * Unified Architecture: Shared Global Filter State for Market and Inventory Nodes.
 */
const MarketResearch = () => {
  const [activeTab, setActiveTab] = useState('intelligence');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [marketProducts, setMarketProducts] = useState([]);
  const [rawMyListings, setRawMyListings] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // ⚡ UNIFIED GLOBAL FILTER STATE (Single Source of Truth)
  const [filters, setFilters] = useState({
    categoryId: '',
    minPrice: '',
    maxPrice: '',
    sellerHistory: 'ALL',
    sort: 'ops'
  });
  
  const [pagination, setPagination] = useState({ page: 1 });
  const [error, setError] = useState(null);
  
  const cacheRegistry = useRef(new Map());
  const { user } = useAuth();
  const navigate = useNavigate();

  // 1. DATA PULSE: Real-time inventory synchronization
  useEffect(() => {
    const syncInventory = async () => {
      if (!user?.ebayToken) return;
      try {
        const liveProducts = await ebayTrading.getActiveListings(user.ebayToken);
        setRawMyListings(liveProducts || []);
      } catch (e) {
        console.warn("[Inventory Pulse] Synchronization degradation detected.");
      }
    };
    syncInventory();
  }, [user?.ebayToken]);

  // 2. CATEGORY PRELOADER
  useEffect(() => {
    ebayService.getCategorySuggestions('top').then(setCategories);
  }, []);

  // 3. DETERMINISTIC LOCAL FILTERING (For "My Listings" tab)
  const filteredMyListings = useMemo(() => {
    if (!rawMyListings) return [];
    
    return rawMyListings.filter(p => {
      const matchesQuery = !query || p.title?.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = !filters.categoryId || p.categoryId === filters.categoryId;
      const matchesMinPrice = !filters.minPrice || p.price >= parseFloat(filters.minPrice);
      const matchesMaxPrice = !filters.maxPrice || p.price <= parseFloat(filters.maxPrice);
      
      return matchesQuery && matchesCategory && matchesMinPrice && matchesMaxPrice;
    }).sort((a, b) => {
       if (filters.sort === 'ops') {
          return (b.ops?.score || 0) - (a.ops?.score || 0); // Calculate local OPS if needed, for now use baseline
       }
       if (filters.sort === 'price_asc') return a.price - b.price;
       if (filters.sort === 'price_desc') return b.price - a.price;
       return 0;
    });
  }, [rawMyListings, query, filters]);

  // 4. INTELLIGENCE ENGINE: Market Feed Execution
  const executeMarketResearch = useCallback(async (isAuto = false) => {
    // Generate Deterministic Cache Key
    const cacheKey = btoa(JSON.stringify({ query, ...filters, page: pagination.page }));
    
    if (cacheRegistry.current.has(cacheKey) && !isAuto) {
      setMarketProducts(cacheRegistry.current.get(cacheKey));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let results = [];
      if (isAuto && !query) {
        results = await ebayService.fetchTrendingProducts(filters.categoryId || null);
      } else {
        results = await ebayService.searchProducts(query || 'top sellers', {
          ...filters,
          limit: 12,
          offset: (pagination.page - 1) * 12
        });
      }

      setMarketProducts(results || []);
      cacheRegistry.current.set(cacheKey, results || []);
    } catch (err) {
      setError("Market data temporarily unavailable - Node synchronization fault.");
    } finally {
      setLoading(false);
    }
  }, [query, filters, pagination.page]);

  // 5. REACTIVE DEBOUNCE PULSE
  useEffect(() => {
    if (activeTab === 'intelligence') {
      const timer = setTimeout(() => executeMarketResearch(), 450);
      return () => clearTimeout(timer);
    }
  }, [filters, query, pagination.page, activeTab, executeMarketResearch]);

  // Initialize trending feed
  useEffect(() => {
    executeMarketResearch(true);
  }, []);

  // Filter Handler with reset
  const handleFilterUpdate = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination({ page: 1 });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-32 max-w-[1700px] mx-auto px-6 font-inter">
      
      {/* 🚀 UNIFIED FILTER TERMINAL */}
      <section className="bg-slate-900 border border-slate-800 rounded-[2rem] p-3 pl-8 shadow-2xl flex flex-wrap items-center gap-6">
         <div className="flex items-center gap-4 flex-1 min-w-[300px]">
            <Search className="text-slate-600" size={18} />
            <input 
              type="text" 
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPagination({ page: 1 }); }}
              placeholder="Search Intelligence Registry..."
              className="w-full bg-transparent py-4 text-xs font-bold text-text-primary outline-none placeholder:text-slate-700"
            />
         </div>

         <div className="h-8 w-px bg-slate-800 hidden md:block" />

         <div className="flex flex-wrap items-center gap-4">
            <select 
              value={filters.categoryId}
              onChange={(e) => handleFilterUpdate('categoryId', e.target.value)}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase text-text-muted outline-none hover:text-white transition-all cursor-pointer"
            >
              <option value="">Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <div className="flex items-center gap-2 bg-slate-800/30 rounded-xl border border-slate-700/50 px-3 py-2">
               <DollarSign size={12} className="text-slate-600" />
               <input 
                 type="number" placeholder="Min" 
                 value={filters.minPrice}
                 className="w-14 bg-transparent text-[10px] font-black text-white outline-none"
                 onChange={(e) => handleFilterUpdate('minPrice', e.target.value)}
               />
               <span className="text-slate-800">—</span>
               <input 
                 type="number" placeholder="Max" 
                 value={filters.maxPrice}
                 className="w-14 bg-transparent text-[10px] font-black text-white outline-none"
                 onChange={(e) => handleFilterUpdate('maxPrice', e.target.value)}
               />
            </div>

            <select 
              value={filters.sort}
              onChange={(e) => handleFilterUpdate('sort', e.target.value)}
              className="bg-primary text-slate-950 font-black px-5 py-2.5 rounded-xl text-[10px] uppercase outline-none shadow-xl shadow-primary/10 transition-all active:scale-95"
            >
              <option value="ops">OPS Priority</option>
              <option value="price_asc">Price: Low</option>
              <option value="price_desc">Price: High</option>
            </select>
         </div>
      </section>

      {/* 🧭 NAVIGATION TABS */}
      <div className="flex items-center gap-4 bg-slate-900/30 p-1.5 rounded-2xl border border-slate-800/50 w-fit">
         {[
           { id: 'intelligence', label: 'Market Feed', icon: Activity },
           { id: 'my-listings', label: 'My Inventory', icon: ShoppingBag }
         ].map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={cn(
               "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2.5",
               activeTab === tab.id ? "bg-slate-800 text-white shadow-lg shadow-black/20" : "text-slate-500 hover:text-slate-300"
             )}
           >
             <tab.icon size={14} />
             {tab.label}
           </button>
         ))}
      </div>

      {/* 🗂 RESULTS TERMINAL */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab + (loading ? '-loading' : '-ready')}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="space-y-6 min-h-[600px]"
        >
          {loading ? (
             <div className="space-y-4">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="h-28 bg-slate-900 rounded-[2rem] animate-pulse relative overflow-hidden border border-slate-800">
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                  </div>
                ))}
             </div>
          ) : error ? (
            <div className="py-40 flex flex-col items-center justify-center gap-6 text-center">
               <div className="p-8 bg-rose-500/5 rounded-full text-rose-500 border border-rose-500/20 italic"><AlertCircle size={48} /></div>
               <p className="text-sm font-bold text-slate-500 max-w-sm leading-relaxed tracking-tight italic">"{error}"</p>
               <button onClick={() => executeMarketResearch()} className="px-6 py-2.5 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Retry Pulse</button>
            </div>
          ) : (
            <div className="space-y-4">
               {activeTab === 'intelligence' ? (
                 marketProducts.length > 0 ? (
                   marketProducts.map(p => (
                     <ProductCard 
                       key={p.id} 
                       product={p} 
                       onOptimize={() => navigate("/optimize/" + p.id, { state: { ebayProduct: p } })} 
                     />
                   ))
                 ) : (
                    <div className="py-40 flex flex-col items-center justify-center gap-6 opacity-30 italic text-slate-500">
                       <BarChart3 size={60} strokeWidth={1} />
                       <div className="text-center space-y-1">
                          <p className="text-[11px] font-black uppercase tracking-widest">No products match current filters</p>
                          <p className="text-[9px] font-bold">Try adjusting your search criteria in the terminal.</p>
                       </div>
                    </div>
                 )
               ) : (
                 filteredMyListings.length > 0 ? (
                   filteredMyListings.map(p => (
                     <ProductCard 
                       key={p.id} 
                       product={p} 
                       onOptimize={() => navigate("/optimize/" + p.id, { state: { ebayProduct: p } })} 
                     />
                   ))
                 ) : (
                    <div className="py-40 flex flex-col items-center justify-center gap-6 opacity-30 italic text-slate-500">
                       <Box size={60} strokeWidth={1} />
                       <div className="text-center space-y-1">
                          <p className="text-[11px] font-black uppercase tracking-widest">Inventory Node Buffer Empty</p>
                          <p className="text-[9px] font-bold">Sync successful, but no listings match current filter state.</p>
                       </div>
                    </div>
                 )
               )}
            </div>
          )}

          {activeTab === 'intelligence' && marketProducts.length > 0 && !loading && (
             <div className="flex items-center justify-center gap-10 pt-16 border-t border-slate-800/50">
                <button 
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  className="w-12 h-12 rounded-full border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-500 disabled:opacity-20 transition-all font-black uppercase text-[10px]"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex flex-col items-center gap-0.5">
                   <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Temporal Page</span>
                   <span className="text-2xl font-black text-white italic tracking-tighter">{pagination.page}</span>
                </div>
                <button 
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  className="w-12 h-12 rounded-full border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-500 transition-all font-black uppercase text-[10px]"
                >
                  <ChevronRight size={20} />
                </button>
             </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default MarketResearch;
