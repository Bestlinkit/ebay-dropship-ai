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
    const [lastError, setLastError] = useState(null);
    const [showLog, setShowLog] = useState(false);

    const performSourcing = useCallback(async (query = searchQuery) => {
        if (!targetProduct?.id || !query?.trim()) return;
        
        setLoading(true);
        setPipelineState({ status: 'LOADING', sources: { cj: 'PENDING' } });

        try {
            const context = sourcingService.createContext(query, targetProduct);
            const result = await sourcingService.runIterativePipeline(context);

            setPipelineState({ status: result.status, sources: { cj: result.status === 'SUCCESS' ? 'COMPLETED' : 'FAILED' } });
            setProducts(result.products || []);
            setTelemetry(result.telemetry || { cj: null });

            if (result.status === "SUCCESS") {
                if ((result.products || []).length > 0) {
                    toast.success(`Discovered ${result.products.length} High-Rank Matches`);
                    setLastError(null);
                } else {
                    setLastError({ message: "CJ_EMPTY: No direct matches found for this query." });
                    toast.error("No matches found in CJ catalog.");
                }
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
        if (searchQuery?.trim()) performSourcing(); 
    }, [targetProduct?.id]);

    const processedResults = useMemo(() => {
        if (!targetProduct || products.length === 0) return [];
        
        return products.map(raw => sourcingService.normalize(raw));
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
                             <ShieldCheck size={12} className="text-emerald-500" /> Unified Supplier Scoring Engine v5.0
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
                            <div className="flex items-center gap-6">
                                <span className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-4 py-1.5 rounded-full">
                                    <Warehouse size={12} /> Priority: US Storage
                                </span>
                            </div>
                        </div>
                        {processedResults.map(res => (
                            <SupplierResultRow key={res.id} product={res} targetPrice={targetPrice} onContinue={handleContinue} />
                        ))}
                        
                        <div className="mt-10 p-10 bg-slate-50 border border-slate-200 rounded-[3rem] text-center space-y-4 shadow-sm">
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Global Supplier Purge Active: AliExpress DS & Affiliate Logic Decommissioned</p>
                             <div className="flex items-center justify-center gap-10">
                                 <div className="flex flex-col items-center">
                                     <span className="text-xl font-black text-slate-950 italic">100%</span>
                                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">CJ Match Rate</span>
                                 </div>
                                 <div className="w-px h-10 bg-slate-200" />
                                 <div className="flex flex-col items-center">
                                     <span className="text-xl font-black text-emerald-600 italic">v5.0</span>
                                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Scoring Core</span>
                                 </div>
                             </div>
                        </div>
                    </div>
                )}

                {/* 3. DETERMINISTIC FAILURE STATES */}
                {!loading && products.length === 0 && (
                    <div className="bg-[#0B1120] border-2 border-dashed border-white/10 p-20 rounded-[4rem] text-center space-y-10 shadow-2xl">
                        <div className={cn(
                            "w-24 h-24 border rounded-[3rem] flex items-center justify-center mx-auto shadow-inner",
                            pipelineState.status === 'ERROR' ? "bg-red-500/10 text-red-400 border-red-500/20" : 
                            "bg-slate-900 text-slate-500 border-white/5"
                        )}>
                            {pipelineState.status === 'ERROR' ? <AlertTriangle size={48} /> : 
                             <Box size={48} />}
                        </div>
                        
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-tight">
                                {pipelineState.status === 'NO_RESULTS' ? "0 Results" : 
                                 pipelineState.status === 'TIMEOUT' ? "Try Again" :
                                 "Intelligence Failure"}
                            </h3>
                            <div className="flex flex-col gap-6 items-center">
                                <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed font-medium">
                                    {pipelineState.status === 'NO_RESULTS' ? "Your current search constraints yielded 0 matches in the CJ Dropshipping catalog." : 
                                     "The CJ Sourcing Engine encountered a protocol bridge error. This often occurs due to keyword specificity."}
                                </p>
                                
                                <div className="p-8 bg-slate-900/50 rounded-[2.5rem] border border-white/5 max-w-lg w-full text-left space-y-6 shadow-3xl">
                                     <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                         <Activity size={14} /> Search Consultant Analysis
                                     </h4>
                                     <ul className="text-[11px] text-slate-400 space-y-3 list-disc pl-5 font-medium uppercase tracking-[0.1em] leading-relaxed">
                                         <li>Broaden your keyword (e.g. "Portable Charger" instead of "X-Max 5000mAh Power Bank")</li>
                                         <li>Remove restrictive brand names or SKU model numbers</li>
                                         <li>Verify there are no character encoding issues in the title</li>
                                         <li>Execute a "Sync" to refresh the CJ Catalog linkage</li>
                                     </ul>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <button onClick={performSourcing} className="w-full sm:w-auto px-16 py-6 bg-white text-slate-950 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all transform hover:scale-105 italic flex items-center justify-center gap-4 shadow-2xl">
                                <RefreshCw size={20} className={loading ? "animate-spin" : ""} /> {loading ? "Searching..." : "Sync CJ Database"}
                            </button>
                        </div>

                        {lastError && (
                            <div className="mt-10 p-6 bg-slate-900 rounded-3xl border border-white/5 text-left max-w-lg mx-auto">
                                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <AlertCircle size={12} /> Root Cause Analysis
                                </p>
                                <p className="text-[12px] font-mono text-slate-500 break-all">
                                    {typeof lastError === 'string' ? lastError : lastError.message}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupplierSourcing;
