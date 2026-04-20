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
import sourcingService from '../services/sourcing';
import cjService from '../services/cj.service';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
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
    
    // Core Sourcing Context (v4.7.5 Price Sync)
    const { ebayProduct, query } = location.state || {};
    const targetPrice = Number(ebayProduct?.price || location.state?.targetPrice || 50);
    const batchContext = location.state?.batchContext || { avgPrice: targetPrice };
    const initialQuery = query || ebayProduct?.title || '';
    const targetProduct = ebayProduct;

    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [pipelineState, setPipelineState] = useState({
        status: 'IDLE'
    });

    const [telemetry, setTelemetry] = useState({ cj: null, merged_count: 0 });
    const [lastError, setLastError] = useState(null);
    const [showLog, setShowLog] = useState(false);

    // CJ Connection Auth Status
    const [authStatus, setAuthStatus] = useState('CHECKING'); // CHECKING, CONNECTED, FAILED
    const [authDetails, setAuthDetails] = useState(null);
    const checkCjConnection = useCallback(async () => {
        setAuthStatus('CHECKING');
        const result = await cjService.testConnection();
        setAuthDetails(result);

        if (result.cjConnectionStatus === 'CONNECTED') {
            setAuthStatus('CONNECTED');
        } else {
            setAuthStatus('FAILED');
        }
    }, []);

    useEffect(() => {
        checkCjConnection();
    }, [checkCjConnection]);

    const performSourcing = useCallback(async (queryParam = searchQuery, isManual = false, pageNum = 1) => {
        if (!targetProduct?.id || !queryParam?.trim()) return;
        
        setLoading(true);
        setPipelineState({ status: 'LOADING' });
        
        // If it's a new search (manual or first page), reset state
        if (isManual || pageNum === 1) {
            console.log("[SEARCH MODE]: NEW_SESSION", { query: queryParam });
            setProducts([]);
            setLastError(null);
            setCurrentPage(1);
        }

        try {
            const context = { 
                query: queryParam, 
                manualQuery: isManual ? queryParam : null,
                product: targetProduct,
                pageNum
            };
            
            const result = await cjService.runIterativePipeline(context);

            if (result.status === "SUCCESS") {
                const newProducts = result.products || [];
                
                setProducts(prev => {
                    // Deduplicate by product_id
                    const existingIds = new Set(prev.map(p => p.product_id));
                    const filteredNew = newProducts.filter(p => !existingIds.has(p.product_id));
                    return [...prev, ...filteredNew];
                });

                setHasMore(newProducts.length === 20); // CJ pageSize is 20
                setPipelineState({ status: 'SUCCESS' });
                setTelemetry(result.telemetry || { cj: null });
                
                if (pageNum === 1) {
                    toast.success(`Discovered ${newProducts.length} products`);
                }
            } else if (result.status === "NO_MATCH_FOUND") {
                if (pageNum === 1) {
                    setPipelineState({ status: 'NO_MATCH_FOUND' });
                    // v2 Rule: capture debug object for UI transparency
                    setLastError({ 
                        message: "The CJ catalog returns zero results for this item.",
                        queryAttempted: queryParam,
                        debug: result.debug,
                        suggestion: "Try broader keywords or manually search above."
                    });
                } else {
                    setHasMore(false);
                    toast.info("No more products found.");
                }
            } else {
                setPipelineState({ status: 'ERROR' });
                setLastError(result.message);
                toast.error(result.message || "CJ API Connection Failed");
            }
        } catch (e) {
            console.error("Discovery Pipeline Crash:", e);
            setPipelineState({ status: 'SYSTEM_DOWN' });
            toast.error(`CJ API Connection Failed.`);
        } finally {
            setLoading(false);
        }
    }, [targetProduct?.id, searchQuery, targetProduct]);

    const loadMore = () => {
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        performSourcing(searchQuery, false, nextPage);
    };

    useEffect(() => { 
        if (searchQuery?.trim()) performSourcing(); 
    }, [targetProduct?.id]);

    const processedResults = useMemo(() => {
        if (!targetProduct || products.length === 0) return [];
        
        return products.map(res => {
            // Data is already fully normalized and sorted by Profit in cj.service.js
            return { 
                ...res, 
                analytics: { 
                    profit: res.intelligence.financials.net_profit,
                    margin_signal: res.intelligence.financials.margin_signal
                }
            };
        });
    }, [products, targetProduct]);

    const paginatedResults = processedResults; // Local pagination is removed in favor of real API flow

    const handleContinue = (product) => {
        navigate(`/supplier-detail/${product.source}/${product.id}`, { 
            state: { 
                targetProduct: ebayProduct, 
                targetPrice,
                ebayItemUrl: ebayProduct?.itemUrl,
                preFetchedProduct: product,
                sellData: {
                    resellScore: product.alignmentScore,
                    grade: product.matchReason
                }
            } 
        });
    };

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
                        <h1 className="text-3xl font-black text-slate-950 italic tracking-tighter uppercase leading-none">CJ Discovery Engine</h1>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                             <Lock size={12} className="text-indigo-500" /> v5.0 High Fidelity Discovery
                        </p>
                    </div>
                </div>

                {/* MANUAL SEARCH OVERRIDE (v5.0) */}
                <div className="flex-1 max-w-xl">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                            <Search size={18} />
                        </div>
                        <input 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && performSourcing(searchQuery, true, 1)}
                            placeholder={targetProduct.title}
                            className="w-full pl-16 pr-32 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-950 focus:border-indigo-500 focus:bg-white focus:ring-0 transition-all outline-none"
                        />
                        <button 
                            onClick={() => performSourcing(searchQuery, true, 1)}
                            disabled={loading}
                            className="absolute right-3 top-3 bottom-3 px-6 bg-slate-950 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 disabled:opacity-50 transition-all"
                        >
                            {loading ? 'SEARCHING...' : 'SEARCH'}
                        </button>
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

            {/* PIPELINE TELEMETRY */}
            <div className="flex items-center gap-4 px-4 overflow-x-auto pb-2 scrollbar-hide">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-4">Network Status:</span>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[8px] font-black uppercase tracking-widest whitespace-nowrap">
                    <CheckCircle2 size={10} /> CJ API Connected
                </div>
                {telemetry.query_mode && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-[8px] font-black uppercase tracking-widest whitespace-nowrap">
                       <Zap size={10} /> Mode: {telemetry.query_mode.replace('_', ' ')}
                    </div>
                )}
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-[8px] font-black uppercase tracking-widest whitespace-nowrap">
                    <Zap size={10} /> {telemetry.merged_count || 0} Assets Normalized
                </div>
            </div>

            {/* v6.1 Mode Indicator */}
            {telemetry.query_mode === 'FALLBACK_EXPANSION' && (
                <div className="mx-4 p-5 bg-indigo-50 border border-indigo-100 rounded-[2rem] flex items-center gap-4 animate-in slide-in-from-top duration-500">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                        <Info size={20} />
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-indigo-950 uppercase tracking-widest leading-none">Broadened Match Active</p>
                        <p className="text-[10px] font-bold text-indigo-600 mt-1">Showing broader matches due to limited exact keyword results. You can refine search above.</p>
                    </div>
                </div>
            )}

            <div className="space-y-8">
                {/* 1. LOADING */}
                {loading && (
                    <div className="space-y-6 px-4">
                        {Array(3).fill(0).map((_, i) => (
                           <div key={i} className="h-40 bg-white rounded-[2.5rem] animate-pulse border border-slate-100" />
                        ))}
                    </div>
                )}

                {/* 2. DISCOVERY RESULTS */}
                {!loading && processedResults.length > 0 && (
                    <div className="grid grid-cols-1 gap-6 px-4">
                        {processedResults.map(res => (
                            <SupplierResultRow key={res.id} product={res} targetPrice={targetPrice} onContinue={handleContinue} />
                        ))}
                        {hasMore && processedResults.length > 0 && (
                             <div className="pb-10">
                                <button 
                                    onClick={loadMore} 
                                    disabled={loading}
                                    className="w-full py-8 bg-white border border-slate-200 text-slate-950 rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest hover:border-slate-400 transition-all shadow-sm disabled:opacity-50"
                                >
                                    {loading ? 'Fetching more from CJ...' : 'Load More Results'}
                                </button>
                             </div>
                        )}
                        <div className="mt-10 p-10 bg-slate-50 border border-slate-200 rounded-[3rem] text-center space-y-4 shadow-sm">
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Targeted Discovery Engine</p>
                             <button onClick={() => window.open(`https://cjdropshipping.com/product-list?keyword=${encodeURIComponent(searchQuery)}`, '_blank')} className="text-[11px] font-black text-white px-8 py-4 bg-slate-950 hover:bg-emerald-600 rounded-xl transition-all uppercase tracking-widest">
                                 Perform Manual CJ Catalog Search
                             </button>
                        </div>
                    </div>
                )}

                {/* 3. DETERMINISTIC FAILURE STATES */}
                {!loading && products.length === 0 && (
                    <div className="bg-white border-2 border-dashed border-slate-200 p-20 rounded-[4rem] text-center space-y-10 shadow-2xl shadow-slate-100 mx-4">
                        <div className={cn(
                            "w-24 h-24 border rounded-[3rem] flex items-center justify-center mx-auto shadow-inner",
                            pipelineState.status === 'ERROR' ? "bg-red-50 text-red-500" : "bg-slate-50 text-slate-300"
                        )}>
                            {pipelineState.status === 'ERROR' ? <AlertTriangle size={48} /> : <Box size={48} />}
                        </div>
                        
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black text-slate-950 italic tracking-tighter uppercase leading-tight">
                                {pipelineState.status === 'NO_MATCH_FOUND' ? "Discovery Failure" : "System Alert"}
                            </h3>
                            <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed font-medium">
                                {pipelineState.status === 'NO_MATCH_FOUND' ? "The 5-page catalog scan synchronized successfully, but zero high-fidelity candidates matched the target eBay title. Try refining keywords." :
                                 "The secure CJ API tunnel encountered an unexpected data structure."}
                                 
                                 {lastError && (pipelineState.status === 'SYSTEM_DOWN' || pipelineState.status === 'ERROR') && (
                                     <div className="mt-4 p-4 bg-slate-100 rounded-2xl text-left overflow-auto max-h-64 border border-slate-300">
                                         <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Technical Diagnosis</p>
                                         <code className="text-[10px] text-red-600 font-mono whitespace-pre-wrap">
                                             {typeof lastError === 'string' ? lastError : JSON.stringify(lastError, null, 2)}
                                         </code>
                                     </div>
                                 )}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <button onClick={performSourcing} className="w-full sm:w-auto px-16 py-6 bg-slate-950 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all transform hover:scale-105 italic flex items-center justify-center gap-4 shadow-2xl">
                                <RefreshCw size={20} className={loading ? "animate-spin" : ""} /> {loading ? "Searching..." : "Re-initiate Discovery"}
                            </button>
                            
                            {lastError && (
                                <button 
                                    onClick={() => setShowLog(!showLog)}
                                    className="w-full sm:w-auto px-10 py-6 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-[2rem] text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                                >
                                    <Activity size={18} /> {showLog ? "Hide Diagnostic Log" : "View Diagnostic Log"}
                                </button>
                            )}
                        </div>

                        <AnimatePresence>
                            {showLog && lastError && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-10 p-10 bg-slate-950 rounded-[3rem] text-left border border-slate-800 shadow-3xl overflow-hidden"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-3">
                                            <Lock size={14} /> Backend Diagnostic Payload
                                        </h4>
                                        <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Protocol v28.0-Hardened</span>
                                    </div>
                                    <pre className="text-[11px] font-mono text-slate-400 bg-slate-900/50 p-6 rounded-2xl border border-white/5 overflow-x-auto selection:bg-emerald-500/30">
                                        {JSON.stringify(authStatus === 'FAILED' ? authDetails : lastError, null, 2)}
                                    </pre>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupplierSourcing;
