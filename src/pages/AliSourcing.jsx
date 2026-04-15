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
  CheckCircle2,
  Lock
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
 * Isolated AliExpress Manual Explorer (v1.0)
 * Deterministic scraping-only engine with zero Eprolo dependency.
 */
const AliSourcing = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const targetProduct = location.state?.product;
    const initialQuery = location.state?.query || targetProduct?.title || '';

    const [loading, setLoading] = useState(false);
    const [rawResults, setRawResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [extracting, setExtracting] = useState(false);
    const [confirmModal, setConfirmModal] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

    // 1. ENGINE: Strictly Manual Scrape
    const performSourcing = useCallback(async (query = searchQuery) => {
        if (!targetProduct) return;
        
        setLoading(true);
        setErrorMessage(null);
        console.log("SOURCE: ALIEXPRESS MANUAL");
        console.info(`[AliExplorer] Initiating isolated manual scrape for: ${query}`);
        
        try {
            const matches = await aliexpressService.searchProducts(query);
            
            // SCHEMA HARMONIZATION
            const mappedMatches = matches.map(m => ({
                ...m,
                image: m.image || m.thumbnail
            }));

            setRawResults(mappedMatches);
            
            if (mappedMatches.length === 0) {
                toast.info("No matches found for this query.");
            }
        } catch (e) {
            console.error(`[AliExplorer] Scraping Node Failure:`, e.message);
            setErrorMessage(e.message || "AliExpress scraping blocked.");
            toast.error(e.message || "Scraping Blocked");
        } finally {
            setLoading(false);
        }
    }, [targetProduct, searchQuery]);

    useEffect(() => { 
        if (initialQuery) performSourcing(initialQuery);
    }, []);

    // 2. INTELLIGENCE LAYER
    const processedResults = useMemo(() => {
        if (!targetProduct || rawResults.length === 0) return [];
        
        return rawResults
            .map(res => {
                const relevance = sourcingService.calculateMatchRelevance(targetProduct, res);
                const roiRange = sourcingService.calculateSupplierROIRange(targetProduct.price, res.price + (res.shipping || 0));
                const trust = sourcingService.evaluateSupplierTrust(res);
                return { ...res, relevance, roiRange, trust };
            })
            .filter(res => res.relevance >= 20) // Permissive for manual exploration
            .sort((a, b) => b.relevance - a.relevance);
    }, [rawResults, targetProduct]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        performSourcing(searchQuery);
    };

    const handleContinue = (supplierProduct) => {
        setConfirmModal(supplierProduct);
    };

    const finalizeImport = async (supplierProduct) => {
        setExtracting(true);
        const loadingId = toast.loading("Syncing manual source data...");
        try {
            // Note: Reuse existing detail extraction logic but mark as manual
            navigate('/product-import-preview', { 
                state: { 
                    product: {
                        ...supplierProduct,
                        pricing: { basePrice: targetProduct.price },
                        sourceType: 'manual_aliexpress'
                    } 
                } 
            });
            toast.success("Extraction complete.");
        } catch (error) {
            toast.error("Extraction failed.");
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
                        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Ali Explorer.</h1>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                             <Lock size={12} className="text-blue-500" /> Isolated Manual Scraping Flow
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl flex items-center gap-4 bg-slate-900/50 border border-slate-800 p-2 rounded-2xl shadow-2xl">
                    <div className="pl-4 text-slate-500"><SearchIcon size={18} /></div>
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Manually refine AliExpress tokens..."
                        className="flex-1 bg-transparent border-none outline-none text-sm text-white py-2"
                    />
                    <button 
                        type="submit"
                        disabled={loading}
                        className="bg-white text-slate-950 px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50"
                    >
                        {loading ? 'Probing...' : 'Scrape Now'}
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
                             <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] animate-pulse italic">Connecting to global node... bypassing deterministic chain</p>
                        </div>
                        <div className="space-y-6">
                            {Array(3).fill(0).map((_, i) => (
                               <div key={i} className="h-40 bg-slate-900/50 rounded-[2.5rem] animate-pulse border border-slate-800/20" />
                            ))}
                        </div>
                    </div>
                ) : errorMessage ? (
                    <div className="py-24 text-center space-y-8 bg-slate-900/40 border border-slate-800/50 rounded-[4rem] animate-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                             <ShieldAlert size={48} />
                        </div>
                        <div className="space-y-3">
                             <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">Manual Scrape Inhibited</h4>
                             <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">{errorMessage}</p>
                        </div>
                        <button 
                            onClick={() => performSourcing()}
                            className="bg-slate-800 text-white px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
                        >
                            Retry Scrape Sequence
                        </button>
                    </div>
                ) : processedResults.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                        {processedResults.map(res => (
                            <SupplierResultRow 
                                key={res.id} 
                                product={res} 
                                targetPrice={targetProduct.price}
                                isBest={false}
                                onContinue={handleContinue}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center space-y-6">
                        <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto text-slate-800 border border-slate-800">
                             <AlertCircle size={40} />
                        </div>
                        <div className="space-y-2">
                             <h4 className="text-xl font-black text-white italic uppercase">Zero Global Matches</h4>
                             <p className="text-slate-600 text-sm max-w-md mx-auto">AliExpress scraping returned no relevant data for this keyword node.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* CONFIRMATION MODAL */}
            <AnimatePresence>
                {confirmModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/80">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-950 border border-slate-800 p-12 rounded-[3.5rem] max-w-xl w-full shadow-3xl text-center space-y-10"
                        >
                            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-2xl">
                                <Globe size={32} />
                            </div>
                            <div className="space-y-4">
                                <div className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[8px] font-black text-blue-500 uppercase tracking-widest mb-2">
                                    Sourced via Manual Scrape
                                </div>
                                <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">Lock Manual Source?</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    This product is sourced via global scraping and carries higher volatility. Confirming will import this selection into your store.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setConfirmModal(null)} className="flex-1 py-5 border border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-all">Abort</button>
                                <button onClick={() => finalizeImport(confirmModal)} className="flex-1 py-5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-blue-500 transition-all shadow-xl">Confirm & Import</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AliSourcing;
