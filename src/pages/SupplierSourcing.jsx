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
  Lock
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

    const performSourcing = useCallback(async (query = searchQuery) => {
        if (!targetProduct?.id || !query?.trim()) return;
        
        setLoading(true);
        setRawResults([]);
        setPipelineState({ status: 'LOADING', sources: { eprolo: 'PENDING', aliexpress: 'PENDING' } });

        try {
            // 🚀 STAGE 1: LIGHTWEIGHT DISCOVERY PIPELINE
            const result = await sourcingService.runUnifiedPipeline(
                { query, targetPrice }, 
                {
                    fetchEprolo: () => eproloService.searchProducts(query),
                    fetchAliExpress: () => aliexpressService.searchProducts(query)
                }
            );

            setPipelineState({ status: result.status, sources: result.sources });
            setRawResults(result.data);

            if (result.status === 'SYSTEM_DOWN') {
                toast.error("Bridge Error: Unable to reach supplier networks.");
            }

        } catch (e) {
            console.error("Discovery Pipeline Crash:", e);
            setPipelineState(s => ({ ...s, status: 'SYSTEM_DOWN' }));
            toast.error(`Discovery failed. Check backend status.`);
        } finally {
            setLoading(false);
        }
    }, [targetProduct?.id, searchQuery]);

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

            <SourcingStatusHeader state={loading ? 'searching' : 'results'} loading={loading} resultsCount={processedResults.length} isGlobal={false} />

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
                        {paginatedResults.map(res => (
                            <SupplierResultRow key={res.id} product={res} targetPrice={targetPrice} onContinue={handleContinue} />
                        ))}
                        {processedResults.length > paginatedResults.length && (
                             <button onClick={() => setPage(p => p + 1)} className="w-full py-8 bg-white border border-slate-200 text-slate-950 rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest hover:border-slate-400 transition-all shadow-sm">
                                 Show Next {Math.min(PAGE_SIZE, processedResults.length - paginatedResults.length)} Matches
                             </button>
                        )}
                        <div className="mt-10 p-10 bg-slate-50 border border-slate-200 rounded-[3rem] text-center space-y-4 shadow-sm">
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Manual Search Required?</p>
                             <button onClick={handleExpandSearch} className="text-[11px] font-black text-white px-8 py-4 bg-slate-950 hover:bg-emerald-600 rounded-xl transition-all uppercase tracking-widest">
                                 Open Global Scraper
                             </button>
                        </div>
                    </div>
                )}

                {/* 3. EMPTY STATE */}
                {!loading && processedResults.length === 0 && (
                    <div className="bg-slate-50 border border-slate-200 p-16 rounded-[4rem] text-center space-y-10">
                        <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-[2.5rem] flex items-center justify-center mx-auto"><ShieldAlert size={40} /></div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-black text-slate-950 italic tracking-tighter uppercase">No Direct Matches</h3>
                            <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">Discovery could not find high-relevance matches. Initiate manual expansion below.</p>
                        </div>
                        <button onClick={handleExpandSearch} className="bg-slate-950 text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl mx-auto">Initiate Global Scraper</button>
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
