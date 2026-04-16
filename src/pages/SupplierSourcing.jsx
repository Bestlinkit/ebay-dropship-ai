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
    const [manualSnapshot, setManualSnapshot] = useState("");
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
    const [telemetry, setTelemetry] = useState({ eprolo: null, aliexpress: null });
    const [showDebug, setShowDebug] = useState(false);

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
            setTelemetry(result.telemetry || { eprolo: null, aliexpress: null });
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
                productUrl: product.url,
                preFetchedProduct: product // 🚀 Pass full object to bypass blocked API calls
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

    const intelMatchTier = pipelineState.successfulTier;
    const isWaterfall = pipelineState.isFallback;

    const copyDiagnosticBundle = () => {
        const bundle = {
            timestamp: new Date().toISOString(),
            query: searchQuery,
            originalTarget: ebayProduct?.title,
            eprolo: {
                status: pipelineState.sources.eprolo,
                http: telemetry.eprolo?.httpStatus,
                itemsFound: rawResults.filter(r => r.source === 'eprolo').length,
                auth: telemetry.eprolo?.status
            },
            aliexpress: {
                status: pipelineState.sources.aliexpress,
                http: telemetry.aliexpress?.httpStatus,
                length: telemetry.aliexpress?.responseLength,
                blocks: telemetry.aliexpress?.blocksFound,
                method: telemetry.aliexpress?.method
            }
        };

        const text = `--- DROP-AI TECHNICAL DIAGNOSTIC SNAPSHOT ---\n` +
                     `Date: ${bundle.timestamp}\n` +
                     `Search Query: "${bundle.query}"\n` +
                     `Target: ${bundle.originalTarget}\n\n` +
                     `EPROLO STATUS: ${bundle.eprolo.status}\n` +
                     `EPROLO HTTP: ${bundle.eprolo.http}\n` +
                     `EPROLO AUTH: ${bundle.eprolo.auth}\n` +
                     `EPROLO ITEMS: ${bundle.eprolo.itemsFound}\n\n` +
                     `ALIEXPRESS STATUS: ${bundle.aliexpress.status}\n` +
                     `ALIEXPRESS HTTP: ${bundle.aliexpress.http}\n` +
                     `ALIEXPRESS METHOD: ${bundle.aliexpress.method}\n` +
                     `------------------------------------------\n` +
                     `Note to Support: Code Page / Signature Verification requested by Paul.`;

        navigator.clipboard.writeText(text);
        toast.success("Support Snapshot Copied", {
            description: "You can now paste this into your email to rick@eprolo.com"
        });
    };

    const DiagnosticHub = () => {
        if (!telemetry.eprolo && !telemetry.aliexpress) return null;
        
        return (
            <div className="bg-slate-950 rounded-[2.5rem] p-8 border border-slate-800 space-y-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                        <Activity size={18} className="text-emerald-500" />
                        <h3 className="text-xs font-black text-white uppercase tracking-widest italic">Technical Diagnostic Hub</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        {isWaterfall && <div className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-[8px] font-black uppercase tracking-tighter">Waterfall Recovery Active</div>}
                        <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[9px] font-black uppercase">Real-time Telemetry</div>
                    </div>
                </div>

                {/* --- INTENT TRACE (v11.0) --- */}
                <div className="p-5 bg-blue-500/5 rounded-2xl border border-blue-500/20 space-y-3">
                     <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Calculated Intent Query</h4>
                        <span className="text-[9px] font-black text-blue-300/50 uppercase italic tracking-tighter">Tier: {activeTier || intelMatchTier ? 'REACHED' : 'EXHAUSTING'}</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs font-black text-white italic">
                            "{searchQuery}"
                        </div>
                        <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                            Reduced from {ebayProduct?.title?.length} to {searchQuery.length} chars
                        </div>
                     </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* EPROLO TRACE */}
                    <div className="space-y-4 p-5 bg-slate-900/50 rounded-2xl border border-slate-800">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Node: Eprolo</span>
                            <span className={cn(
                                "text-[9px] font-black px-2 py-0.5 rounded uppercase",
                                pipelineState.sources.eprolo === 'SUCCESS' ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                            )}>{pipelineState.sources.eprolo}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-[9px] uppercase font-black tracking-tighter">
                            <div className="text-slate-500">HTTP STATUS: <span className="text-white ml-1">{telemetry.eprolo?.httpStatus || 'N/A'}</span></div>
                            <div className="text-slate-500">DATA POINTS: <span className="text-white ml-1">{rawResults.filter(r => r.source === 'eprolo').length}</span></div>
                            <div className="text-slate-500">MODE: <span className="text-white ml-1">DIRECT_API</span></div>
                            <div className="text-slate-500">AUTH: <span className={telemetry.eprolo?.status === 'AUTH_ERROR' ? "text-red-500" : "text-emerald-500"}>{telemetry.eprolo?.status === 'AUTH_ERROR' ? "FAILED" : "VERIFIED"}</span></div>
                        </div>
                    </div>

                    {/* ALIEXPRESS TRACE */}
                    <div className="space-y-4 p-5 bg-slate-900/50 rounded-2xl border border-slate-800">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Node: AliExpress</span>
                            <span className={cn(
                                "text-[9px] font-black px-2 py-0.5 rounded uppercase",
                                pipelineState.sources.aliexpress === 'SUCCESS' ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                            )}>{pipelineState.sources.aliexpress}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-[9px] uppercase font-black tracking-tighter">
                            <div className="text-slate-500">HTTP STATUS: <span className="text-white ml-1">{telemetry.aliexpress?.httpStatus || 'N/A'}</span></div>
                            <div className="text-slate-500">GATEWAY: <span className="text-white ml-1">{telemetry.aliexpress?.method === 'BRIDGE_GAS' ? 'TRUSTED_GAS' : 'NODE_PROXY'}</span></div>
                            <div className="text-slate-500">HTML SIZE: <span className="text-white ml-1">{(telemetry.aliexpress?.responseLength / 1024).toFixed(1)}KB</span></div>
                            <div className="text-slate-500">BLOCKAGE: <span className={pipelineState.sources.aliexpress === 'BLOCKED_RESPONSE' ? "text-red-500" : "text-emerald-500"}>{pipelineState.sources.aliexpress === 'BLOCKED_RESPONSE' ? "DETECTED" : "NONE"}</span></div>
                        </div>
                    </div>
                </div>

                {/* --- 🔌 TECHNICAL ALERT BANNERS --- */}
                {pipelineState.sources.eprolo === 'CONFIG_ERROR' && (
                    <div className="p-6 bg-red-600 border border-red-500 rounded-3xl flex items-center gap-6 shadow-xl animate-pulse">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white shrink-0">
                            <ShieldAlert size={24} />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-[11px] font-black text-white uppercase tracking-widest leading-none">Eprolo not configured</h4>
                            <p className="text-[10px] font-medium text-red-100 leading-relaxed uppercase leading-tight">
                                API Credentials (apiKey/secret) were not detected by the backend. Verify .env and restart server.
                            </p>
                        </div>
                    </div>
                )}

                {pipelineState.sources.aliexpress === 'BLOCKED_RESPONSE' && (
                    <div className="p-6 bg-amber-600 border border-amber-500 rounded-3xl flex items-center gap-6 shadow-xl">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white shrink-0">
                            <ShieldAlert size={24} />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-[11px] font-black text-white uppercase tracking-widest leading-none">AliExpress blocked request</h4>
                            <p className="text-[10px] font-medium text-amber-100 leading-relaxed uppercase leading-tight">
                                Anti-bot challenge detected. Switching to User-Driven Detail Flow.
                            </p>
                        </div>
                    </div>
                )}

                {pipelineState.sources.aliexpress === 'PARSE_FAILURE' && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-4">
                        <AlertTriangle size={16} className="text-red-500 shrink-0" />
                        <p className="text-[9px] font-black text-red-500 uppercase tracking-widest leading-relaxed">
                            Critical Alert: Extraction Layer Broken. AliExpress returned 200 OK but scraper failed to map attributes. Maintenance required.
                        </p>
                    </div>
                )}

                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                    <p className="text-[9px] font-medium text-slate-500">
                        Requested by Eprolo Tech? Export the code-page trace for verification.
                    </p>
                    <button 
                        onClick={copyDiagnosticBundle}
                        className="px-4 py-2 bg-emerald-500 text-slate-950 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-colors flex items-center gap-2"
                    >
                        <ExternalLink size={12} /> Copy Diagnostic Bundle
                    </button>
                </div>
            </div>
        );
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

                {!loading && (pipelineState.sources.aliexpress === 'BLOCKED' || pipelineState.sources.aliexpress === 'BLOCKED_RESPONSE' || pipelineState.sources.eprolo === 'FAILED') && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm mb-8">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                                    <ShieldAlert size={26} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-[11px] font-black text-amber-900 uppercase tracking-widest leading-none">Security Interruption Detected</h4>
                                    <p className="text-[10px] font-medium text-amber-700/80 max-w-md">
                                        {pipelineState.sources.aliexpress === 'BLOCKED' || pipelineState.sources.aliexpress === 'BLOCKED_RESPONSE'
                                            ? "AliExpress detection is strictly blocked by anti-bot measures. Switch to Global Scraper for browser-bypass discovery." 
                                            : "One or more supplier nodes are offline (API Error). Displaying available catalog matches."}
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

            {/* Diagnostic Button */}
            {!loading && (
                <div className="flex justify-end">
                    <button 
                        onClick={() => setShowDebug(!showDebug)} 
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                            showDebug ? "bg-slate-950 text-emerald-500" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        )}
                    >
                        {showDebug ? <ChevronRight className="rotate-90" size={14} /> : <Activity size={14} />}
                        Technical Diagnostic Trace
                    </button>
                </div>
            )}

            <AnimatePresence>
                {showDebug && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                        <DiagnosticHub />
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

                {/* 3. FALLBACK / EMPTY STATE */}
                {!loading && processedResults.length === 0 && (
                    <div className="bg-white border-2 border-dashed border-slate-200 p-20 rounded-[4rem] text-center space-y-10 shadow-2xl shadow-slate-100">
                        <div className={cn(
                            "w-24 h-24 border rounded-[3rem] flex items-center justify-center mx-auto shadow-inner",
                            pipelineState.status === 'TECHNICAL_FAILURE' ? "bg-red-50 border-red-100 text-red-300" : "bg-slate-50 border-slate-100 text-slate-300"
                        )}>
                            {pipelineState.status === 'TECHNICAL_FAILURE' ? <AlertTriangle size={48} /> : <Box size={48} />}
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black text-slate-950 italic tracking-tighter uppercase leading-tight">
                                {pipelineState.status === 'TECHNICAL_FAILURE' ? "SOURCE CONNECTION FAULT" : "BROADER CATEGORY SEARCH ONLY"}
                            </h3>
                            <div className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed font-medium">
                                {pipelineState.status === 'TECHNICAL_FAILURE' ? (
                                    <>
                                        One or more supplier nodes are reporting a technical configuration or security error. 
                                        <br />
                                        <span className="text-red-600 font-bold uppercase text-xs tracking-widest">
                                            Fault Type: {pipelineState.sources.eprolo === 'CONFIG_ERROR' ? 'Eprolo Not Configured' : 
                                                        pipelineState.sources.aliexpress === 'BLOCKED_RESPONSE' ? 'AliExpress Blocked Request' : 'Extraction Failure'}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        We've analyzed the query intent and determined that exact matches are currently unavailable across our supply chain. 
                                        <br />
                                        <span className="text-slate-950 font-bold">Try searching for the basic category (soap, watch, etc) instead.</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {pipelineState.sources.aliexpress === 'BLOCKED_RESPONSE' && (
                            <div className="max-w-md mx-auto p-8 bg-amber-50 border border-amber-100 rounded-[2.5rem] space-y-6">
                                <p className="text-[11px] font-black text-amber-900 uppercase tracking-widest leading-none">AliExpress Discovery Suspended</p>
                                
                                <div className="space-y-4">
                                     <button 
                                        onClick={() => window.open(sourcingService.getGlobalSearchUrl('aliexpress', searchQuery), '_blank')}
                                        className="w-full py-5 bg-amber-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-amber-700 transition-all flex items-center justify-center gap-3"
                                    >
                                        <ExternalLink size={16} /> 1. Find Product Manually
                                    </button>
                                    
                                    <div className="pt-4 border-t border-amber-200 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">2. Sync Snapshot</p>
                                            {manualSnapshot.length > 0 && (
                                                <button 
                                                    onClick={() => handleManualImport(manualSnapshot)}
                                                    className="px-3 py-1 bg-amber-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all flex items-center gap-2"
                                                >
                                                    <Zap size={10} /> Capture Intelligence
                                                </button>
                                            )}
                                        </div>
                                        <div className="group relative">
                                            <textarea 
                                                value={manualSnapshot}
                                                onChange={(e) => setManualSnapshot(e.target.value)}
                                                placeholder="Paste page content or JSON here..."
                                                className="w-full h-24 bg-white border-2 border-amber-200 rounded-xl p-4 text-[10px] font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 transition-all outline-none"
                                            />
                                            {manualSnapshot.length === 0 && (
                                                <div className="absolute top-2 right-2 px-2 py-1 bg-amber-100 text-amber-600 rounded text-[8px] font-black uppercase">Paste to Start</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[9px] font-medium text-amber-700 uppercase italic leading-relaxed">
                                    Anti-bot protection active. Visit AliExpress, copy the product page content (Ctrl+A -> Ctrl+C), and paste it here to extract 100% accurate data.
                                </p>
                            </div>
                        )}

                        {/* DIAGNOSTIC HIGHLIGHT FOR NON-DEBUGS */}
                        {!showDebug && (
                            <div className="max-w-md mx-auto grid grid-cols-2 gap-4">
                               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                  <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-1">Eprolo Status</p>
                                  <p className={cn("text-[11px] font-black uppercase", pipelineState.sources.eprolo === 'SUCCESS' ? "text-emerald-500" : "text-amber-500")}>
                                     {pipelineState.sources.eprolo?.replace('_', ' ')}
                                  </p>
                               </div>
                               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                  <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-1">AliExpress Status</p>
                                  <p className={cn("text-[11px] font-black uppercase", pipelineState.sources.aliexpress === 'SUCCESS' ? "text-emerald-500" : "text-red-500")}>
                                     {pipelineState.sources.aliexpress?.replace('_', ' ')}
                                  </p>
                               </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <button onClick={() => navigate('/discovery')} className="w-full sm:w-auto px-12 py-5 border-2 border-slate-950 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-950 hover:text-white transition-all transform hover:scale-105 italic">Optimize Strategy</button>
                            
                            <div className="flex flex-col gap-3 w-full sm:w-auto">
                                <button 
                                    onClick={() => window.open(sourcingService.getGlobalSearchUrl('eprolo', searchQuery), '_blank')} 
                                    className="w-full bg-emerald-500 text-white px-12 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
                                >
                                    <Globe size={18} /> Search Eprolo Catalog
                                </button>
                                <button 
                                    onClick={handleExpandSearch} 
                                    className="w-full bg-slate-950 text-white px-12 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
                                >
                                    <Activity size={18} /> Forced Global Search
                                </button>
                            </div>
                        </div>

                        {/* WORKFLOW EDUCATION */}
                        <div className="mt-12 p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-start gap-6 text-left">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm border border-blue-100 shrink-0">
                                <Info size={24} />
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest leading-none">Strategy Tip: Eprolo Sync Workflow</h4>
                                <p className="text-[11px] font-medium text-blue-700/80 leading-relaxed">
                                    The Eprolo API primarily searches your <span className="font-bold">Import List</span>. If a product exists in the catalog but doesn't show up here, follow this path:
                                    <br />
                                    <span className="inline-block mt-2 font-black text-blue-900">
                                        Eprolo Website → Search Catalog → Add to Import List → Sync
                                    </span>
                                </p>
                            </div>
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
