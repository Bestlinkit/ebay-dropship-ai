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
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import eproloService from '../services/eprolo';
import sourcingService from '../services/sourcing';
import { toast } from 'sonner';

// 🏗️ MODULAR COMPONENTS
import SourcingStatusHeader from '../components/sourcing/SourcingStatusHeader';
import SupplierResultRow from '../components/sourcing/SupplierResultRow';

/**
 * Eprolo Supplier Sourcing (v3.0)
 * Direct API bridge for verified supplier discovery.
 */
const SupplierSourcing = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // SAFE READ: Handle both legacy and new standardized payloads
    const ebayProduct = location?.state?.ebayProduct || location?.state?.product || null;
    const initialQuery = location.state?.query || ebayProduct?.title || '';
    
    const targetProduct = ebayProduct; // Maintain logic compatibility

    const [loading, setLoading] = useState(true);
    const [rawResults, setRawResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [extracting, setExtracting] = useState(false);
    const [confirmModal, setConfirmModal] = useState(null);
    const [showAliExpansion, setShowAliExpansion] = useState(false);

    const [fullInquiryResult, setFullInquiryResult] = useState(null);
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 4;

    // 💡 INITIALIZATION ROOT: Ensure variables are declared before hook usage
    const targetPrice = targetProduct?.price || 0;

    // 1. ENGINE: Eprolo API Only (Enhanced Resilience)
    const performSourcing = useCallback(async (query = searchQuery) => {
        if (!targetProduct || !query?.trim()) return;
        
        setLoading(true);
        setFullInquiryResult(null);
        console.info(`[Direct Sourcing] Inquiring Eprolo API for: ${query}`);
        
        try {
            const result = await eproloService.searchProducts(query);
            setFullInquiryResult(result);
            setRawResults(result.data || []);
            
            if (result.status === 'AUTH_FAILURE' || result.status === 'ERROR') {
                toast.error(`Eprolo Bridge Fault: ${result.message || 'Authentication Failed'}`);
            }
        } catch (e) {
            console.error(`[Direct Sourcing] API Connection Failure:`, e);
            toast.error(`Eprolo API connection failed.`);
        } finally {
            setLoading(false);
        }
    }, [targetProduct?.id, searchQuery]);

    // FIX: Guarded auto-fire on mount
    useEffect(() => { 
        if (searchQuery?.trim()) {
            performSourcing(); 
        }
    }, [targetProduct?.id]);

    // 2. INTELLIGENCE LAYER: ROI CALCULATED PER-ITEM (DETERMINISTIC)
    const processedResults = useMemo(() => {
        if (!targetProduct || rawResults.length === 0) return [];
        
        return rawResults
            .map(raw => {
                const res = sourcingService.normalize(raw, 'eprolo');
                const relevance = sourcingService.calculateMatchRelevance(targetProduct, res);
                
                // 🛡️ ROI SAFETY (IRON SHIELD v6.1)
                const cost = res.price;
                const sellingPrice = targetProduct.price || targetPrice;
                
                let roiValue = null;
                let expectedProfit = null;

                if (cost && cost > 0 && sellingPrice && sellingPrice > 0) {
                    expectedProfit = sellingPrice - cost - (sellingPrice * 0.12) - 0.30;
                    roiValue = Math.round((expectedProfit / cost) * 100);
                }

                return { 
                    ...res, 
                    relevance, 
                    roi: roiValue,
                    profit: expectedProfit,
                    roiRange: { expected: roiValue } // Backwards compatibility for UI components
                };
            })
            .filter(res => res.relevance >= 35)
            .sort((a, b) => b.relevance - a.relevance);
    }, [rawResults, targetProduct, targetPrice]);

    const paginatedResults = useMemo(() => {
        return processedResults.slice(0, page * PAGE_SIZE);
    }, [processedResults, page]);

    const bestOption = useMemo(() => sourcingService.identifyBestOption(processedResults), [processedResults]);

    const handleContinue = (supplierProduct) => {
        setConfirmModal(supplierProduct);
    };

    const finalizeImport = async (supplierProduct) => {
        setExtracting(true);
        const loadingId = toast.loading("Syncing with supplier...");
        try {
            const fullProduct = await eproloService.getProductDetail(supplierProduct.id);
            navigate('/product-import-preview', { 
                state: { 
                    product: {
                        ...fullProduct,
                        pricing: { ...fullProduct.pricing, basePrice: targetPrice }
                    } 
                } 
            });
            toast.success("Intelligence extraction complete.");
        } catch (error) {
            toast.error("Unable to retrieve full details.");
        } finally {
            toast.dismiss(loadingId);
            setExtracting(false);
        }
    };

    const handleExpandSearch = () => {
        setShowAliExpansion(true);
    };

    if (!targetProduct) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-8 bg-[#0B1220] text-center p-10">
                <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-[2rem] flex items-center justify-center text-slate-700">
                    <AlertCircle size={40} />
                </div>
                <div className="space-y-4">
                    <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Missing Product Context</h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto">
                        Inquiry source not detected. Return to the Discovery hub to initiate a new sourcing request.
                    </p>
                </div>
                <button 
                    onClick={() => navigate('/discovery')} 
                    className="px-10 py-5 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-500 hover:text-white transition-all shadow-3xl"
                >
                    Return to Discovery <ArrowRight size={14} />
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-[1300px] mx-auto space-y-12 pb-40 px-6 animate-in fade-in duration-700">
            
            {/* 🧭 NAVIGATION */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 p-10 bg-[#0B1220] border border-[#2A3A55] rounded-[3rem] shadow-2xl">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="w-14 h-14 rounded-2xl border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all bg-slate-900/50">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 bg-white/10 rounded-xl overflow-hidden border border-white/10">
                                <img src={targetProduct?.image} className="w-full h-full object-cover" alt="Focus" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-emerald-400 italic tracking-tighter uppercase leading-none">Eprolo Discovery</h1>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                                    <ShieldCheck size={12} className="text-emerald-500" /> Secure API Bridge
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-700/50 p-6 rounded-[2rem] flex items-center gap-6">
                    <img src={targetProduct.image} alt="" className="w-16 h-16 rounded-xl border border-white/10 object-cover shadow-lg" />
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Benchmark Price</p>
                        <p className="text-lg font-black text-emerald-400 italic leading-none">
                            {targetPrice ? `$${targetPrice.toFixed(2)}` : 'N/A'}
                        </p>
                    </div>
                </div>
            </div>

            {/* 🔍 STATUS BAR */}
            <SourcingStatusHeader 
                state={loading ? 'searching' : 'results'} 
                loading={loading}
                resultsCount={processedResults.length}
                isGlobal={false}
            />

            {/* 🏗️ SOURCING FEED */}
            <div className="space-y-8">
                {loading ? (
                    <div className="space-y-6">
                        {Array(3).fill(0).map((_, i) => (
                           <div key={i} className="h-40 bg-slate-900/50 rounded-[2.5rem] animate-pulse border border-slate-800/30" />
                        ))}
                    </div>
                ) : processedResults.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                        {paginatedResults.map(res => (
                            <SupplierResultRow 
                                key={res.id} 
                                product={res} 
                                targetPrice={targetPrice}
                                isBest={bestOption?.id === res.id}
                                onContinue={handleContinue}
                            />
                        ))}
                        
                        {processedResults.length > paginatedResults.length && (
                             <button 
                                onClick={() => setPage(p => p + 1)}
                                className="w-full py-8 bg-[#111C33] border border-[#2A3A55] text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest hover:border-slate-500 transition-all shadow-xl font-inter"
                             >
                                 Show next {Math.min(PAGE_SIZE, processedResults.length - paginatedResults.length)} opportunities
                             </button>
                        )}

                        {/* 💡 UPSORT: Option to expand */}
                        <div className="mt-10 p-10 bg-slate-950 border border-slate-800 rounded-[3rem] text-center space-y-4 shadow-3xl">
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Need more variety or lower pricing?</p>
                             <button 
                                onClick={handleExpandSearch}
                                className="text-[11px] font-black text-white px-8 py-4 bg-slate-900 hover:bg-[#0B1220] rounded-xl transition-all uppercase tracking-widest border border-white/5"
                             >
                                 Search AliExpress Manually
                             </button>
                        </div>
                    </div>
                ) : fullInquiryResult?.status === 'BLOCKED' ? (
                    <div className="bg-slate-900/50 border border-slate-800 p-16 rounded-[4rem] text-center space-y-10">
                        <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-[2.5rem] flex items-center justify-center mx-auto">
                            <Globe size={40} />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Connection Interrupted</h3>
                            <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">
                                AliExpress has temporarily blocked automated access (Anti-Bot Triggered).
                            </p>
                        </div>
                        <button 
                            onClick={() => performSourcing()}
                            className="bg-white text-slate-950 px-12 py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500 hover:text-white transition-all shadow-3xl flex items-center gap-3 mx-auto"
                        >
                            <RefreshCw size={16} /> Retry Global Search
                        </button>
                    </div>
                ) : fullInquiryResult?.status === 'ERROR' || fullInquiryResult?.status === 'NETWORK_ERROR' ? (
                    <div className="bg-rose-950/20 border border-rose-900/30 p-16 rounded-[4rem] text-center space-y-10">
                        <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-[2.5rem] flex items-center justify-center mx-auto">
                            <AlertTriangle size={40} />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Bridge Integrity Fault</h3>
                            <div className="text-left space-y-2">
                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest px-4">Diagnostic Context:</p>
                                <pre className="text-slate-500 max-w-xl mx-auto text-[10px] font-mono bg-black/40 p-6 rounded-3xl border border-white/5 overflow-auto max-h-40 scrollbar-hide">
                                    {JSON.stringify(fullInquiryResult.debugInfo, null, 2)}
                                </pre>
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                             <button 
                                onClick={() => performSourcing()}
                                className="bg-white text-slate-950 px-12 py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500 hover:text-white transition-all shadow-3xl"
                             >
                                Re-sync Discovery Pipe
                             </button>
                             <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Protocol Alpha v6.3 Active</p>
                        </div>
                    </div>
                ) : fullInquiryResult?.status === 'EMPTY' ? (
                /* 🎯 GUIDED UI */
                    <div className="bg-slate-900/50 border border-slate-800 p-16 rounded-[4rem] text-center space-y-10 animate-in slide-in-from-bottom-10 fade-in duration-1000">
                        <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-[2.5rem] flex items-center justify-center mx-auto">
                            <ShieldAlert size={40} />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">No matching results on Eprolo</h3>
                            <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">
                                We couldn’t find a direct match in the Eprolo catalog for this selection.
                                <br />
                                <span className="text-slate-300 font-bold">You can perform a manual global search instead.</span>
                            </p>
                        </div>

                        <button 
                            onClick={handleExpandSearch}
                            className="bg-white text-slate-950 px-12 py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500 hover:text-white transition-all transform active:scale-95 shadow-3xl"
                        >
                            🚀 Search AliExpress Manually
                        </button>

                        {/* ⚙️ ADVANCED DIAGNOSTICS */}
                        {fullInquiryResult?.debugInfo && (
                            <div className="pt-10 border-t border-slate-800/50 mt-10 text-left">
                                <details className="group">
                                    <summary className="text-[9px] font-black text-slate-600 uppercase tracking-widest cursor-pointer hover:text-slate-400 transition-colors list-none flex items-center gap-2">
                                        <Info size={10} /> Technical Diagnostics (Empty State)
                                    </summary>
                                    <div className="mt-4 p-6 bg-black/60 rounded-2xl border border-white/5 font-mono text-[9px] text-slate-400 overflow-x-auto">
                                        <pre>{JSON.stringify(fullInquiryResult.debugInfo, null, 2)}</pre>
                                    </div>
                                </details>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* EXPANSION PRE-FLIGHT MODAL */}
            <AnimatePresence>
                {showAliExpansion && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/80">
                         <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-950 border border-slate-800 p-12 rounded-[4rem] max-w-lg w-full text-center space-y-8 shadow-3xl"
                         >
                            <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-3xl flex items-center justify-center mx-auto border border-blue-500/20">
                                <Globe size={32} />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Global Scraper</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    Initiating manual AliExpress scraping flow. This will bypass the Eprolo API.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <button 
                                    onClick={() => navigate('/ali-sourcing', { state: { product: targetProduct, query: searchQuery } })}
                                    className="w-full py-6 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500 hover:text-white transition-all shadow-2xl"
                                >
                                    Proceed to AliExpress Search
                                </button>
                                <button onClick={() => setShowAliExpansion(false)} className="w-full py-4 text-[9px] font-black text-slate-700 uppercase tracking-widest hover:text-white transition-colors">
                                    Stay on Eprolo
                                </button>
                            </div>
                         </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* CONFIRMATION MODAL */}
            <AnimatePresence>
                {confirmModal && (
                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-950 border border-slate-800 p-12 rounded-[3.5rem] max-w-xl w-full shadow-3xl text-center space-y-10"
                        >
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-950 mx-auto shadow-2xl">
                                <CheckCircle2 size={32} />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">Commit Choice?</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Confirming this product will import it into your store. Estimated profit: <span className="text-emerald-500 font-bold">{confirmModal.roiRange?.expected}% ROI</span>.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setConfirmModal(null)} className="flex-1 py-5 border border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all">Back</button>
                                <button onClick={() => finalizeImport(confirmModal)} className="flex-1 py-5 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-emerald-500 hover:text-white transition-all shadow-xl">Confirm Import</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SupplierSourcing;
