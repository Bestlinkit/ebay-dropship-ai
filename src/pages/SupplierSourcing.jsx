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
import extensionConnector from '../services/extensionConnectorService';
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
    
    // Core Sourcing Context
    const { ebayProduct, targetPrice = 50, query } = location.state || {};
    const batchContext = location.state?.batchContext || { avgPrice: targetPrice };
    const initialQuery = query || ebayProduct?.title || '';
    const targetProduct = ebayProduct;

    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [manualSnapshot, setManualSnapshot] = useState("");
    const [showAliExpansion, setShowAliExpansion] = useState(false);
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 8;

    const [pipelineState, setPipelineState] = useState({
        status: sourcingService.Status.LOADING,
        sources: { eprolo: 'PENDING', aliexpress: 'PENDING' }
    });

    const [activeTier, setActiveTier] = useState(null);
    const [isFallback, setIsFallback] = useState(false);
    const [telemetry, setTelemetry] = useState({ eprolo: null, aliexpress: null });
    const [showDebug, setShowDebug] = useState(false);
    const [connectionHealth, setConnectionHealth] = useState("NOT_INSTALLED");

    const performSourcing = useCallback(async (query = searchQuery) => {
        if (!targetProduct?.id || !query?.trim()) return;
        
        setLoading(true);
        setPipelineState({ status: 'LOADING', sources: { eprolo: 'PENDING', aliexpress: 'PENDING' } });
        setIsFallback(false);

        try {
            // 🚀 STAGE 1: INITIALIZE ITERATIVE CONTEXT
            const context = sourcingService.createContext(query, targetProduct);
            
            // 🚀 STAGE 2: RUN DETERMINISTIC PIPELINE (v21.2 Stabilization)
            const result = await sourcingService.runIterativePipeline(
                context, 
                (tierQuery) => ({
                    fetchEprolo: () => extensionConnector.request('eprolo', tierQuery),
                    fetchAliExpress: () => extensionConnector.request('aliexpress', tierQuery)
                })
            );

            // result.status will now be SUCCESS | NO_RESULTS | ERROR | BLOCKED | TIMEOUT
            setPipelineState({ status: result.status, sources: result.sources });
            setProducts(result.products || []);
            setTelemetry(result.telemetry || { eprolo: null, aliexpress: null });

            if (result.status === "SUCCESS") {
                toast.success(`Discovered ${result.products.length} products`);
            } else if (result.status === "BLOCKED") {
                toast.error("Access blocked by supplier security");
            } else if (result.status === "ERROR") {
                toast.error("Extraction logic encountered an error");
            }

        } catch (e) {
            console.error("Discovery Pipeline Crash:", e);
            setPipelineState(s => ({ ...s, status: 'SYSTEM_DOWN' }));
            toast.error(`Discovery failed. Check backend status.`);
        } finally {
            setLoading(false);
            setActiveTier(null);
            // Re-sync health after search
            const health = await extensionConnector.testConnection();
            setConnectionHealth(health);
        }
    }, [targetProduct?.id, searchQuery, targetProduct, targetPrice]);

    const checkInitialHealth = useCallback(async () => {
        const health = await extensionConnector.testConnection();
        setConnectionHealth(health);
    }, []);

    useEffect(() => { 
        checkInitialHealth();
        if (searchQuery?.trim()) performSourcing(); 
    }, [targetProduct?.id, checkInitialHealth]);

    const processedResults = useMemo(() => {
        if (!targetProduct || products.length === 0) return [];
        
        return products
            .map(raw => {
                const res = sourcingService.normalize(raw);
                const relevance = sourcingService.calculateOpportunityScore(res, targetPrice);
                
                // Calculate Intelligence Signal (Market Analysis)
                const sellData = sourcingService.calculateSellScore(res, batchContext || { avgPrice: targetPrice });

                return { 
                    ...res, 
                    relevance,
                    sellData
                };
            })
            .sort((a, b) => (b.sellData?.resellScore || 0) - (a.sellData?.resellScore || 0));
    }, [products, targetProduct, targetPrice, batchContext]);

    const paginatedResults = useMemo(() => processedResults.slice(0, page * PAGE_SIZE), [processedResults, page]);

    const handleContinue = (product) => {
        // Navigate to mandatory Detail Page with Intelligence Payload
        navigate(`/supplier-detail/${product.source}/${product.id}`, { 
            state: { 
                targetProduct: ebayProduct, 
                targetPrice,
                productUrl: product.url,
                preFetchedProduct: product,
                sellData: product.sellData // Pass the analytical engine results
            } 
        });
    };

    const handleManualImport = async (source) => {
        setLoading(true);
        try {
            const result = aliexpressService.parseManualSource(source);
            if (result.status === 'SUCCESS' && result.data) {
                // If successful, push to results directly or navigate
                handleContinue(result.data);
            } else {
                toast.error("Format unrecognized. Make sure you copied the full page content.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleExpandSearch = () => setShowAliExpansion(true);

    const handleRetryConnection = async () => {
        setLoading(true);
        const health = await extensionConnector.testConnection();
        setConnectionHealth(health);
        setLoading(false);

        if (health === "CONNECTED") {
            toast.success("Extension Bridge Connected", {
                description: "Heartbeat detected. Re-initiating search..."
            });
            performSourcing();
        } else {
            const msg = health === "NOT_INSTALLED" ? "Extension not detected in browser" :
                        health === "TIMEOUT" ? "Handshake timeout. Try reloading the extension." :
                        "Service worker is unreachable.";
            toast.error("Connection Failed", { description: msg });
        }
    };

    const intelMatchTier = pipelineState.successfulTier;
    const isWaterfall = pipelineState.isFallback;





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
                             <Lock size={12} className="text-emerald-500" /> Secure Intelligence Bridge v2.0
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

            {/* 🛡️ PIPELINE STATUS ALERTS */}
            <AnimatePresence>
                {loading && activeTier && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6">
                         <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-4">
                               <RefreshCw size={16} className="text-blue-500 animate-spin" />
                               <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">
                                  Analyzing Intent: <span className="italic">"{activeTier}"</span>
                               </span>
                            </div>
                            <span className="text-[9px] font-bold text-blue-400 uppercase">Tiered Search Active</span>
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
                        {intelMatchTier && (
                            <div className="bg-emerald-950/20 border border-emerald-500/20 p-6 rounded-[2rem] flex items-center justify-between mb-4 shadow-sm">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 bg-emerald-500 text-slate-950 rounded-xl flex items-center justify-center shadow-lg">
                                      <Zap size={18} />
                                   </div>
                                   <div>
                                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none">
                                         Intel Match: <span className="italic">"{intelMatchTier}"</span>
                                      </p>
                                      <p className="text-[9px] font-medium text-emerald-600/60 mt-1">
                                         {isWaterfall ? "Waterfall Recovery successful. Optimized for category depth." : "High-signal exact match found in Tier 1."}
                                      </p>
                                   </div>
                                </div>
                                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[8px] font-black text-emerald-500 uppercase tracking-widest">
                                   Status: {isWaterfall ? 'FALLBACK' : 'PRIMARY'}
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

                {/* 3. DETERMINISTIC FAILURE STATES (v21.2) */}
                {!loading && products.length === 0 && (
                    <div className="bg-white border-2 border-dashed border-slate-200 p-20 rounded-[4rem] text-center space-y-10 shadow-2xl shadow-slate-100">
                        <div className={cn(
                            "w-24 h-24 border rounded-[3rem] flex items-center justify-center mx-auto shadow-inner",
                            pipelineState.status === 'ERROR' ? "bg-red-50 text-red-300" : 
                            pipelineState.status === 'BLOCKED' ? "bg-amber-50 text-amber-300" :
                            "bg-slate-50 text-slate-300"
                        )}>
                            {pipelineState.status === 'ERROR' ? <AlertTriangle size={48} /> : 
                             pipelineState.status === 'BLOCKED' ? <Lock size={48} /> : 
                             <Box size={48} />}
                        </div>
                        
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black text-slate-950 italic tracking-tighter uppercase leading-tight">
                                {pipelineState.status === 'NO_RESULTS' ? "0 Results" : 
                                 pipelineState.status === 'BLOCKED' ? "Access Blocked" : 
                                 pipelineState.status === 'TIMEOUT' ? "Try Again" :
                                 "System Error"}
                            </h3>
                            <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed font-medium">
                                {pipelineState.status === 'NO_RESULTS' ? "The supplier catalog has no matches for this specific query." : 
                                 pipelineState.status === 'BLOCKED' ? "Your current IP or fingerprint is restricted. Use the Global Scraper." : 
                                 pipelineState.status === 'TIMEOUT' ? "The request to the supplier took too long. Please attempt a re-initiation." :
                                 "The extraction logic encountered a structural mismatch with the supplier's web page."}
                            </p>
                        </div>

                        {pipelineState.sources.aliexpress === 'WRONG_PAGE_TYPE' && (
                            <div className="max-w-md mx-auto p-8 bg-amber-50 border border-amber-100 rounded-[2.5rem] space-y-6">
                                <p className="text-[11px] font-black text-amber-900 uppercase tracking-widest leading-none">Listing Mode Active</p>
                                <p className="text-[9px] font-medium text-amber-700 uppercase italic leading-relaxed">
                                    The sourcing engine was redirected to a single item page. For best results, AliExpress must be searched as a listing directory. 
                                    Try a broader keyword or use the Manual Capture below.
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <button onClick={performSourcing} className="w-full sm:w-auto px-16 py-6 bg-slate-950 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all transform hover:scale-105 italic flex items-center justify-center gap-4 shadow-2xl">
                                <RefreshCw size={20} className={loading ? "animate-spin" : ""} /> {loading ? "Searching..." : "Re-initiate Discovery"}
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
