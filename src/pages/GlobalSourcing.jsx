import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Globe, 
  RefreshCw, 
  AlertCircle, 
  ShieldAlert,
  Search as SearchIcon,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import aliexpressService from '../services/aliexpress';
import sourcingService from '../services/sourcing';
import { toast } from 'sonner';

// 🏗️ MODULAR COMPONENTS
import SourcingStatusHeader from '../components/sourcing/SourcingStatusHeader';
import SupplierResultRow from '../components/sourcing/SupplierResultRow';

/**
 * Global Supplier Search (v2.0-STABLE)
 * Specialized engine for high-variety global marketplace discovery.
 */
const GlobalSourcing = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const targetProduct = location.state?.product;
    const initialQuery = location.state?.query || targetProduct?.title || '';

    const [loading, setLoading] = useState(true);
    const [rawResults, setRawResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [extracting, setExtracting] = useState(false);
    const [confirmModal, setConfirmModal] = useState(null);

    // 1. ENGINE: Global Search (AliExpress)
    const performSourcing = useCallback(async (query = searchQuery) => {
        if (!targetProduct) return;
        
        setLoading(true);
        console.info(`[Global Hub] Searching AliExpress for: ${query}`);
        
        try {
            const matches = await aliexpressService.searchProducts(query);
            
            // SCHEMA HARMONIZATION (image instead of thumbnail)
            const mappedMatches = matches.map(m => ({
                ...m,
                image: m.image || m.thumbnail
            }));

            setRawResults(mappedMatches);
            if (mappedMatches.length === 0) {
                toast.info("No global matches found for this specific query.");
            }
        } catch (e) {
            console.error(`[Global Hub] API Node Failure:`, e);
            toast.error(`Global search engine currently unstable. Try refining keywords.`);
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
                const roiRange = sourcingService.calculateSupplierROIRange(targetProduct.price, res.price + (res.shipping || 0));
                const trust = sourcingService.evaluateSupplierTrust(res);
                const hasVariantWarning = !targetProduct.title.toLowerCase().split(' ').every(w => 
                    w.length < 4 || res.title.toLowerCase().includes(w)
                );
                return { ...res, relevance, roiRange, trust, hasVariantWarning };
            })
            .filter(res => res.relevance >= 30) // Slightly more permissive for global search
            .sort((a, b) => b.relevance - a.relevance);
    }, [rawResults, targetProduct]);

    const bestOption = useMemo(() => sourcingService.identifyBestOption(processedResults), [processedResults]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        performSourcing(searchQuery);
    };

    const handleContinue = (supplierProduct) => {
        setConfirmModal(supplierProduct);
    };

    const finalizeImport = async (supplierProduct) => {
        setExtracting(true);
        const loadingId = toast.loading("Syncing global supplier data...");
        try {
            const fullProduct = await aliexpressService.getProductDetail(supplierProduct.id);
            navigate('/product-import-preview', { 
                state: { 
                    product: {
                        ...fullProduct,
                        pricing: { ...fullProduct.pricing, basePrice: targetProduct.price }
                    } 
                } 
            });
            toast.success("Global intelligence extraction complete.");
        } catch (error) {
            toast.error("Unable to retrieve details. The global node may be temporarily blocked.");
        } finally {
            toast.dismiss(loadingId);
            setExtracting(false);
        }
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
                        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Global Sourcing.</h1>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                             <Globe size={12} className="text-amber-500" /> Global Supplier Engine (AliExpress)
                        </p>
                    </div>
                </div>

                {/* 🔍 EDITABLE SEARCH BAR */}
                <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl flex items-center gap-4 bg-slate-900/50 border border-slate-800 p-2 rounded-2xl">
                    <div className="pl-4 text-slate-500"><SearchIcon size={18} /></div>
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Refine global search keywords..."
                        className="flex-1 bg-transparent border-none outline-none text-sm text-white py-2"
                    />
                    <button 
                        type="submit"
                        disabled={loading}
                        className="bg-white text-slate-950 px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>
            </div>

            {/* 🔍 STATUS BAR */}
            <SourcingStatusHeader 
                state={loading ? 'searching' : 'results'} 
                loading={loading}
                resultsCount={processedResults.length}
                isGlobal={true}
            />

            {/* 🏗️ SOURCING FEED */}
            <div className="space-y-8">
                {loading ? (
                    <div className="space-y-8">
                        <div className="text-center space-y-4">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Searching global suppliers... this may take a few seconds</p>
                        </div>
                        <div className="space-y-6">
                            {Array(3).fill(0).map((_, i) => (
                               <div key={i} className="h-40 bg-slate-900/50 rounded-[2.5rem] animate-pulse border border-slate-800/30" />
                            ))}
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
                    <div className="py-20 text-center space-y-6">
                        <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto text-slate-700">
                             <ShieldAlert size={40} />
                        </div>
                        <div className="space-y-2">
                             <h4 className="text-xl font-black text-white italic uppercase">No Global Matches Found</h4>
                             <p className="text-slate-500 text-sm max-w-md mx-auto">Try refining your search keywords above to find more options.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* CONFIRMATION MODAL */}
            <AnimatePresence>
                {confirmModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
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
                                <div className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[8px] font-black text-amber-500 uppercase tracking-widest mb-2">
                                    Sourced via Global Search
                                </div>
                                <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">Commit Global Source?</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    You are selecting this global product. Expected ROI: <span className="text-emerald-500 font-bold">{confirmModal.roiRange?.expected}%</span>. 
                                    <br />
                                    <span className="text-[10px] text-slate-500 italic mt-2 block">Note: Global shipping times are typically 7-15 days.</span>
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

export default GlobalSourcing;
