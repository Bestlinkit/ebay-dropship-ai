import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Package, 
  Truck, 
  DollarSign, 
  ChevronRight, 
  ShieldCheck, 
  ShieldAlert, 
  Star,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  Activity,
  RefreshCw,
  AlertCircle,
  Globe,
  Clock,
  Lock,
  Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import eproloService from '../services/eprolo';
import aliexpressService from '../services/aliexpress';
import sourcingService from '../services/sourcing';
import { SourcingStatus } from '../constants/sourcing';
import { toast } from 'sonner';

// 🏗️ MODULAR COMPONENTS
import SourcingStatusHeader from '../components/sourcing/SourcingStatusHeader';
import SupplierResultRow from '../components/sourcing/SupplierResultRow';

/**
 * Stable Supplier Sourcing (v4.0)
 * Implement discovery-first architecture with backend-driven safety.
 */
const SupplierSourcing = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const ebayProduct = location?.state?.ebayProduct || location?.state?.product || null;
    const initialQuery = location.state?.query || ebayProduct?.title || '';
    const targetProduct = ebayProduct;

    const [loading, setLoading] = useState(true);
    const [rawResults, setRawResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [showAliExpansion, setShowAliExpansion] = useState(false);
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 4;

    const targetPrice = targetProduct?.price || 0;

    const [pipelineState, setPipelineState] = useState({
        status: sourcingService.Status.LOADING,
        sources: { eprolo: 'PENDING', aliexpress: 'PENDING' }
    });

    const [activeTier, setActiveTier] = useState(null);
    const [isFallback, setIsFallback] = useState(false);

    const performSourcing = useCallback(async (query = searchQuery) => {
        if (!targetProduct?.id || !query?.trim()) return;
        
        setLoading(true);
        setRawResults([]);
        setPipelineState({ status: 'LOADING', sources: { eprolo: 'PENDING', aliexpress: 'PENDING' } });
        setIsFallback(false);

        try {
            // 🚀 STAGE 1: INITIALIZE ITERATIVE CONTEXT
            const context = sourcingService.createContext(query, targetProduct);
            
            // 🚀 STAGE 2: RUN ITERATIVE PIPELINE (Query Intent Reduction Layer)
            const result = await sourcingService.runIterativePipeline(
                context, 
                (tierQuery) => ({
                    fetchEprolo: () => {
                        setActiveTier(tierQuery);
                        return eproloService.searchProducts(tierQuery);
                    },
                    fetchAliExpress: () => aliexpressService.searchProducts(tierQuery)
                })
            );

            setPipelineState({ status: result.status, sources: result.sources });
            setRawResults(result.data);
            setIsFallback(result.isFallback || result.status === 'BROADER_CATEGORY_REQUIRED');

            if (result.data.length > 0 && result.successfulTier !== query) {
                toast.success(`Optimized search: "${result.successfulTier}"`, {
                    description: "High-intent attributes extracted for better catalog matching."
                });
                setSearchQuery(result.successfulTier);
            }

        } catch (e) {
            console.error("Discovery Pipeline Crash:", e);
            setPipelineState(s => ({ ...s, status: 'SYSTEM_DOWN' }));
            toast.error(`Discovery failed. Check backend status.`);
        } finally {
            setLoading(false);
            setActiveTier(null);
        }
    }, [targetProduct?.id, searchQuery, targetProduct, targetPrice]);

    useEffect(() => { 
        if (searchQuery?.trim()) performSourcing(); 
    }, [targetProduct?.id]);

    const processedResults = useMemo(() => {
        if (!targetProduct || rawResults.length === 0) return [];
        
        return rawResults
            .map(raw => {
                const res = sourcingService.normalize(raw);
                const relevance = sourcingService.calculateOpportunityScore(res, targetPrice);
                
                return { 
                    ...res, 
                    relevance
                };
            })
            .sort((a, b) => b.relevance - a.relevance);
    }, [rawResults, targetProduct, targetPrice]);

    const paginatedResults = useMemo(() => processedResults.slice(0, page * PAGE_SIZE), [processedResults, page]);

    const handleContinue = (product) => {
        // Navigate to mandatory Detail Page
        navigate(`/supplier-detail/${product.source}/${product.id}`, { 
            state: { 
                targetProduct, 
                targetPrice,
                productUrl: product.url 
            } 
        });
    };

    const handleExpandSearch = () => setShowAliExpansion(true);

    if (!targetProduct) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-8 bg-white text-center p-10">
                <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-[2rem] flex items-center justify-center text-slate-300">
                    <AlertCircle size={40} />
                </div>
                <div className="space-y-4">
                    <h3 className="text-xl font-black text-slate-950 italic tracking-tighter uppercase">Inquiry Lost</h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto">Please return to Discovery to select a product.</p>
                </div>
                <button onClick={() => navigate('/discovery')} className="px-10 py-5 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-xl">
                    Back to Discovery <ArrowRight size={14} />
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-[1300px] mx-auto space-y-12 pb-40 px-6 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 p-10 bg-white border border-slate-200 rounded-[3rem] shadow-sm">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="w-14 h-14 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all bg-slate-50">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-950 italic tracking-tighter uppercase leading-none">Discovery Pipeline</h1>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                             <Lock size={12} className="text-emerald-500" /> Secure Sourcing Node v2.0
                        </p>
                    </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-[2rem] flex items-center gap-6">
                    <img src={targetProduct.image} alt="" className="w-16 h-16 rounded-xl border border-slate-200 object-cover shadow-lg" />
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">eBay Target Price</p>
                        <p className="text-lg font-black text-emerald-600 italic leading-none">${targetPrice.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <SourcingStatusHeader 
                state={loading ? 'searching' : 'results'} 
                loading={loading} 
                resultsCount={processedResults.length} 
                isGlobal={false} 
            />

            {/* 🛡️ PIPELINE STATUS ALERTS */}
            <AnimatePresence>
                {loading && activeTier && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6">
                         <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-4">
                               <RefreshCw size={16} className="text-blue-500 animate-spin" />
                               <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">
                                  Analyzing Intent: <span className="italic text-blue-600">"{activeTier}"</span>
                               </span>
                            </div>
                            <span className="text-[9px] font-bold text-blue-400 uppercase">Tiered Search Active</span>
                         </div>
                    </motion.div>
                )}

                {!loading && (pipelineState.sources.aliexpress === 'BLOCKED' || pipelineState.sources.eprolo === 'FAILED') && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm mb-8">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                                    <ShieldAlert size={26} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-[11px] font-black text-amber-900 uppercase tracking-widest leading-none">Partial Match Integrity</h4>
                                    <p className="text-[10px] font-medium text-amber-700/80 max-w-md">
                                        {pipelineState.sources.aliexpress === 'BLOCKED' 
                                            ? "AliExpress detection is currently intercepted. Switch to Global Scraper for browser-bypass discovery." 
                                            : "One or more supplier nodes are offline. Displaying available catalog matches."}
                                    </p>
                                </div>
                            </div>
                            <button onClick={handleExpandSearch} className="px-6 py-3 bg-white border border-amber-200 text-amber-700 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-100 transition-colors shrink-0">
                                Solve Blockage
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-8">
                {/* 1. LOADING */}
                {loading && (
                    <div className="space-y-6">
                        {Array(3).fill(0).map((_, i) => (
                           <div key={i} className="h-40 bg-white rounded-[2.5rem] animate-pulse border border-slate-100" />
                        ))}
                    </div>
                )}

                {/* 2. DISCOVERY RESULTS */}
                {!loading && processedResults.length > 0 && (
                    <div className="grid grid-cols-1 gap-6">
                        {isFallback && (
                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] flex items-center justify-between mb-2">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center border border-emerald-500/20">
                                      <Zap size={18} />
                                   </div>
                                   <div>
                                      <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Iterative Fallback Active</p>
                                      <p className="text-[9px] font-medium text-slate-500 mt-1">Showing broader category results since exact matches were unavailable.</p>
                                   </div>
                                </div>
                            </div>
                        )}
                        {paginatedResults.map(res => (
                            <SupplierResultRow key={res.id} product={res} targetPrice={targetPrice} onContinue={handleContinue} />
                        ))}
                        {processedResults.length > paginatedResults.length && (
                             <button onClick={() => setPage(p => p + 1)} className="w-full py-8 bg-white border border-slate-200 text-slate-950 rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest hover:border-slate-400 transition-all shadow-sm">
                                 Show Next {Math.min(PAGE_SIZE, processedResults.length - paginatedResults.length)} Matches
                             </button>
                        )}
                        <div className="mt-10 p-10 bg-slate-50 border border-slate-200 rounded-[3rem] text-center space-y-4 shadow-sm">
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Need more options?</p>
                             <button onClick={handleExpandSearch} className="text-[11px] font-black text-white px-8 py-4 bg-slate-950 hover:bg-emerald-600 rounded-xl transition-all uppercase tracking-widest">
                                 Open Global Scraper
                             </button>
                        </div>
                    </div>
                )}

                {/* 3. FALLBACK / EMPTY STATE */}
                {!loading && processedResults.length === 0 && (
                    <div className="bg-white border-2 border-dashed border-slate-200 p-20 rounded-[4rem] text-center space-y-10 shadow-2xl shadow-slate-100">
                        <div className="w-24 h-24 bg-slate-50 border border-slate-100 text-slate-300 rounded-[3rem] flex items-center justify-center mx-auto shadow-inner"><Box size={48} /></div>
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black text-slate-950 italic tracking-tighter uppercase leading-tight">BROADER CATEGORY SEARCH ONLY</h3>
                            <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed font-medium">
                                We've analyzed the query intent and determined that exact matches are currently unavailable across our supply chain. 
                                <br />
                                <span className="text-slate-950 font-bold">Try searching for the basic category (soap, watch, etc) instead.</span>
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <button onClick={() => navigate('/discovery')} className="w-full sm:w-auto px-12 py-5 border-2 border-slate-950 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-950 hover:text-white transition-all transform hover:scale-105">Change Discovery Query</button>
                            <button onClick={handleExpandSearch} className="w-full sm:w-auto bg-emerald-500 text-white px-12 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 transform hover:scale-105 flex items-center justify-center gap-3">
                               <Globe size={18} /> Forced Global Search
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showAliExpansion && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-white/40">
                         <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white border border-slate-200 p-12 rounded-[4rem] max-w-lg w-full text-center space-y-8 shadow-2xl">
                            <div className="w-16 h-16 bg-slate-950 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl"><Globe size={32} /></div>
                            <div className="space-y-4">
                                <h3 className="text-3xl font-black text-slate-950 italic uppercase tracking-tighter">Global Scraper</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">Initiating manual AliExpress discovery vector.</p>
                            </div>
                            <div className="space-y-4">
                                <button onClick={() => navigate('/ali-sourcing', { state: { product: targetProduct, query: searchQuery } })} className="w-full py-6 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl">Launch Vector</button>
                                <button onClick={() => setShowAliExpansion(false)} className="w-full py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-950 transition-colors">Cancel</button>
                            </div>
                         </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SupplierSourcing;
