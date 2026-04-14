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
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import eproloService from '../services/eprolo';
import aliexpressService from '../services/aliexpress';
import sourcingService from '../services/sourcing';
import { toast } from 'sonner';

/**
 * Supplier Sourcing Hub (v1.1 Hardened)
 * High-performance sourcing bridge with Decision-Grade intelligence.
 */
const SupplierSourcing = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const targetProduct = location.state?.product;

    const [step, setStep] = useState('EPROLO'); // EPROLO, ALI_PROMPT, ALIEXPRESS, NO_MATCH
    const [loading, setLoading] = useState(true);
    const [rawResults, setRawResults] = useState([]);
    const [extracting, setExtracting] = useState(false);
    const [confirmModal, setConfirmModal] = useState(null);

    // 1. ENGINE: Multi-Platform Sourcing Sequence
    const performSourcing = useCallback(async (platform = 'EPROLO') => {
        if (!targetProduct) return;
        setLoading(true);
        try {
            let matches = [];
            if (platform === 'EPROLO') {
                matches = await eproloService.findMatches(targetProduct);
                if (matches.length === 0) {
                    setStep('ALI_PROMPT');
                    setLoading(false);
                    return;
                }
            } else {
                matches = await aliexpressService.searchProducts(targetProduct.title);
            }

            setRawResults(matches);
            setStep(platform);
            
            // 🧠 SEARCH QUALITY GUARD (v1.2)
            const lowQuality = matches.every(m => sourcingService.calculateMatchRelevance(targetProduct, m) < 60);
            if (lowQuality && matches.length > 0) {
                toast.warning("We found suppliers, but they may not closely match this product.", {
                    description: "Please review variants carefully before importing.",
                    duration: 5000
                });
            }

        } catch (e) {
            toast.error(e.message || "Sourcing bridge malfunction. Try manual search.");
            setStep('NO_MATCH');
        } finally {
            setLoading(false);
        }
    }, [targetProduct]);

    useEffect(() => { performSourcing(); }, [performSourcing]);

    // 2. INTELLIGENCE LAYER: Validation & decision-grade scoring
    const processedResults = useMemo(() => {
        if (!targetProduct) return [];
        
        return rawResults
            .map(res => {
                const relevance = sourcingService.calculateMatchRelevance(targetProduct, res);
                const roiRange = sourcingService.calculateSupplierROIRange(targetProduct.price, res.price + (res.shipping || 0));
                const trust = sourcingService.evaluateSupplierTrust(res);
                
                // Logic check for variant mismatch (using title heuristics)
                const hasVariantWarning = !targetProduct.title.toLowerCase().split(' ').every(w => 
                    w.length < 4 || res.title.toLowerCase().includes(w)
                );

                return { ...res, relevance, roiRange, trust, hasVariantWarning };
            })
            .filter(res => res.relevance >= 40) // Adjusted for more visibility (v1.2)
            .sort((a, b) => b.relevance - a.relevance);
    }, [rawResults, targetProduct]);

    const bestOption = useMemo(() => sourcingService.identifyBestOption(processedResults), [processedResults]);

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
                            <Activity size={12} className="text-emerald-500" /> Sourcing Phase: {step}
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

            {/* 🔍 SOURCING FEED */}
            <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                    <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Verified Supplier Matches</h2>
                    <div className="flex items-center gap-4 text-[9px] font-black text-slate-700 uppercase tracking-widest">
                        <span>USA Priority Logic Active</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-6">
                        {Array(3).fill(0).map((_, i) => (
                           <div key={i} className="h-40 bg-slate-900/50 rounded-[2.5rem] animate-pulse border border-slate-800/30" />
                        ))}
                    </div>
                ) : step === 'ALI_PROMPT' ? (
                    <div className="bg-slate-900 border border-slate-800 p-12 rounded-[3.5rem] text-center space-y-8 shadow-3xl">
                        <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-[2.5rem] flex items-center justify-center text-rose-500 mx-auto">
                            <ShieldAlert size={40} />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">No Eprolo Match Detected</h3>
                            <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
                                We couldn't find an exact match on Eprolo. Do you want to try sourcing this product from AliExpress instead?
                            </p>
                        </div>
                        <div className="flex items-center justify-center gap-6 pt-4">
                            <button onClick={() => navigate(-1)} className="px-10 py-5 border border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all">
                                Cancel Flow
                            </button>
                            <button 
                                onClick={() => performSourcing('ALIEXPRESS')}
                                className="px-12 py-5 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-500 hover:text-white transition-all transform active:scale-95 shadow-2xl"
                            >
                                Source AliExpress <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                ) : processedResults.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                        {processedResults.map(res => (
                            <SupplierResultRow 
                                key={res.id} 
                                product={res} 
                                targetPrice={targetProduct.price}
                                isBest={bestOption?.id === res.id}
                                onContinue={handleContinue}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-40 text-center space-y-6 opacity-30">
                        <ShieldQuestion size={80} className="mx-auto text-slate-400" />
                        <p className="text-[14px] font-black uppercase tracking-[0.5em]">No Valid Suppliers Detected</p>
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
 * Supplier Row Component (v1.1 Decision Engine Layout)
 */
const SupplierResultRow = ({ product, targetPrice, isBest, onContinue }) => {
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
                <img src={product.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
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
                        disabled={extracting}
                        className={cn(
                            "px-10 py-4 bg-white text-slate-950 hover:bg-emerald-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 group/btn",
                            extracting && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {extracting ? "Extracting..." : "Continue"} 
                        {!extracting && <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default SupplierSourcing;
