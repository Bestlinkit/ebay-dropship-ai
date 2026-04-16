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
import aliexpressService from '../services/aliexpress';
import sourcingService from '../services/sourcing';
import { SourcingStatus } from '../constants/sourcing';
import { toast } from 'sonner';

// 🏗️ MODULAR COMPONENTS
import SourcingStatusHeader from '../components/sourcing/SourcingStatusHeader';
import SupplierResultRow from '../components/sourcing/SupplierResultRow';

/**
 * Eprolo Supplier Sourcing (v3.1)
 * Optimized for build stability and API transparency.
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
    const [extracting, setExtracting] = useState(false);
    const [confirmModal, setConfirmModal] = useState(null);
    const [showAliExpansion, setShowAliExpansion] = useState(false);
    const [fullInquiryResult, setFullInquiryResult] = useState(null);
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
        // 🚨 7. SEARCH RESET (Iron Flow 7.2)
        setRawResults([]);
        setFullInquiryResult(null);
        setPipelineState({ status: 'LOADING', sources: { eprolo: 'PENDING', aliexpress: 'PENDING' } });

        const context = sourcingService.createContext(query, targetProduct);
        
        try {
            // 🚀 UNIFIED PIPELINE LAUNCH
            const result = await sourcingService.runUnifiedPipeline(context, {
                fetchEprolo: () => eproloService.searchProducts(context.query),
                fetchAliExpress: () => aliexpressService.searchProducts(context.query)
            });

            setPipelineState({ status: result.status, sources: result.sources });
            
            // ⚡ RESTORE FLOW (v7.1): Set initial results immediately to show skeleton/baseline
            setRawResults(result.data);

            // 💰 PARALLEL AUTO-ENRICHMENT (Limited Concurrency)
            if (result.sources.aliexpress === 'OK') {
                const aliItems = result.data.filter(p => p.source === 'AliExpress');
                if (aliItems.length > 0) {
                    const enrichedItems = await aliexpressService.enrichWithLimit(result.data, 2);
                    setRawResults(enrichedItems); // Update UI after hydration
                }
            }
            
            if (result.status === 'SYSTEM_DOWN') {
                toast.error("System Failure: Unable to reach any supplier networks.");
            } else if (result.status === sourcingService.Status.PARTIAL) {
                const failed = Object.entries(result.sources).filter(([_, s]) => s === 'FAILED').map(([n]) => n);
                toast.warning(`Partial Discovery: ${failed.join(', ')} connection offline.`);
            }

        } catch (e) {
            console.error("Pipeline Crash:", e);
            setPipelineState(s => ({ ...s, status: 'SYSTEM_DOWN' }));
            toast.error(`Sourcing pipeline critically failed.`);
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
                // RE-SCORE BASED ON HYDRATED DATA
                const res = sourcingService.normalize(raw, raw.source === 'Eprolo' ? 'eprolo' : 'aliexpress');
                const relevance = sourcingService.calculateScore(res, targetPrice);
                const cost = res.price;
                const sellingPrice = targetPrice;
                
                let roiRange = null;
                if (cost && cost > 0 && sellingPrice && sellingPrice > 0) {
                    roiRange = sourcingService.calculateROI(sellingPrice, cost);
                }

                return { 
                    ...res, 
                    relevance, 
                    roiRange,
                    enrichmentStatus: raw.enrichmentStatus || (raw.enriched ? "DONE" : "PENDING")
                };
            })
            // 🚨 3. STATUS GATE (Iron Flow 7.2): Only show READY product
            .filter(res => res.status === 'READY')
            .sort((a, b) => b.relevance - a.relevance);
    }, [rawResults, targetProduct, targetPrice]);

    const paginatedResults = useMemo(() => processedResults.slice(0, page * PAGE_SIZE), [processedResults, page]);
    const bestOption = useMemo(() => sourcingService.identifyBestOption(processedResults), [processedResults]);

    const handleContinue = (supplierProduct) => setConfirmModal(supplierProduct);
    const handleExpandSearch = () => setShowAliExpansion(true);

    const finalizeImport = async (supplierProduct) => {
        setExtracting(true);
        const loadingId = toast.loading("Syncing with supplier...");
        try {
            // 🚨 6. SOURCE-AWARE EXTRACTION (Iron Flow 7.2)
            let fullProduct = null;
            if (supplierProduct.source === 'EPROLO') {
                fullProduct = await eproloService.getProductDetail(supplierProduct.id);
            } else {
                // For AliExpress, we already have many details, but let's ensure it's READY
                const res = await aliexpressService.getProductDetails(supplierProduct.url);
                if (res.status !== 'SUCCESS') throw new Error("AliExpress extraction failed");
                fullProduct = {
                    ...supplierProduct,
                    ...res.data
                };
            }

            // 🚨 6. ARRAY SAFETY GUARDS
            const firstImage = fullProduct?.images?.[0] || fullProduct?.image || "";
            const firstVariant = fullProduct?.variants?.[0] || null;

            navigate('/product-import-preview', { 
                state: { 
                    product: {
                        ...fullProduct,
                        image: firstImage,
                        pricing: { ...fullProduct.pricing, basePrice: targetPrice }
                    } 
                } 
            });
            toast.success("Intelligence extraction complete.");
        } catch (error) {
            console.error("Import Crash Logic:", error);
            toast.error(`Import failed: ${error.message}`);
        } finally {
            toast.dismiss(loadingId);
            setExtracting(false);
        }
    };

    if (!targetProduct) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-8 bg-white text-center p-10">
                <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-[2rem] flex items-center justify-center text-slate-300">
                    <AlertCircle size={40} />
                </div>
                <div className="space-y-4">
                    <h3 className="text-xl font-black text-slate-950 italic tracking-tighter uppercase">Missing Product Context</h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto">Inquiry source not detected.</p>
                </div>
                <button onClick={() => navigate('/discovery')} className="px-10 py-5 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-xl">
                    Return to Discovery <ArrowRight size={14} />
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-[1300px] mx-auto space-y-12 pb-40 px-6 animate-in fade-in duration-700">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 p-10 bg-white border border-slate-200 rounded-[3rem] shadow-sm">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="w-14 h-14 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all bg-slate-50">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                                <img src={targetProduct?.image} className="w-full h-full object-cover" alt="Focus" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-slate-950 italic tracking-tighter uppercase leading-none">Eprolo Discovery</h1>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                                    <ShieldCheck size={12} className="text-emerald-500" /> Secure API Bridge
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-[2rem] flex items-center gap-6">
                    <img src={targetProduct.image} alt="" className="w-16 h-16 rounded-xl border border-slate-200 object-cover shadow-lg" />
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Benchmark Price</p>
                        <p className="text-lg font-black text-emerald-600 italic leading-none">{targetPrice ? `$${targetPrice.toFixed(2)}` : 'N/A'}</p>
                    </div>
                </div>
            </div>

            <SourcingStatusHeader state={loading ? 'searching' : 'results'} loading={loading} resultsCount={processedResults.length} isGlobal={false} />

            <div className="space-y-8">
                {/* ⚠️ SYSTEM STATUS BANNERS */}
                {!loading && (pipelineState.sources.eprolo === 'FAILED' || pipelineState.sources.eprolo === 'CONFIG_ERROR' || pipelineState.sources.eprolo === 'AUTH_ERROR') && pipelineState.sources.aliexpress === 'OK' && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-amber-50 border border-amber-200 rounded-[2rem] flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-950 uppercase tracking-widest">Eprolo Bridge Issue</h4>
                                <p className="text-xs text-slate-500 font-medium tracking-tight">
                                    {pipelineState.sources.eprolo === 'CONFIG_ERROR' ? "API Keys missing in environment." : "Authentication failed or server offline."}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => performSourcing()} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-[8px] font-black uppercase tracking-widest hover:border-slate-400 transition-all">Retry Eprolo</button>
                    </motion.div>
                )}

                {/* 1. LOADING */}
                {loading && (
                    <div className="space-y-6">
                        <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] flex items-center gap-6 animate-pulse">
                             <div className="w-12 h-12 bg-slate-100 rounded-xl" />
                             <div className="space-y-2 flex-1">
                                <div className="h-4 w-1/3 bg-slate-100 rounded" />
                                <div className="h-3 w-1/2 bg-slate-50 rounded" />
                             </div>
                        </div>
                        {Array(2).fill(0).map((_, i) => (
                           <div key={i} className="h-40 bg-white rounded-[2.5rem] animate-pulse border border-slate-100" />
                        ))}
                    </div>
                )}

                {/* 2. SUCCESS RESULTS */}
                {!loading && processedResults.length > 0 && (
                    <div className="grid grid-cols-1 gap-6">
                        {paginatedResults.map(res => (
                            <SupplierResultRow key={res.id} product={res} targetPrice={targetPrice} isBest={bestOption?.id === res.id} onContinue={handleContinue} />
                        ))}
                        {processedResults.length > paginatedResults.length && (
                             <button onClick={() => setPage(p => p + 1)} className="w-full py-8 bg-white border border-slate-200 text-slate-950 rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest hover:border-slate-400 transition-all shadow-sm">
                                 Show next {Math.min(PAGE_SIZE, processedResults.length - paginatedResults.length)} opportunities
                             </button>
                        )}
                        <div className="mt-10 p-10 bg-slate-50 border border-slate-200 rounded-[3rem] text-center space-y-4 shadow-sm">
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Need more variety or lower pricing?</p>
                             <button onClick={handleExpandSearch} className="text-[11px] font-black text-white px-8 py-4 bg-slate-950 hover:bg-emerald-600 rounded-xl transition-all uppercase tracking-widest">
                                 Search AliExpress Manually
                             </button>
                        </div>
                    </div>
                )}

                {/* 3. BLOCKED */}
                {!loading && processedResults.length === 0 && fullInquiryResult?.status === 'BLOCKED' && (
                    <div className="bg-slate-900/50 border border-slate-800 p-16 rounded-[4rem] text-center space-y-10">
                        <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-[2.5rem] flex items-center justify-center mx-auto"><Globe size={40} /></div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Connection Interrupted</h3>
                            <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">AliExpress has temporarily blocked automated access (Anti-Bot Triggered).</p>
                        </div>
                        <button onClick={() => performSourcing()} className="bg-white text-slate-950 px-12 py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500 hover:text-white transition-all shadow-3xl flex items-center gap-3 mx-auto">
                            <RefreshCw size={16} /> Retry Global Search
                        </button>
                    </div>
                )}

                {/* 4. SYSTEM DOWN (DUAL FAILURE) */}
                {!loading && pipelineState.status === 'SYSTEM_DOWN' && (
                    <div className="bg-rose-50 border border-rose-200 p-16 rounded-[4rem] text-center space-y-10">
                        <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-[2.5rem] flex items-center justify-center mx-auto"><AlertTriangle size={40} /></div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-black text-slate-950 italic tracking-tighter uppercase">Supplier Network Offline</h3>
                            <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">
                                Unable to establish a stable bridge to Eprolo or AliExpress. This may be due to regional blocks or API downtime.
                            </p>
                        </div>
                        <div className="flex flex-col items-center gap-6">
                                <button onClick={() => performSourcing()} className="bg-slate-950 text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl flex items-center gap-3">
                                    <RefreshCw size={16} /> Re-Sync Discovery Pipe
                                </button>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Protocol Alpha v7.0 Active</p>
                        </div>
                    </div>
                )}

                {/* 5. LOW QUALITY / PARTIAL DATA (v7.1 Split States) */}
                {!loading && processedResults.length === 0 && pipelineState.status === sourcingService.Status.COMPLETE && (
                    <div className="bg-slate-50 border border-slate-200 p-16 rounded-[4rem] text-center space-y-10">
                        <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-[2.5rem] flex items-center justify-center mx-auto"><ShieldAlert size={40} /></div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-black text-slate-950 italic tracking-tighter uppercase">No Strong Matches</h3>
                            <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">
                                We couldn't find high-quality supplier matches for this title. Try a broader keyword or search manually below.
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4">
                            <button onClick={handleExpandSearch} className="bg-slate-950 text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl">🚀 Manual AliExpress Search</button>
                            <button onClick={() => navigate('/discovery')} className="bg-white border border-slate-200 text-slate-950 px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-xl">Back to Discovery</button>
                        </div>
                    </div>
                )}

                {/* 6. PARTIAL DATA ADVISORY */}
                {!loading && processedResults.length > 0 && pipelineState.status === sourcingService.Status.PARTIAL && (
                    <div className="p-6 bg-slate-900 text-white rounded-[2rem] flex items-center justify-between shadow-2xl">
                         <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                                <Info size={20} />
                             </div>
                             <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Partial Data Mode</p>
                                <p className="text-[11px] font-medium text-slate-400">Eprolo offline. Showing AliExpress baseline results (deep data still loading).</p>
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
                                <p className="text-slate-500 text-sm leading-relaxed">Initiating manual AliExpress scraping flow.</p>
                            </div>
                            <div className="space-y-4">
                                <button onClick={() => navigate('/ali-sourcing', { state: { product: targetProduct, query: searchQuery } })} className="w-full py-6 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl">Proceed</button>
                                <button onClick={() => setShowAliExpansion(false)} className="w-full py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-950 transition-colors">Cancel</button>
                            </div>
                         </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {confirmModal && (
                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-6 backdrop-blur-md bg-white/40">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white border border-slate-200 p-12 rounded-[3.5rem] max-w-xl w-full shadow-2xl text-center space-y-10">
                            <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl"><CheckCircle2 size={32} /></div>
                            <div className="space-y-4">
                                <h3 className="text-3xl font-black text-slate-950 italic tracking-tighter uppercase">Commit Choice?</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    {confirmModal.roiRange?.expected !== null ? (
                                        <>Estimated profit: <span className="text-emerald-600 font-bold">{confirmModal.roiRange.expected}% ROI</span>.</>
                                    ) : (
                                        "Calculating final margins..."
                                    )}
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setConfirmModal(null)} className="flex-1 py-5 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">Back</button>
                                <button onClick={() => finalizeImport(confirmModal)} className="flex-1 py-5 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-emerald-600 transition-all shadow-xl">Confirm Import</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SupplierSourcing;
