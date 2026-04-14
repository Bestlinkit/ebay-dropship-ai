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
  ShieldQuestion,
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
  Hash,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import eproloService from '../services/eprolo';
import aliexpressService from '../services/aliexpress';
import sourcingService from '../services/sourcing';
import { toast } from 'sonner';

/**
 * Supplier Sourcing Hub (v1.2 Failsafe Patched)
 * Decision-Grade sourcing engine with automated recovery and platform redundancy.
 */
const SupplierSourcing = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const targetProduct = location.state?.product;

    // 🧠 SMART STATE MACHINE (v1.2)
    const [sourcingState, setSourcingState] = useState('searching_eprolo'); 
    const [searchQuery, setSearchQuery] = useState(targetProduct?.title || '');
    const [loading, setLoading] = useState(true);
    const [rawResults, setRawResults] = useState([]);
    const [extracting, setExtracting] = useState(false);
    const [confirmModal, setConfirmModal] = useState(null);

    // ⏲️ HYBRID FALLBACK TIMER (Step 1)
    const [countdown, setCountdown] = useState(null);
    const [timerActive, setTimerActive] = useState(false);

    // 🔄 HYBRID FLOW ENGINE (Step 1 & 4)
    useEffect(() => {
        let timer;
        if (timerActive && countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        } else if (timerActive && countdown === 0) {
            setTimerActive(false);
            setSourcingState('switching_to_fallback');
            // Auto-trigger AliExpress after countdown
            setTimeout(() => performSourcing('ALIEXPRESS'), 500);
        }
        return () => clearTimeout(timer);
    }, [countdown, timerActive]);

    // 1. ENGINE: Multi-Platform Sourcing Sequence (v1.2 Failsafe)
    const performSourcing = useCallback(async (platform = 'EPROLO', customQuery = null) => {
        if (!targetProduct) return;
        
        // 🎯 MANDATORY DIAGNOSTIC LOGS
        console.log("SOURCE PLATFORM:", platform);
        
        const query = customQuery || searchQuery;
        if (rawResults.length === 0) setLoading(true);
        setTimerActive(false); 
        
        setSourcingState(platform === 'EPROLO' ? 'searching_eprolo' : 'searching_aliexpress');
        console.log("STATE TRANSITION:", platform === 'EPROLO' ? 'searching_eprolo' : 'searching_aliexpress');
        
        try {
            let matches = [];
            if (platform === 'EPROLO') {
                matches = await eproloService.searchProducts(query);
                console.log("RAW RESPONSE:", matches);
                
                if (matches.length === 0) {
                    console.warn("[WATERFALL] Eprolo empty. Escalating to AliExpress discovery...");
                    setSourcingState('eprolo_no_results');
                    setCountdown(2); 
                    setTimerActive(true);
                    setLoading(false);
                    // Explicit background trigger (v1.2 Patched)
                    setTimeout(() => performSourcing('ALIEXPRESS'), 500);
                    return;
                }
                setSourcingState('eprolo_results');
            } else {
                matches = await aliexpressService.searchProducts(query);
                console.log("RAW RESPONSE:", matches);
                
                if (matches.length === 0) {
                    setSourcingState(rawResults.length > 0 ? 'aliexpress_no_results_merged' : 'aliexpress_no_results');
                    setLoading(false);
                    return;
                }
                setSourcingState('aliexpress_results');
            }

            // 🧱 SCHEMA HARMONIZATION (image instead of thumbnail)
            const mappedMatches = matches.map(m => ({
                ...m,
                image: m.image || m.thumbnail
            }));
            console.log("MAPPED PRODUCTS:", mappedMatches);

            // 🔄 RESULT MERGING RULE
            setRawResults(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const uniqueNewMatches = mappedMatches.filter(m => !existingIds.has(m.id));
                return platform === 'EPROLO' ? [...uniqueNewMatches, ...prev] : [...prev, ...uniqueNewMatches];
            });
            
        } catch (e) {
            console.error(`[Sourcing Error] ${platform}:`, e);
            
            if (platform === 'EPROLO') {
                toast.error(`Eprolo Node Failure: ${e.message}. Initiating AliExpress fallback...`, { duration: 3000 });
                setSourcingState('eprolo_error');
                setCountdown(2); 
                setTimerActive(true);
                // Explicit backup trigger on catch
                setTimeout(() => performSourcing('ALIEXPRESS'), 500); 
            } else {
                setSourcingState('aliexpress_error');
                toast.error(`Sourcing Exhausted: ${e.message}`);
            }
        } finally {
            setLoading(false);
        }
    }, [targetProduct, searchQuery, rawResults.length]);

    useEffect(() => { performSourcing(); }, []);

    // 2. INTELLIGENCE LAYER: Validation & decision-grade scoring
    const processedResults = useMemo(() => {
        if (!targetProduct || rawResults.length === 0) return [];
        
        return rawResults
            .map(res => {
                const relevance = sourcingService.calculateMatchRelevance(targetProduct, res);
                const roiRange = sourcingService.calculateSupplierROIRange(targetProduct.price, res.price + (res.shipping || 0));
                const trust = sourcingService.evaluateSupplierTrust(res);
                
                const hasVariantWarning = !targetProduct.title.toLowerCase().split(' ').every(w => 
                    w.length < 4 || res.title.toLowerCase().includes(w)
                );

                return { ...res, relevance, roiRange, trust, hasVariantWarning };
            })
            // Soften filter to allow user more choices in recovery flow
            .filter(res => res.relevance >= 35) 
            .sort((a, b) => b.relevance - a.relevance);
    }, [rawResults, targetProduct]);

    const bestOption = useMemo(() => sourcingService.identifyBestOption(processedResults), [processedResults]);

    const suggestedKeywords = useMemo(() => 
        sourcingService.generateSuggestedKeywords(targetProduct?.title), 
    [targetProduct]);

    const handleModifySearch = (newQuery) => {
        setRawResults([]); // 🔥 CLEAR for manual search reset
        setSearchQuery(newQuery);
        performSourcing('EPROLO', newQuery); // Always start from Eprolo for new queries
    };

    const handleContinue = (supplierProduct) => {
        setConfirmModal(supplierProduct);
    };

    const finalizeImport = async (supplierProduct) => {
        setExtracting(true);
        const loadingId = toast.loading("Extracting real product data from supplier chain...");
        
        try {
            // ⚡ EXTRACTION MUST BE COMPLETE (NO PARTIAL DATA)
            let fullProduct;
            if (supplierProduct.source === 'Eprolo') {
                fullProduct = await eproloService.getProductDetail(supplierProduct.id);
            } else {
                fullProduct = await aliexpressService.getProductDetail(supplierProduct.id);
            }

            // Structured storage and navigation to preview
            toast.dismiss(loadingId);
            toast.success("Extraction complete! Reviewing product specs.");
            
            navigate('/product-import-preview', { 
                state: { 
                    product: {
                        ...fullProduct,
                        pricing: {
                            ...fullProduct.pricing,
                            basePrice: targetProduct.price // Pass through target eBay price
                        }
                    } 
                } 
            });
        } catch (error) {
            toast.dismiss(loadingId);
            toast.error(error.message || "Unable to retrieve full product details. Please try another supplier.");
            console.error("[EXTRACTION FAILURE]", error);
        } finally {
            setExtracting(false);
        }
    };

    if (!targetProduct) {
        return <div className="p-20 text-center">No market node selected. Return to Discovery.</div>;
    }

    const isSourcingAli = sourcingState.startsWith('ali');
    const hasResults = processedResults.length > 0;
    const isError = sourcingState.endsWith('_error');
    const isNoResults = sourcingState.endsWith('_no_results');

    return (
        <div className="max-w-[1300px] mx-auto space-y-12 pb-40 px-6 animate-in fade-in duration-700">
            
            {/* 🧭 NAVIGATION & TARGET CONTEXT */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="w-14 h-14 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all bg-slate-900/50">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Supplier Sourcing.</h1>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                            {loading ? <RefreshCw size={12} className="animate-spin text-emerald-500" /> : <Activity size={12} className="text-emerald-500" />}
                            Current Engine: <span className="text-white italic">{sourcingState.replace('_', ' ')}</span>
                        </p>
                    </div>
                </div>

                {/* TARGET CONTEXT CARD */}
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] flex items-center gap-6 shadow-2xl">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/5 shrink-0">
                        <img src={targetProduct.thumbnail || targetProduct.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Target Selection</p>
                        <p className="text-[11px] font-black text-white line-clamp-1 max-w-[200px]">{targetProduct.title}</p>
                        <p className="text-lg font-black text-emerald-500 italic leading-none">${targetProduct.price.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* 🔍 SOURCING FEED (v1.2 Patched: Non-Blocking) */}
            <div className="space-y-8">
                <SourcingStatusHeader 
                    state={sourcingState} 
                    loading={loading}
                    timerActive={timerActive}
                    countdown={countdown}
                    resultsCount={processedResults.length}
                    onCancel={() => setTimerActive(false)}
                />

                {/* Always show results if they exist, never blank the UI */}
                {hasResults ? (
                    <div className="grid grid-cols-1 gap-6 pb-20">
                        {processedResults.map(res => (
                            <SupplierResultRow 
                                key={`${res.source}-${res.id}`} 
                                product={res} 
                                targetPrice={targetProduct.price}
                                isBest={bestOption?.id === res.id}
                                onContinue={handleContinue}
                            />
                        ))}
                    </div>
                ) : loading ? (
                    <div className="space-y-6">
                        {Array(3).fill(0).map((_, i) => (
                           <div key={i} className="h-40 bg-slate-900/50 rounded-[2.5rem] animate-pulse border border-slate-800/30" />
                        ))}
                    </div>
                ) : (isNoResults || isError || sourcingState === 'switching_to_fallback') && (
                    <RecoveryView 
                        state={sourcingState} 
                        query={searchQuery}
                        suggested={suggestedKeywords}
                        countdown={countdown}
                        timerActive={timerActive}
                        onRetry={() => performSourcing(sourcingState.startsWith('ali') ? 'ALIEXPRESS' : 'EPROLO')}
                        onSwitch={() => performSourcing(sourcingState.startsWith('ali') ? 'EPROLO' : 'ALIEXPRESS')}
                        onCancel={() => setTimerActive(false)}
                        onModify={handleModifySearch}
                    />
                )}

                {/* Final Fallback if everything truly finished with zero results */}
                {!hasResults && !loading && !timerActive && sourcingState === 'aliexpress_no_results' && (
                    <div className="py-20 text-center space-y-6">
                         <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto text-slate-700">
                             <ShieldAlert size={40} />
                         </div>
                         <div className="space-y-2">
                             <h4 className="text-xl font-black text-white italic uppercase">Total Sourcing Exhausted</h4>
                             <p className="text-slate-500 text-sm max-w-md mx-auto">Neither supplier platform returned a viable match for this market node. Try broader keywords.</p>
                         </div>
                         <button onClick={() => handleModifySearch(suggestedKeywords)} className="bg-white text-slate-950 px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all">
                             Try Suggested Keywords
                         </button>
                    </div>
                )}
            </div>

            {/* CONFIRMATION MODAL (v1.1 SAFETY CHECK) */}
            <AnimatePresence>
                {confirmModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-950 border border-slate-800 p-12 rounded-[3.5rem] max-w-xl w-full shadow-[0_0_100px_rgba(34,197,94,0.1)] text-center space-y-10"
                        >
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-950 mx-auto shadow-2xl">
                                <CheckCircle2 size={32} />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">Commit Choice?</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    You are selecting this <span className="text-white font-bold">{confirmModal.source}</span> product for store import. This will lock in your profit baseline of <span className="text-emerald-500 font-bold">{confirmModal.roiRange?.expected}% ROI</span>.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={() => setConfirmModal(null)} className="flex-1 py-5 border border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all">
                                    Back to Sourcing
                                </button>
                                <button 
                                    onClick={() => { finalizeImport(confirmModal); setConfirmModal(null); }}
                                    className="flex-1 py-5 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-xl"
                                >
                                    Confirm Import
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

/**
 * Recovery UI Layer (v1.2)
 * Handles soft failures, manual keyword overrides, and platform fallbacks.
 */
const RecoveryView = ({ state, query, suggested, countdown, timerActive, onRetry, onSwitch, onCancel, onModify }) => {
    const [localQuery, setLocalQuery] = useState(query);
    const isError = state.endsWith('_error');
    const isAli = state.startsWith('ali');
    const isSwitching = state === 'switching_to_fallback';

    const title = isSwitching
        ? "Switching Platforms..."
        : isError 
            ? "Supplier Connection Unstable" 
            : `No ${isAli ? 'AliExpress' : 'Eprolo'} Match Detected`;
        
    const description = isSwitching
        ? "Applying search context to fallback supplier chain..."
        : isError 
            ? "The supplier bridge is experiencing high latency. Searching alternative supplier sources..."
            : `No strong supplier match found yet — try a different search or switch to ${isAli ? 'Eprolo' : 'AliExpress'} sourcing.`;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-slate-800 p-12 rounded-[3.5rem] text-center space-y-10 shadow-3xl"
        >
            <div className={cn(
                "w-20 h-20 rounded-[2.5rem] flex items-center justify-center mx-auto border",
                isSwitching ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                isError ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-amber-500/10 border-amber-500/20 text-amber-500"
            )}>
                {isSwitching ? <RefreshCw size={40} className="animate-spin" /> : 
                 isError ? <AlertCircle size={40} /> : <ShieldAlert size={40} />}
            </div>

            <div className="space-y-3">
                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{title}</h3>
                <p className="text-slate-500 max-w-lg mx-auto text-sm leading-relaxed">
                    {description}
                </p>
                
                {/* ⏳ AUTO-TRIGGER INDICATOR (Step 1) */}
                {timerActive && countdown > 0 && !isAli && (
                    <div className="pt-4 flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 text-emerald-500 text-[9px] font-black uppercase tracking-[0.2em] animate-pulse">
                            Auto-triggering AliExpress in {countdown}s
                        </div>
                        <button 
                            onClick={onCancel}
                            className="text-[8px] font-black text-slate-700 hover:text-rose-500 uppercase tracking-widest transition-colors border-b border-transparent hover:border-rose-500/50"
                        >
                            Stop Auto-Search
                        </button>
                    </div>
                )}
            </div>

            {/* ✏️ MODIFY KEYWORDS (Step 2) */}
            <div className="max-w-md mx-auto space-y-4">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                        <Hash size={16} />
                    </div>
                    <input 
                        type="text" 
                        value={localQuery}
                        onChange={(e) => setLocalQuery(e.target.value)}
                        placeholder="Modify product keywords..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-5 pl-12 pr-6 text-sm text-white placeholder-slate-700 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                    />
                </div>
                {suggested && suggested !== localQuery && (
                    <button 
                        onClick={() => { setLocalQuery(suggested); onModify(suggested); }}
                        className="text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-emerald-500 transition-colors flex items-center gap-2 mx-auto"
                    >
                        <Zap size={10} /> Suggestion: <span className="text-slate-400 italic">{suggested}</span>
                    </button>
                )}
            </div>

            {/* USER OPTIONS (Step 2) */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <button 
                    onClick={() => onModify(localQuery)}
                    className="px-10 py-5 border border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-3"
                >
                    <Search size={16} /> Modify Search
                </button>
                
                <button 
                    onClick={onRetry}
                    className="px-10 py-5 border border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-3"
                >
                    <RefreshCw size={16} /> Retry Original
                </button>

                <button 
                    onClick={onSwitch}
                    className="px-10 py-5 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-500 hover:text-white transition-all transform active:scale-95 shadow-2xl"
                >
                    <Globe size={16} /> Force {isAli ? 'Eprolo' : 'AliExpress'}
                </button>
            </div>
        </motion.div>
    );
};

/**
 * Supplier Row Component (v1.1 Decision Engine Layout)
 */
const SupplierResultRow = ({ product, targetPrice, isBest, onContinue }) => {
    const extracting = false; // Internal state for this row if needed
    
    return (
        <motion.div 
            whileHover={{ y: -2 }}
            className={cn(
                "group relative bg-[#111C33] border p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-10 transition-all",
                isBest ? "border-emerald-500/50 shadow-[0_20px_60px_rgba(34,197,94,0.1)]" : "border-[#2A3A55] hover:border-slate-700"
            )}
        >
            {isBest && (
                <div className="absolute -top-4 left-10 px-4 py-1.5 bg-emerald-500 rounded-full flex items-center gap-2 text-[8px] font-black text-white uppercase tracking-widest shadow-lg">
                    <Star size={10} className="fill-white" /> Best Supplier Option
                </div>
            )}

            {/* PRODUCT VISUAL */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] overflow-hidden border border-white/5 shrink-0 shadow-2xl">
                <img src={product.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>

            {/* DATA CORE */}
            <div className="flex-1 min-w-0 space-y-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <span className={cn(
                            "px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border",
                            product.source === 'Eprolo' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                        )}>
                            {product.source} Source
                        </span>
                        {product.hasVariantWarning && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 text-yellow-500 rounded-md text-[7px] font-black uppercase tracking-widest border border-yellow-500/20">
                                <AlertTriangle size={8} /> Variation may differ
                            </div>
                        )}
                    </div>
                    <h3 className="text-[13px] font-black text-white uppercase tracking-tight line-clamp-1">{product.title}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-8 md:gap-12">
                    <div className="flex flex-col">
                        <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Base Cost</span>
                        <span className="text-xl font-black text-white italic tracking-tighter">${product.price.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Shipping</span>
                        <span className="text-[11px] font-black text-slate-400 whitespace-nowrap">
                            {product.shipping > 0 ? `$${product.shipping.toFixed(2)}` : 'FREE'} ({product.delivery})
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Ships From</span>
                        <span className="text-[11px] font-black text-white">{product.shipsFrom}</span>
                    </div>
                </div>
            </div>

            {/* DECISION MATRIX */}
            <div className="flex items-center gap-10 shrink-0 border-t md:border-t-0 md:border-l border-slate-800/50 pt-6 md:pt-0 md:pl-10 w-full md:w-auto justify-between md:justify-end">
                <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">ROI Range</span>
                    <div className="text-center">
                        <span className="text-2xl font-black text-emerald-500 italic tracking-tighter leading-none">
                            {product.roiRange?.conservative}% – {product.roiRange?.expected}%
                        </span>
                        <p className="text-[6px] font-black text-slate-700 uppercase tracking-widest mt-1">Estimated Return</p>
                    </div>
                </div>

                <div className="flex flex-col gap-2.5">
                    <div className={cn(
                        "px-3 py-1.5 rounded-xl border flex items-center gap-2",
                        product.trust === 'High' ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500" : "bg-slate-900 border-slate-800 text-slate-500"
                    )}>
                        <ShieldCheck size={14} />
                        <span className="text-[8px] font-black uppercase tracking-widest">Reliability: {product.trust}</span>
                    </div>
                    <button 
                        onClick={() => onContinue(product)}
                        className={cn(
                            "px-10 py-4 bg-white text-slate-950 hover:bg-emerald-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 group/btn"
                        )}
                    >
                        Continue 
                        <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

/**
 * Sourcing Status Header (v1.2 Patched)
 * Inline status bar that replaces the blocking full-page messages.
 */
const SourcingStatusHeader = ({ state, loading, timerActive, countdown, resultsCount, onCancel }) => {
    const isAli = state.startsWith('ali');
    const isSwitching = state === 'switching_to_fallback';
    const isError = state.endsWith('_error');

    return (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800 pb-8">
            <div className="flex items-center gap-4">
                <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                    loading || isSwitching ? "bg-emerald-500/20 text-emerald-500 animate-pulse" : 
                    isError ? "bg-rose-500/20 text-rose-500" : "bg-slate-900 text-slate-500"
                )}>
                    {loading || isSwitching ? <RefreshCw size={20} className="animate-spin" /> : <Activity size={20} />}
                </div>
                <div>
                    <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">
                        {isAli ? 'AliExpress' : 'Eprolo'} Discovery
                    </h2>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">
                        Engine Status: <span className={cn(loading ? "text-emerald-500" : "text-slate-400")}>
                            {state.replace('_', ' ')}
                        </span>
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
                {/* 📊 RESULT COUNTER */}
                <div className="px-5 py-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
                    <Package size={14} className="text-slate-500" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                        {resultsCount} Matches Found
                    </span>
                </div>

                {/* ⏳ ADAPTIVE FALLBACK INDICATOR */}
                {timerActive && countdown > 0 && (
                    <div className="px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Zap size={14} className="text-emerald-500 fill-emerald-500" />
                            <span className="text-[9px] font-black text-white uppercase tracking-widest">
                                Auto-triggering AliExpress in {countdown}s
                            </span>
                        </div>
                        <button 
                            onClick={onCancel}
                            className="bg-white/10 hover:bg-rose-500/20 text-white/40 hover:text-rose-500 px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {/* 🔌 CONNECTION TYPE */}
                <div className="flex items-center gap-3 text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] bg-slate-950/50 px-4 py-2 rounded-lg border border-white/5">
                    <Globe size={12} />
                    {isAli ? 'Global Direct' : 'USA Priority Sourcing'}
                </div>
            </div>
        </div>
    );
};

export default SupplierSourcing;
