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
    const targetProduct = location.state?.product;
    const initialQuery = location.state?.query || targetProduct?.title || '';

    const [loading, setLoading] = useState(true);
    const [rawResults, setRawResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [extracting, setExtracting] = useState(false);
    const [confirmModal, setConfirmModal] = useState(null);
    const [showAliExpansion, setShowAliExpansion] = useState(false);

    // 1. ENGINE: Eprolo API Only
    const performSourcing = useCallback(async (query = searchQuery) => {
        if (!targetProduct) return;
        
        setLoading(true);
        console.info(`[Direct Sourcing] Inquiring Eprolo API for: ${query}`);
        
        try {
            const result = await eproloService.searchProducts(query);
            // Service now returns standardized object
            setRawResults(result.data || []);
        } catch (e) {
            console.error(`[Direct Sourcing] API Connection Failure:`, e);
            toast.error(`Eprolo API connection failed.`);
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

    if (!targetProduct) return <div className="p-20 text-center text-slate-500 font-bold uppercase tracking-widest">Target Selection Required</div>;

    return (
        <div className="max-w-[1300px] mx-auto space-y-12 pb-40 px-6 animate-in fade-in duration-700">
            
            {/* 🧭 NAVIGATION */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="w-14 h-14 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all bg-slate-900/50">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Direct Sourcing</h1>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                             <ShieldCheck size={12} className="text-blue-500" /> Eprolo API Bridge
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
                        
                        {/* 💡 UPSORT: Option to expand */}
                        <div className="mt-10 p-10 bg-slate-900/30 border border-slate-800 rounded-[3rem] text-center space-y-4">
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Need more variety or lower pricing?</p>
                             <button 
                                onClick={handleExpandSearch}
                                className="text-[11px] font-black text-white px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all uppercase tracking-widest border border-white/5"
                             >
                                 Search AliExpress Manually
                             </button>
                        </div>
                    </div>
                ) : (
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
