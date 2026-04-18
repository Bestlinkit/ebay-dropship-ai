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
  Box,
  Warehouse
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import sourcingService from '../services/sourcing';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import SourcingStatusHeader from '../components/sourcing/SourcingStatusHeader';
import SupplierResultRow from '../components/sourcing/SupplierResultRow';

/**
 * CJ Unified Supplier Sourcing (v5.0)
 * HARD MANDATE: CJ Dropshipping only. Supplier Scoring Engine v1.0 active.
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
    const PAGE_SIZE = 3; // Focus on Top 3 as per mandate

    const [pipelineState, setPipelineState] = useState({
        status: sourcingService.Status.LOADING,
        sources: { cj: 'PENDING' }
    });

    const [telemetry, setTelemetry] = useState({ cj: null });
    const [diagnostics, setDiagnostics] = useState([]);

    const performSourcing = useCallback(async (query = searchQuery) => {
        if (!targetProduct?.id) return;
        
        setLoading(true);
        setPipelineState({ status: 'LOADING', sources: { cj: 'PENDING' } });

        try {
            const context = sourcingService.createContext(query, targetProduct);
            const result = await sourcingService.runIterativePipeline(context);

            setPipelineState({ status: result.status, sources: { cj: result.status === 'SUCCESS' ? 'COMPLETED' : 'FAILED' } });
            setProducts(result.products || []);
            setTelemetry(result.telemetry || { cj: null });
            setDiagnostics(result.diagnostics || []);

            if (result.status === "SUCCESS") {
                toast.success(`Discovered ${result.products.length} High-Rank Matches`);
                setLastError(null);
            } else if (result.status === "NO_RESULTS") {
                setLastError(null); // Managed state
            } else if (result.status === "ERROR") {
                setLastError(result.message);
                toast.error(result.message || "CJ API Connection Failed");
            }
        } catch (e) {
            console.error("CJ Discovery Pipeline Crash:", e);
            setLastError({ message: e.message });
            setPipelineState(s => ({ ...s, status: 'SYSTEM_DOWN' }));
            toast.error(`CJ API Connection Failed.`);
        } finally {
            setLoading(false);
        }
    }, [targetProduct?.id, searchQuery, targetProduct, targetPrice]);

    useEffect(() => { 
        if (targetProduct?.id) performSourcing(); 
    }, [targetProduct?.id]);

    const processedResults = useMemo(() => {
        if (!targetProduct || products.length === 0) return [];
        return products.map(p => ({ ...p, ...sourcingService.normalize(p) }));
    }, [products, targetProduct]);

    const handleContinue = (product) => {
        navigate(`/supplier-detail/${product.source}/${product.id}`, { 
            state: { 
                targetProduct: ebayProduct, 
                targetPrice,
                productUrl: product.url,
                preFetchedProduct: product,
                scores: product.scores
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
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 p-10 bg-[#0B1120] border border-white/5 rounded-[3rem] shadow-2xl">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="w-14 h-14 rounded-2xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all bg-slate-900">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">CJ Sourcing Intelligence</h1>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                             <ShieldCheck size={12} className="text-emerald-500" /> Protocol Alpha matching engine active
                        </p>
                    </div>
                </div>
                <div className="bg-slate-900 border border-white/5 p-6 rounded-[2rem] flex items-center gap-6">
                    <img src={targetProduct.image} alt="" className="w-16 h-16 rounded-xl border border-white/10 object-cover shadow-lg" />
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">eBay Target Price</p>
                        <p className="text-lg font-black text-emerald-400 italic leading-none">${targetPrice.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <SourcingStatusHeader 
                state={loading ? 'searching' : 'results'} 
                loading={loading} 
                resultsCount={products.length} 
                isGlobal={false} 
                query={searchQuery}
                onRetry={() => performSourcing()}
            />

            <div className="space-y-8">
                {/* 1. LOADING */}
                {loading && (
                    <div className="space-y-6">
                        {Array(PAGE_SIZE).fill(0).map((_, i) => (
                           <div key={i} className="h-40 bg-[#0B1120] rounded-[3.5rem] animate-pulse border border-white/5" />
                        ))}
                    </div>
                )}

                {/* 2. DISCOVERY RESULTS */}
                {!loading && processedResults.length > 0 && (
                    <div className="grid grid-cols-1 gap-6">
                        <div className="flex items-center justify-between px-10">
                            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                                <TrendingUp size={14} className="text-emerald-500" /> Rank Top 3 Alpha Variants
                            </h2>
                            <button 
                                onClick={() => setShowLog(!showLog)}
                                className="text-[9px] font-black text-slate-500 hover:text-emerald-400 uppercase tracking-widest flex items-center gap-2 transition-colors"
                            >
                                <RefreshCw size={12} /> {showLog ? "Hide Diagnostics" : "Reveal API Diagnostics"}
                            </button>
                        </div>

                        {showLog && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 p-8 rounded-[2rem] border border-white/10 space-y-4">
                                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest underline decoration-white/10 decoration-double">Pipeline Diagnostics Log</div>
                                {diagnostics.map((d, idx) => (
                                    <div key={idx} className="font-mono text-[11px] text-slate-400 border-b border-white/5 pb-2 last:border-0 flex justify-between">
                                        <span>QUERY: "{d.keyword}"</span>
                                        <span className={d.error ? "text-red-400" : "text-emerald-400"}>HTTP_{d.status} {d.error || "SUCCESS"}</span>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {processedResults.map(res => (
                            <SupplierResultRow key={res.id} product={res} targetPrice={targetPrice} onContinue={handleContinue} />
                        ))}
                    </div>
                )}

                {/* 3. DETERMINISTIC FAILURE / FALLBACK STATES */}
                {!loading && products.length === 0 && (
                    <div className="bg-[#0B1120] border-2 border-dashed border-white/10 p-20 rounded-[4rem] text-center space-y-10 shadow-2xl">
                        <div className={cn(
                            "w-24 h-24 border rounded-[3rem] flex items-center justify-center mx-auto shadow-inner",
                            pipelineState.status === 'ERROR' ? "bg-red-500/10 text-red-400 border-red-500/20" : 
                            "bg-slate-900 text-slate-500 border-white/5"
                        )}>
                            {pipelineState.status === 'ERROR' ? <AlertTriangle size={48} /> : 
                             <Info size={48} />}
                        </div>
                        
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-tight">
                                {pipelineState.status === 'NO_RESULTS' ? "No Exact Match Found" : 
                                 "Intelligence Failure"}
                            </h3>
                            <div className="flex flex-col gap-6 items-center">
                                <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed font-medium">
                                    {pipelineState.status === 'NO_RESULTS' ? "The matching engine was unable to link a 1:1 supplier match. System continuity active: You may attempt a broad category search or link a manual alternative." : 
                                     "The CJ Sourcing Engine encountered a protocol bridge error. Technical diagnostics available below."}
                                </p>
                                
                                <div className="p-8 bg-slate-900/50 rounded-[2.5rem] border border-white/5 max-w-lg w-full text-left space-y-6 shadow-3xl">
                                     <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                         <Activity size={14} /> Search Diagnostics
                                     </h4>
                                     <div className="space-y-2">
                                         {diagnostics.map((d, i) => (
                                             <div key={i} className="text-[10px] font-mono text-slate-500 border-b border-white/5 pb-1 last:border-0 flex justify-between">
                                                <span>{d.keyword}</span>
                                                <span className="text-slate-600">STATUS_{d.status}</span>
                                             </div>
                                         ))}
                                     </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <button onClick={() => performSourcing(targetProduct.title.split(' ').slice(0, 2).join(' '))} className="w-full sm:w-auto px-16 py-6 border border-white/10 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white/5 transition-all transform hover:scale-105 italic flex items-center justify-center gap-4">
                                <RefreshCw size={20} /> Attempt Broad Search
                            </button>
                            <button onClick={() => navigate('/discovery')} className="w-full sm:w-auto px-16 py-6 bg-slate-800 text-slate-400 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] hover:text-white transition-all">
                                Return to Market
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupplierSourcing;
