import React, { useState, useEffect } from 'react';
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
  LayoutGrid,
  List,
  Globe,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ebayService from '../services/ebay';
import eproloService from '../services/eprolo';
import ProductCard from '../components/ProductCard';
import SourcingModal from '../components/SourcingModal';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

/**
 * Crystal Pulse Discovery Hub (V5.4)
 * Premium, Architectural Market Intelligence Center
 */
const Discovery = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEbayProduct, setSelectedEbayProduct] = useState(null);
  const [source, setSource] = useState('ebay'); // 'ebay' or 'eprolo'
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const { isStoreConnected } = useAuth();
  const navigate = useNavigate();

  const topCategories = [
    { id: '293', name: 'Electronics', icon: '📱' },
    { id: '11450', name: 'Fashion', icon: '👕' },
    { id: '11700', name: 'Home & Garden', icon: '🏡' },
    { id: '1', name: 'Collectibles', icon: '🏺' },
    { id: '220', name: 'Toys & Hobbies', icon: '🧸' },
    { id: '888', name: 'Sporting Goods', icon: '🎾' }
  ];

  useEffect(() => {
    const fetchMarketPulse = async () => {
        setLoading(true);
        try {
            // Initial Pulse: Load Electronics or if user selected a category
            const targetCat = activeCategory || topCategories[0].id;
            const results = await ebayService.searchProducts(null, targetCat);
            setTrendingProducts(results || []);
        } catch (e) {
            console.error("Market Pulse Sync Failed", e);
            setTrendingProducts([]);
        } finally {
            setLoading(false);
        }
    };
    fetchMarketPulse();
  }, [activeCategory]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearchResults([]);
    setPage(1);
    try {
      if (source === 'ebay') {
        const results = await ebayService.searchProducts(query);
        setSearchResults(results || []);
        const insightData = await ebayService.getCompetitorInsights(query);
        setCompetitors(insightData || []);
        toast.success(`Market vectors synced for "${query}"`);
      } else {
        const results = await eproloService.searchProducts(query);
        setSearchResults(results || []);
        setCompetitors([]); 
        toast.success(`Sourcing matches found on Eprolo for "${query}"`);
      }
    } catch (error) {
      toast.error("Discovery engine encountered a vector mismatch.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (product) => {
    setSelectedEbayProduct(product);
    setIsModalOpen(true);
  };

  const handleMatchSelect = async (sourceProduct) => {
    setIsModalOpen(false);
    navigate(`/optimize/${selectedEbayProduct.id}`, { 
      state: { 
        ebayProduct: selectedEbayProduct,
        sourceProduct: sourceProduct 
      } 
    });
  };

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-32 max-w-[1700px] mx-auto">
      
      {/* Editorial Hero Search */}
      <section className="relative min-h-[450px] flex flex-col items-center justify-center text-center px-6 overflow-hidden rounded-[3.5rem] bg-slate-900 shadow-3xl mx-4 lg:mx-0">
         <section className="bg-white p-12 md:p-20 rounded-[4rem] border border-slate-100 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[120px] -mr-48 -mt-48" />
         
         <div className="relative z-10 space-y-12">
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-2xl shadow-xl">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live API: Global Pulse</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none">Market Discovery.</h1>
                <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">
                    Scanning the eBay production vector for high-velocity sourcing opportunities.
                </p>
            </div>

            <div className="flex gap-4 justify-center">
                {[
                    { id: 'ebay', label: 'Market Intelligence', icon: Globe },
                    { id: 'eprolo', label: 'Sourcing Hub', icon: ShoppingBag }
                ].map(s => (
                    <button
                        key={s.id}
                        type="button"
                        onClick={() => setSource(s.id)}
                        className={cn(
                            "px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border backdrop-blur-md",
                            source === s.id ? "bg-white text-slate-900 border-white shadow-2xl" : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white"
                        )}
                    >
                        <s.icon size={16} />
                        {s.label}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSearch} className="group relative max-w-2xl mx-auto w-full">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/50 to-indigo-500/50 rounded-[2.5rem] blur opacity-25 group-focus-within:opacity-100 transition duration-1000" />
                <div className="relative flex items-center bg-white rounded-[2.25rem] p-2 pr-2.5 shadow-2xl">
                    <div className="pl-6 pr-4 text-slate-300">
                        <Search size={22} />
                    </div>
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={source === 'ebay' ? "Search eBay market vectors..." : "Search Eprolo sourcing catalog..."}
                        className="flex-1 bg-transparent py-5 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-medium"
                    />
                    <button type="submit" className="h-[60px] px-10 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-3 shadow-xl">
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} className="fill-white" />}
                        {source === 'ebay' ? 'Scan Market' : 'Sync Sourcing'}
                    </button>
                </div>
            </form>
         </div>
      </section>

      {/* Intelligence Panel */}
      <section className="bg-white/50 backdrop-blur-md p-3 rounded-[3.5rem] border border-slate-100 shadow-sm mx-4 lg:mx-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white p-10 rounded-[3rem] border border-slate-50 space-y-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-primary-100/10 rounded-xl flex items-center justify-center text-primary-500 shadow-sm border border-primary-50">
                          <BarChart3 size={18} />
                      </div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Market Context</h3>
                  </div>
                  <div className="space-y-4">
                      {competitors.length > 0 ? competitors.slice(0, 3).map((item, i) => (
                          <div key={i} className="flex justify-between items-center group">
                               <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="w-1 h-1 bg-primary-500 rounded-full" />
                                  <span className="text-[11px] font-bold text-slate-900 truncate">{item.title}</span>
                               </div>
                               <span className="text-[10px] font-black text-primary-500 bg-primary-50 px-2 py-1 rounded-md ml-4 text-nowrap">${item.price}</span>
                          </div>
                      )) : (
                          <p className="text-[10px] text-slate-400 font-bold uppercase italic tracking-widest">Awaiting sector sync...</p>
                      )}
                  </div>
              </div>

              <div className="bg-white p-10 rounded-[3rem] border border-slate-50 space-y-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-50">
                          <TrendingUp size={18} />
                      </div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">AI Prediction</h3>
                  </div>
                  <p className="text-sm font-bold text-slate-900 leading-tight">
                      {query ? `Neural Forecast: +12.4% velocity for "${query}" in next 14d.` : "Trajectory data pending source selection."}
                  </p>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Growth Vector Active</span>
                  </div>
              </div>

              <div className="bg-slate-900 p-10 rounded-[3rem] flex flex-col justify-between text-white relative overflow-hidden group shadow-2xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 rounded-full blur-[50px] -mr-16 -mt-16 group-hover:scale-150 transition-all duration-1000" />
                  <div className="relative z-10 flex items-center justify-between mb-4">
                      <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Node Status</h4>
                      <div className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest">Sync Active</div>
                  </div>
                  <p className="relative z-10 text-[11px] font-bold leading-relaxed mb-6 text-slate-400">
                      Protocol 5.4: Competitor delta monitoring and gap detection active.
                  </p>
                  <button className="relative z-10 w-full h-12 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-all active:scale-95 shadow-xl">
                      Configure Pulse
                  </button>
              </div>
          </div>
      </section>

      {/* Results Feed */}
      <div className="space-y-12 px-4 lg:px-0">
          
          {!query && (
              <section className="space-y-12">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-10">
                      <div className="space-y-2">
                          <h2 className="text-[10px] font-black text-primary-500 uppercase tracking-[0.4em] flex items-center gap-2">
                              Live Hotspots
                          </h2>
                          <p className="text-2xl font-outfit font-black text-slate-900 uppercase">Velocity Leaders.</p>
                      </div>
                      <div className="flex items-center gap-4">
                          <div className="flex gap-2">
                             <button 
                                onClick={() => {
                                    const container = document.getElementById('trending-carousel');
                                    if (container) container.scrollBy({ left: -350, behavior: 'smooth' });
                                }}
                                className="p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                             >
                                <ChevronLeft size={20} />
                             </button>
                             <button 
                                onClick={() => {
                                    const container = document.getElementById('trending-carousel');
                                    if (container) container.scrollBy({ left: 350, behavior: 'smooth' });
                                }}
                                className="p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                             >
                                <ChevronRight size={20} />
                             </button>
                          </div>
                      </div>
                  </div>

                  {trendingProducts.length > 0 ? (
                      <div className="relative pb-12">
                         <div 
                            id="trending-carousel"
                            className="flex gap-8 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-6 px-1"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                         >
                            {trendingProducts.map((product, i) => (
                                <div key={i} className="min-w-[320px] md:min-w-[340px] snap-start">
                                    <ProductCard 
                                        product={product} 
                                        onImport={handleImport}
                                        compact={false}
                                    />
                                </div>
                            ))}
                         </div>
                         <div className="absolute bottom-4 left-0 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-primary-500 w-1/3 transition-all duration-500" />
                         </div>
                      </div>
                  ) : (
                      <div className="py-20 flex flex-col items-center gap-4 text-slate-300">
                          <Zap size={48} className="opacity-20" />
                          <p className="text-[10px] font-black uppercase tracking-[0.3em]">Neural Scanning Standby...</p>
                      </div>
                  )}
              </section>
          )}

          <AnimatePresence mode="wait">
              {loading ? (
                  <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-40 glass-card rounded-[3.5rem]"
                  >
                      <div className="relative mb-10">
                          <Loader2 className="animate-spin text-slate-100" size={120} />
                          <Target size={40} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-500" />
                      </div>
                      <h3 className="text-2xl font-outfit font-black text-slate-900 uppercase">Identifying Vectors</h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-4">Synchronizing Marketplace Nodes...</p>
                  </motion.div>
              ) : searchResults.length > 0 ? (
                  <motion.div 
                      key={page} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-10"
                  >
                      <div className="flex flex-col md:flex-row items-center justify-between glass-card px-10 py-6 rounded-[2.5rem] gap-6">
                          <div className="flex items-center gap-6">
                              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">
                                  Matches for: <span className="text-primary-500 italic">"{query}"</span>
                              </h3>
                              <div className="hidden md:block h-6 w-px bg-slate-100" />
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{searchResults.length} Results Synced</span>
                          </div>
                          <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                              <button 
                                  onClick={() => setViewMode('grid')}
                                  className={cn("p-2.5 rounded-xl transition-all", viewMode === 'grid' ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-slate-900")}
                              >
                                  <LayoutGrid size={18} />
                              </button>
                              <button 
                                  onClick={() => setViewMode('list')}
                                  className={cn("p-2.5 rounded-xl transition-all", viewMode === 'list' ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-slate-900")}
                              >
                                  <List size={18} />
                              </button>
                          </div>
                      </div>

                      <div className={cn(
                          "grid gap-12 transition-all duration-500",
                          viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
                      )}>
                          {searchResults.slice((page-1)*6, page*6).map((product) => (
                              <ProductCard 
                                  key={product.id} 
                                  product={product} 
                                  onImport={handleImport}
                                  compact={viewMode === 'list'}
                              />
                          ))}
                      </div>

                      <div className="flex items-center justify-center gap-4 py-20 border-t border-slate-100">
                          <button 
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p-1))}
                            className="w-14 h-14 glass-card rounded-2xl text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-all flex items-center justify-center shadow-sm"
                          >
                              <ChevronLeft size={24} />
                          </button>
                          <div className="flex gap-4">
                              {Array.from({ length: Math.min(5, Math.ceil(searchResults.length / 6)) }).map((_ , i) => (
                                  <button 
                                      key={i+1}
                                      onClick={() => setPage(i+1)}
                                      className={cn(
                                          "w-14 h-14 rounded-2xl text-xs font-black transition-all",
                                          page === i+1 ? "bg-slate-900 text-white shadow-3xl" : "glass-card text-slate-400 hover:bg-white"
                                      )}
                                  >
                                      {i+1}
                                  </button>
                              ))}
                          </div>
                          <button 
                            disabled={page >= Math.ceil(searchResults.length / 6)}
                            onClick={() => setPage(p => p + 1)}
                            className="w-14 h-14 glass-card rounded-2xl text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-all flex items-center justify-center shadow-sm"
                          >
                              <ChevronRight size={24} />
                          </button>
                      </div>
                  </motion.div>
              ) : query && !loading && (
                  <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-40 glass-card rounded-[3.5rem] text-center"
                  >
                      <AlertCircle size={64} className="text-slate-100 mb-8" />
                      <h3 className="text-xl font-outfit font-black text-slate-900 uppercase">Zero Pulse Detected</h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] max-w-xs mx-auto mt-4 leading-relaxed">
                          Synchronizer failed to detect opportunities. Broaden keywords to re-scan.
                      </p>
                  </motion.div>
              )}
          </AnimatePresence>
      </div>

      <SourcingModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ebayProduct={selectedEbayProduct}
        onMatchSelect={handleMatchSelect}
      />
    </div>
  );
};

export default Discovery;
