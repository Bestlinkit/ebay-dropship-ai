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
 * Verified Supplier Hub (v2.0-STABLE)
 * Primary sourcing engine targeting highly-vetted US/Global networks.
 */
const SupplierSourcing = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const targetProduct = location.state?.product;
    const initialQuery = location.state?.query || targetProduct?.title || '';

    const [loading, setLoading] = useState(true);
    const [rawResults, setRawResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [extracting, setExtracting] = useState(false);
    const [confirmModal, setConfirmModal] = useState(null);
    const [showAliExpansion, setShowAliExpansion] = useState(false);

    // 1. ENGINE: Verified Network Only (Eprolo)
    const performSourcing = useCallback(async (query = searchQuery) => {
        if (!targetProduct) return;
        
        setLoading(true);
        console.info(`[Verified Hub] Searching primary network for: ${query}`);
        
        try {
            const matches = await eproloService.searchProducts(query);
            
            // SCHEMA HARMONIZATION
            const mappedMatches = matches.map(m => ({
                ...m,
                image: m.image || m.thumbnail
            }));

            setRawResults(mappedMatches);
        } catch (e) {
            console.error(`[Verified Hub] API Node Failure:`, e);
            toast.error(`Primary network connection unstable. Checking alternatives...`);
        } finally {
            setLoading(false);
        }
    }, [targetProduct, searchQuery]);

    useEffect(() => { performSourcing(); }, []);

    // 2. INTELLIGENCE LAYER
    const processedResults = useMemo(() => {
        if (!targetProduct || rawResults.length === 0) return [];
        
        return rawResults
            .map(res => {
                const relevance = sourcingService.calculateMatchRelevance(targetProduct, res);
                const roiRange = sourcingService.calculateSupplierROIRange(targetPrice || targetProduct.price, res.price + (res.shipping || 0));
                const trust = sourcingService.evaluateSupplierTrust(res);
                const hasVariantWarning = !targetProduct.title.toLowerCase().split(' ').every(w => 
                    w.length < 4 || res.title.toLowerCase().includes(w)
                );
                return { ...res, relevance, roiRange, trust, hasVariantWarning };
            })
            .filter(res => res.relevance >= 35) 
            .sort((a, b) => b.relevance - a.relevance);
    }, [rawResults, targetProduct]);

    const targetPrice = targetProduct?.price || 0;
    const bestOption = useMemo(() => sourcingService.identifyBestOption(processedResults), [processedResults]);
    const suggestedKeywords = useMemo(() => sourcingService.generateSuggestedKeywords(targetProduct?.title), [targetProduct]);

    const handleContinue = (supplierProduct) => {
        setConfirmModal(supplierProduct);
    };

    const finalizeImport = async (supplierProduct) => {
        setExtracting(true);
        const loadingId = toast.loading("Syncing with supplier chain...");
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
            toast.error("Unable to retrieve full details. Try another match.");
        } finally {
            toast.dismiss(loadingId);
            setExtracting(false);
        }
    };

    // Navigation to Global Sourcing (AliExpress)
    const handleExpandSearch = () => {
        setShowAliExpansion(true);
    };

    if (!targetProduct) return <div className="p-20 text-center">No market node selected.</div>;

    return (
        <div className="max-w-[1300px] mx-auto space-y-12 pb-40 px-6 animate-in fade-in duration-700">
            
            {/* 🧭 NAVIGATION */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="w-14 h-14 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all bg-slate-900/50">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Sourcing Hub.</h1>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                             <ShieldCheck size={12} className="text-blue-500" /> Primary Verified Network
                        </p>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] flex items-center gap-6">
                    <img src={targetProduct.thumbnail || targetProduct.image_url} alt="" className="w-16 h-16 rounded-xl border border-white/5 object-cover" />
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Target Selection</p>
                        <p className="text-[11px] font-black text-white line-clamp-1 max-w-[200px]">{targetProduct.title}</p>
                        <p className="text-lg font-black text-emerald-500 italic leading-none">${targetPrice.toFixed(2)}</p>
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
                        {processedResults.map(res => (
                            <SupplierResultRow 
                                key={res.id} 
                                product={res} 
                                targetPrice={targetPrice}
                                isBest={bestOption?.id === res.id}
                                onContinue={handleContinue}
                            />
                        ))}
                        
                        {/* 💡 UPSORT: Option to expand even if results exist */}
                        <div className="mt-10 p-10 bg-slate-900/30 border border-slate-800 rounded-[3rem] text-center space-y-4">
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Need more variety or lower pricing?</p>
                             <button 
                                onClick={handleExpandSearch}
                                className="text-[11px] font-black text-white px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all uppercase tracking-widest border border-white/5"
                             >
                                 Expand to Global Marketplaces (AliExpress)
                             </button>
                        </div>
                    </div>
                ) : (
                    /* 🎯 GUIDED FALLBACK UI */
                    <div className="bg-slate-900/50 border border-slate-800 p-16 rounded-[4rem] text-center space-y-10 animate-in slide-in-from-bottom-10 fade-in duration-1000">
                        <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-[2.5rem] flex items-center justify-center mx-auto">
                            <ShieldAlert size={40} />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Verified Match Not Found</h3>
                            <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">
                                We couldn’t find verified suppliers for this product in our primary network. 
                                <br />
                                <span className="text-slate-300 font-bold">You can expand your search to global marketplaces for more options.</span>
                            </p>
                        </div>

                        {/* 🛣️ SOURCE CONTEXT CARD */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                             <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-2">
                                <Globe size={20} className="text-blue-500 mx-auto" />
                                <p className="text-[9px] font-black text-white uppercase tracking-widest">More Variety</p>
                                <p className="text-[8px] text-slate-600">Access millions of global vendors</p>
                             </div>
                             <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-2">
                                <Zap size={20} className="text-emerald-500 mx-auto" />
                                <p className="text-[9px] font-black text-white uppercase tracking-widest">Competitive Pricing</p>
                                <p className="text-[8px] text-slate-600">Direct-to-factory cost points</p>
                             </div>
                             <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-2">
                                <Clock size={20} className="text-amber-500 mx-auto" />
                                <p className="text-[9px] font-black text-white uppercase tracking-widest">Standard Shipping</p>
                                <p className="text-[8px] text-slate-600">7-15 day delivery windows</p>
                             </div>
                        </div>

                        <button 
                            onClick={handleExpandSearch}
                            className="bg-white text-slate-950 px-12 py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500 hover:text-white transition-all transform active:scale-95 shadow-3xl"
                        >
                            👉 Search More Suppliers (AliExpress)
                        </button>
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
                                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Global Expansion</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    Moving to the Global Search Engine to find more supplier variety and potentially lower pricing.
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
                                    Stay on Verified Network
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
                                <div className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[8px] font-black text-blue-500 uppercase tracking-widest mb-2">
                                    Sourced via Verified Network
                                </div>
                                <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">Commit Choice?</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    You are selecting this product for store import. This will lock in your profit baseline of <span className="text-emerald-500 font-bold">{confirmModal.roiRange?.expected}% ROI</span>.
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
