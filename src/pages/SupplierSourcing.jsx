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
    
    // Core Sourcing Context
    const { ebayProduct, targetPrice = 50, query } = location.state || {};
    const batchContext = location.state?.batchContext || { avgPrice: targetPrice };
    const initialQuery = query || ebayProduct?.title || '';
    const targetProduct = ebayProduct;

    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 8;

    const [pipelineState, setPipelineState] = useState({
        status: sourcingService.Status.LOADING,
        sources: { aliexpress: 'PENDING' }
    });

    const [telemetry, setTelemetry] = useState({ aliexpress: null });
    const [lastError, setLastError] = useState(null);
    const [showLog, setShowLog] = useState(false);

    const performSourcing = useCallback(async (query = searchQuery) => {
        if (!targetProduct?.id || !query?.trim()) return;
        
        setLoading(true);
        setPipelineState({ status: 'LOADING', sources: { aliexpress: 'PENDING' } });

        try {
            const context = cjService.createContext ? cjService.createContext(query, targetProduct) : { query, product: targetProduct };
            const result = await cjService.runIterativePipeline(context);

            setPipelineState({ status: result.status, sources: { cj: 'COMPLETED' } });
            setProducts(result.products || []);
            setTelemetry(result.telemetry || { cj: null });

             if (result.status === "SUCCESS") {
                if ((result.products || []).length > 0) {
                    toast.success(`Discovered ${result.products.length} products`);
                    setLastError(null);
                } else {
                    setLastError(result.debug || { message: "No CJ matches found." });
                    toast.error("No matches found in CJ catalog.");
                }
            } else if (result.status === "ERROR") {
                setLastError(result.debug || result.message);
                toast.error(result.message || "CJ API Connection Failed");
            }
        } catch (e) {
            console.error("Discovery Pipeline Crash:", e);
            const crashLog = {
                message: e.message,
                status: e.response?.status,
                statusText: e.response?.statusText,
                url: e.config?.url,
                stack: e.stack,
                context: "Discovery_Pipeline_Crash"
            };
            setLastError(crashLog);
            setPipelineState(s => ({ ...s, status: 'SYSTEM_DOWN' }));
            toast.error(`CJ API Connection Failed.`);
        } finally {
            setLoading(false);
        }
    }, [targetProduct?.id, searchQuery, targetProduct, targetPrice]);

    useEffect(() => { 
        if (searchQuery?.trim()) performSourcing(); 
    }, [targetProduct?.id]);

    const processedResults = useMemo(() => {
        if (!targetProduct || products.length === 0) return [];
        
        return products
            .map(raw => {
                const res = cjService.normalizeResult ? cjService.normalizeResult(raw) : raw;
                
                // Use Market Discovery scores for consistent analytics
                const sellData = sourcingService.calculateSellScore(res, batchContext || { avgPrice: targetPrice });
                const roiData = sourcingService.calculateROI(targetPrice, res.price);

                return { 
                    ...res, 
                    sellData,
                    roiData
                };
            })
            .sort((a, b) => (b.sellData?.resellScore || 0) - (a.sellData?.resellScore || 0));
    }, [products, targetProduct, targetPrice, batchContext]);

    const paginatedResults = useMemo(() => processedResults.slice(0, page * PAGE_SIZE), [processedResults, page]);

    const handleContinue = (product) => {
        navigate(`/supplier-detail/${product.source}/${product.id}`, { 
            state: { 
                targetProduct: ebayProduct, 
                targetPrice,
                productUrl: product.url,
                preFetchedProduct: product,
                sellData: product.sellData 
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
                        <h1 className="text-3xl font-black text-slate-950 italic tracking-tighter uppercase leading-none">CJ Dropshipping Sourcing Hub</h1>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                             <Lock size={12} className="text-indigo-500" /> Isolated Sourcing Module v2.0
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
                resultsCount={products.length} 
                isGlobal={false} 
                query={searchQuery}
                onAliTrigger={() => navigate('/ali-sourcing', { state: { product: targetProduct, query: searchQuery } })}
                onRetry={() => performSourcing()}
            />

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
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Targeted Discovery Engine</p>
                             <button onClick={() => navigate('/ali-sourcing', { state: { product: targetProduct, query: searchQuery } })} className="text-[11px] font-black text-white px-8 py-4 bg-slate-950 hover:bg-emerald-600 rounded-xl transition-all uppercase tracking-widest">
                                 Perform Manual Keyword Search
                             </button>
                        </div>
                    </div>
                )}

                {/* 3. DETERMINISTIC FAILURE STATES */}
                {!loading && products.length === 0 && (
                    <div className="bg-white border-2 border-dashed border-slate-200 p-20 rounded-[4rem] text-center space-y-10 shadow-2xl shadow-slate-100">
                        <div className={cn(
                            "w-24 h-24 border rounded-[3rem] flex items-center justify-center mx-auto shadow-inner",
                            pipelineState.status === 'ERROR' ? "bg-red-50 text-red-300" : 
                            "bg-slate-50 text-slate-300"
                        )}>
                            {pipelineState.status === 'ERROR' ? <AlertTriangle size={48} /> : 
                             <Box size={48} />}
                        </div>
                        
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black text-slate-950 italic tracking-tighter uppercase leading-tight">
                                {pipelineState.status === 'NO_RESULTS' ? "0 Results" : 
                                 pipelineState.status === 'TIMEOUT' ? "Try Again" :
                                 "System Error"}
                            </h3>
                            <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed font-medium">
                                {pipelineState.status === 'NO_RESULTS' ? "The CJ catalog has no matches for this specific query." : 
                                 pipelineState.status === 'TIMEOUT' ? "The request to CJ took too long." :
                                 "The secure CJ API tunnel encountered an unexpected data structure. Technical diagnostics required."}
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
                                        {JSON.stringify(lastError, null, 2)}
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
