import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Search as SearchIcon,
  CheckCircle2,
  Terminal,
  ChevronDown,
  Globe,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import sourcingService from '../services/sourcing';
import { SourcingUIState } from '../constants/sourcing';
import { toast } from 'sonner';

// 🏗️ MODULAR COMPONENTS
import SourcingStatusHeader from '../components/sourcing/SourcingStatusHeader';
import SupplierResultRow from '../components/sourcing/SupplierResultRow';

/**
 * AliExpress Direct API Discovery (v5.0)
 * Manual keyword discovery flow powered by official DS API.
 */
const AliSourcing = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const targetProduct = location.state?.product;
    const initialQuery = location.state?.query || targetProduct?.title || '';

    const [loading, setLoading] = useState(false);
    const [isHydrating, setIsHydrating] = useState(false);
    const [matches, setMatches] = useState([]);
    const [uiState, setUiState] = useState(SourcingUIState.IDLE);
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [confirmModal, setConfirmModal] = useState(null);
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;

    const performSourcing = useCallback(async (query = searchQuery) => {
        if (!targetProduct) return;
        
        setLoading(true);
        setUiState(SourcingUIState.ALIEXPRESS_SEARCHING);
        setMatches([]);
        setPage(1);

        try {
            const result = await sourcingService.runAliExpressOfficial(query);
            
            if (result.status === "SUCCESS") {
                setMatches(result.products);
                setUiState(result.products.length > 0 ? SourcingUIState.ALIEXPRESS_SUCCESS : SourcingUIState.ALIEXPRESS_EMPTY);
            } else {
                setUiState(SourcingUIState.ALIEXPRESS_ERROR);
                toast.error(result.message || "Search Pipeline Offline");
            }
        } catch (e) {
            setUiState(SourcingUIState.ALIEXPRESS_ERROR);
            toast.error("Discovery Engine Fault");
        } finally {
            setLoading(false);
        }
    }, [targetProduct, searchQuery]);

    useEffect(() => { 
        if (initialQuery) performSourcing(initialQuery);
    }, []);

    const processedResults = useMemo(() => {
        if (!targetProduct || matches.length === 0) return [];
        
        return matches
            .map(res => {
                const relevance = sourcingService.calculateScore(res, Number(targetProduct.price) || 0);
                const roiRange = sourcingService.calculateROI(targetProduct.price, res.price);
                const trust = sourcingService.evaluateSupplierTrust(res);
                const sellData = sourcingService.calculateSellScore(res, { avgPrice: Number(targetProduct.price) || 0 });
                return { ...res, relevance, roiRange, trust, sellData };
            })
            .sort((a, b) => (b.sellData?.resellScore || 0) - (a.sellData?.resellScore || 0));
    }, [matches, targetProduct]);

    const paginatedResults = useMemo(() => processedResults.slice(0, page * PAGE_SIZE), [processedResults, page]);
    const hasMore = paginatedResults.length < processedResults.length;

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        performSourcing(searchQuery);
    };

    const handleContinue = (supplierProduct) => setConfirmModal(supplierProduct);

    const finalizeImport = async (supplierProduct) => {
        if (!targetProduct || !supplierProduct) {
            toast.error("Process Desynchronized");
            return;
        }

        setIsHydrating(true);
        const toastId = toast.loading("Fetching API Metadata...");

        try {
            const enrichment = await sourcingService.getProductDetails(supplierProduct.id || supplierProduct.url);
            
            const finalProduct = enrichment.status === 'SUCCESS' ? enrichment.data : supplierProduct;
            
            toast.success("Product Metadata Hydrated", { id: toastId });

            setTimeout(() => {
                navigate('/product-import-preview', { 
                    state: { 
                        product: {
                            ...finalProduct,
                            sourceType: 'api_aliexpress',
                            pricing: { 
                                basePrice: Number(targetProduct.price) || 0,
                                profitMargin: 30 
                            }
                        }
                    } 
                });
            }, 600);

        } catch (err) {
            toast.error("API Enrichment failed. Continuing with search data.", { id: toastId });
            navigate('/product-import-preview', { 
                state: { 
                    product: {
                        ...supplierProduct,
                        sourceType: 'api_aliexpress',
                        pricing: { basePrice: Number(targetProduct.price) || 0, profitMargin: 30 }
                    }
                }
            });
        } finally {
            setIsHydrating(false);
        }
    };

    if (!targetProduct) return <div className="h-[60vh] flex items-center justify-center text-slate-500 font-black uppercase tracking-widest italic">Target Required</div>;

    return (
        <div className="max-w-[1300px] mx-auto space-y-12 pb-40 px-6 animate-in fade-in duration-700">
            
            {/* 🧭 NAVIGATION */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 p-10 bg-white border border-slate-200 rounded-[3rem] shadow-sm">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="w-14 h-14 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all bg-slate-50">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-950 italic tracking-tighter uppercase leading-none">AliExpress Intelligence</h1>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                             Direct DS API Access 
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl flex items-center gap-4 bg-slate-50 border border-slate-200 p-2 rounded-2xl">
                    <div className="pl-4 text-slate-400"><SearchIcon size={18} /></div>
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Keyword investigation..."
                        className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 py-2"
                    />
                    <button 
                        type="submit"
                        disabled={loading}
                        className="bg-slate-950 text-white px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Searching...' : 'Search API'}
                    </button>
                </form>
            </div>

            {/* 🔍 STATUS BAR */}
            <div className="bg-white border border-slate-200 p-8 rounded-[2rem] flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-6">
                    <div className={cn("w-3 h-3 rounded-full", loading ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{loading ? "Active API Pipeline" : "Reports"}</p>
                        <h3 className="text-slate-950 font-bold text-sm uppercase">
                            {uiState === SourcingUIState.ALIEXPRESS_SEARCHING && "Calling AliExpress DS API..."}
                            {uiState === SourcingUIState.ALIEXPRESS_SUCCESS && `${processedResults.length} Qualified API Matches`}
                            {uiState === SourcingUIState.ALIEXPRESS_EMPTY && "API: Zero matches found"}
                            {uiState === SourcingUIState.ALIEXPRESS_ERROR && "API: Gateway Timeout / Fault"}
                            {uiState === SourcingUIState.IDLE && "Ready for keyword inquiry"}
                        </h3>
                    </div>
                </div>
            </div>

            {/* 🏗️ SOURCING FEED */}
            <div className="space-y-8">
                {uiState === SourcingUIState.ALIEXPRESS_SEARCHING ? (
                    <div className="space-y-8">
                        {Array(3).fill(0).map((_, i) => (
                           <div key={i} className="h-40 bg-white rounded-[2.5rem] animate-pulse border border-slate-100" />
                        ))}
                    </div>
                ) : uiState === SourcingUIState.ALIEXPRESS_ERROR ? (
                    <div className="py-24 text-center space-y-8 bg-slate-50 border border-slate-200 rounded-[4rem]">
                        <div className="w-24 h-24 bg-white text-rose-500 rounded-full flex items-center justify-center mx-auto border border-slate-200 shadow-xl">
                             <AlertCircle size={48} />
                        </div>
                        <div className="space-y-3">
                             <h4 className="text-2xl font-black text-slate-950 italic uppercase tracking-tighter">API Gateway Fault</h4>
                             <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">The AliExpress DS API is temporarily unreachable or returned a format mismatch.</p>
                        </div>
                        <button onClick={() => performSourcing()} className="bg-slate-950 text-white px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl">Retry API Request</button>
                    </div>
                ) : processedResults.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                        {paginatedResults.map(res => (
                            <SupplierResultRow 
                                key={res.id} 
                                product={res} 
                                targetPrice={targetProduct.price}
                                isBest={false}
                                onContinue={handleContinue}
                            />
                        ))}

                        {hasMore && (
                            <div className="flex justify-center pt-10">
                                <button 
                                    onClick={() => setPage(p => p + 1)}
                                    className="px-12 py-5 bg-white border border-slate-200 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-slate-400 transition-all flex items-center gap-3 shadow-sm"
                                >
                                    <ChevronDown size={14} /> Load More Results
                                </button>
                            </div>
                        )}
                    </div>
                ) : uiState === SourcingUIState.ALIEXPRESS_EMPTY ? (
                    <div className="py-20 text-center space-y-6">
                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-300 border border-slate-200">
                             <AlertCircle size={40} />
                        </div>
                        <div className="space-y-2">
                             <h4 className="text-xl font-black text-slate-950 italic uppercase">No API results found</h4>
                             <p className="text-slate-500 text-sm max-w-md mx-auto">Zero matches returned from AliExpress for this search query.</p>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* CONFIRMATION MODAL */}
            <AnimatePresence>
                {confirmModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-white/40">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white border border-slate-200 p-12 rounded-[3.5rem] max-w-xl w-full shadow-2xl text-center space-y-10"
                        >
                            <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl">
                                <Zap size={32} className={cn(isHydrating && "animate-spin text-emerald-400")} />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-3xl font-black text-slate-950 italic tracking-tighter uppercase leading-none">
                                    {isHydrating ? "API Hydration..." : "Import Intelligence?"}
                                </h3>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    {isHydrating 
                                        ? "Extracting full metadata directly from AliExpress DS API v1.2.5..." 
                                        : "Locking in product selection. Full marketplace telemetry will be established."}
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    disabled={isHydrating}
                                    onClick={() => setConfirmModal(null)} 
                                    className="flex-1 py-5 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all disabled:opacity-30"
                                >
                                    Abort
                                </button>
                                <button 
                                    disabled={isHydrating}
                                    onClick={() => finalizeImport(confirmModal)} 
                                    className="flex-1 py-5 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-emerald-600 transition-all shadow-xl disabled:opacity-50"
                                >
                                    {isHydrating ? "Processing..." : "Confirm & Import"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AliSourcing;
