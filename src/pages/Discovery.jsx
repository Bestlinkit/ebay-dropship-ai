import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Loader2, 
  Sparkles, 
  AlertCircle, 
  BarChart3,
  Zap,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  ShoppingBag,
  Target,
  ArrowRight,
  Globe,
  Monitor,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import ebayService from '../services/ebay';
import eproloService from '../services/eprolo';
import aliexpressService from '../services/aliexpress';
import sourcingService from '../services/sourcing';
import ProductCard from '../components/ProductCard';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

const Discovery = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [activeWinners, setActiveWinners] = useState([]);
  const [source, setSource] = useState('ebay'); 
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  // 🤖 WINNER DETECTION LOOP (Background Processing)
  const processDiscoveryBatch = useCallback(async (products) => {
      const winners = [];
      for (const p of products) {
          const rank = sourcingService.rankProduct(p);
          const scoredProduct = { ...p, rank };
          
          if (rank.score >= 80) {
              winners.push(scoredProduct);
              
              // SEVERITY ROUTING & AUTO-IMPORT
              const cooldown = sourcingService.isCoolingDown(p.id);
              if (!cooldown) {
                  const severity = rank.score >= 90 ? 'HIGH' : 'MEDIUM';
                  
                  addNotification({
                      title: p.title,
                      snippet: sourcingService.getSnippet(rank),
                      desc: sourcingService.getExplanation(rank),
                      severity,
                      icon: rank.score >= 90 ? 'Zap' : 'TrendingUp',
                      productState: p,
                      rankDetails: rank
                  });

                  // AUTO-IMPORT SAFETY VALVE (Score 90+)
                  if (rank.score >= 90) {
                      sourcingService.markProcessed(p.id);
                      if (import.meta.env.DEV) console.info(`[Market Sync] Auto-importing discovery winner: ${p.title}`);
                  }
              }
          }
      }
      setActiveWinners(prev => [...winners, ...prev].slice(0, 10));
  }, [addNotification]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearchResults([]);
    try {
      let results = [];
      if (source === 'ebay') {
        results = await ebayService.searchProducts(query);
      } else if (source === 'eprolo') {
        results = await eproloService.searchProducts(query);
      } else {
        results = await aliexpressService.searchProducts(query);
      }
      
      setSearchResults(results || []);
      if (results?.length > 0) {
          processDiscoveryBatch(results);
      }
    } catch (error) {
      toast.error("Discovery module synchronized vector fault.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-32 max-w-[1700px] mx-auto">
      
      <section className="bg-slate-950 p-12 md:p-20 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[120px] -mr-64 -mt-64" />
         
         <div className="relative z-10 space-y-10">
            <div className="flex flex-col items-center text-center space-y-6">
                <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
                    Neural Sourcing Node Active
                </div>
                <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none">Intelligence Discovery.</h1>
                <p className="text-slate-400 font-medium text-lg max-w-xl">Deep-market scanning for high-velocity dropshipping winners.</p>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
                {[
                  { id: 'ebay', label: 'Market Pulse', icon: Globe },
                  { id: 'eprolo', label: 'Eprolo Engine', icon: Shield },
                  { id: 'aliexpress', label: 'Ali Intelligence', icon: Zap },
                ].map(s => (
                  <button 
                    key={s.id}
                    onClick={() => setSource(s.id)}
                    className={cn(
                        "flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                        source === s.id ? "bg-white text-slate-950 border-white shadow-lg shadow-white/10" : "bg-transparent text-white/40 border-white/5 hover:border-white/10"
                    )}
                  >
                    <s.icon size={16} />
                    {s.label}
                  </button>
                ))}
            </div>

            <form onSubmit={handleSearch} className="max-w-3xl mx-auto w-full relative group">
                <div className="flex items-center bg-white/5 border border-white/10 rounded-[2rem] p-2 pr-3 focus-within:border-primary-500/50 transition-all backdrop-blur-md">
                    <div className="pl-6 pr-4 text-white/30"><Search size={22} /></div>
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Scan for deterministic winner signals..."
                        className="flex-1 bg-transparent py-5 text-sm font-bold text-white outline-none placeholder:text-white/20"
                    />
                    <button type="submit" className="h-14 px-10 bg-primary-500 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all flex items-center gap-3 shadow-xl">
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Target size={18} />}
                        Execute Scan
                    </button>
                </div>
            </form>
         </div>
      </section>

      {activeWinners.length > 0 && (
          <section className="space-y-8 animate-in slide-in-from-top-4 duration-1000">
              <div className="flex items-center justify-between border-b border-slate-100 pb-8">
                  <div className="space-y-1">
                      <h2 className="text-[10px] font-black text-primary-500 uppercase tracking-[0.4em]">Proprietary Winners</h2>
                      <p className="text-2xl font-black text-slate-900 uppercase">Detection Feed.</p>
                  </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {activeWinners.map((w, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={w.id} 
                        className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:border-primary-500/20 transition-all duration-500 h-96 flex flex-col"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5 -mr-10 -mt-10 transform rotate-12 group-hover:rotate-0 transition-all duration-700">
                            <Zap size={150} fill="currentColor" />
                        </div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="px-3 py-1 bg-primary-500 text-slate-950 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg">Winner Signal</div>
                            <span className="text-[11px] font-black text-slate-900 italic">{w.rank.score}% Score</span>
                        </div>
                        <div className="flex-1 space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{w.title}</h3>
                            <div className="space-y-2.5">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Logic Explanation</p>
                                <div className="space-y-2">
                                    {(sourcingService.getExplanation(w.rank).split(" + ")).map((signal, si) => (
                                        <div key={si} className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                                            <CheckCircle2 size={12} className="text-emerald-500" />
                                            {signal}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate("/optimize/" + w.id, { state: { ebayProduct: w } })}
                            className="mt-6 w-full h-12 bg-slate-950 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-primary-500 hover:text-slate-950 transition-all flex items-center justify-center gap-2 shadow-xl"
                        >
                            Open Intelligence Profile <ArrowUpRight size={14} />
                        </button>
                    </motion.div>
                 ))}
              </div>
          </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
              <section className="space-y-8">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-8">
                      <p className="text-xl font-black text-slate-900 uppercase">Search Results.</p>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{searchResults.length} Products Scanned</div>
                  </div>
                  {!loading && searchResults.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {searchResults.map(p => (
                              <ProductCard 
                                key={p.id} 
                                product={p} 
                                onImport={(prd) => navigate("/optimize/" + prd.id, { state: { ebayProduct: prd } })} 
                              />
                          ))}
                      </div>
                  ) : loading ? (
                      <div className="py-40 flex flex-col items-center justify-center gap-6">
                          <Loader2 size={64} className="animate-spin text-slate-100" />
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Traversing Marketplace Nodes...</p>
                      </div>
                  ) : (
                      <div className="py-32 flex flex-col items-center justify-center gap-4 text-slate-200 border-2 border-dashed border-slate-100 rounded-[3.5rem]">
                          <Monitor size={48} className="opacity-20" />
                          <p className="text-[10px] font-black uppercase tracking-[0.3em]">Execution Buffer Empty</p>
                      </div>
                  )}
              </section>
          </div>

          <aside className="space-y-8">
             <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-8">
                <h3 className="text-[10px] font-black text-slate-950 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Clock size={16} /> Scan History
                </h3>
                <div className="space-y-4">
                    {/* Placeholder for real scan history logic if needed */}
                    <div className="p-5 bg-white rounded-2xl border border-slate-100 space-y-3">
                         <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-300 uppercase">Latest Scan</span>
                            <span className="text-[8px] font-black text-emerald-500 uppercase">Synchronized</span>
                         </div>
                         <p className="text-xs font-bold text-slate-900">{query || 'Awaiting input...'}</p>
                    </div>
                </div>
             </div>
          </aside>
      </div>
    </div>
  );
};

export default Discovery;
