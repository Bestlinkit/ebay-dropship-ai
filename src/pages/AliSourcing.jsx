import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  ShieldAlert,
  Search as SearchIcon,
  CheckCircle2,
  Terminal,
  ChevronDown,
  ChevronUp,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import aliexpressService from '../services/aliexpress';
import sourcingService from '../services/sourcing';
import { interpretSupplierResponse } from '../utils/sourcingInterpreter';
import { SourcingUIState } from '../constants/sourcing';
import { toast } from 'sonner';

// 🏗️ MODULAR COMPONENTS
import SourcingStatusHeader from '../components/sourcing/SourcingStatusHeader';
import SupplierResultRow from '../components/sourcing/SupplierResultRow';

/**
 * AliExpress Manual Search (v2.0)
 * Isolated, truth-based scraping flow with zero automatic transitions.
 */
const AliSourcing = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const targetProduct = location.state?.product;
    const initialQuery = location.state?.query || targetProduct?.title || '';

    const [loading, setLoading] = useState(false);
    const [matches, setMatches] = useState([]);
    const [uiState, setUiState] = useState(SourcingUIState.IDLE);
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [debugInfo, setDebugInfo] = useState(null);
    const [showDebug, setShowDebug] = useState(false);
    const [confirmModal, setConfirmModal] = useState(null);

    // 1. ENGINE: Strictly Manual Scrape
    const performSourcing = useCallback(async (query = searchQuery) => {
        if (!targetProduct) return;
        
        setLoading(true);
        setUiState(SourcingUIState.ALIEXPRESS_SEARCHING);
        setDebugInfo(null);
        setMatches([]);

        try {
            const result = await aliexpressService.searchProducts(query);
            const nextState = interpretSupplierResponse(result, 'aliexpress');
            
            setDebugInfo(result.debugInfo);
            setUiState(nextState);
            
            if (nextState === SourcingUIState.ALIEXPRESS_SUCCESS) {
                setMatches(result.data);
            }
        } catch (e) {
            setUiState(SourcingUIState.ALIEXPRESS_ERROR);
            setDebugInfo({ error: e.message, timestamp: new Date().toISOString() });
        } finally {
            setLoading(false);
        }
    }, [targetProduct, searchQuery]);

    useEffect(() => { 
        if (initialQuery) performSourcing(initialQuery);
    }, []);

    // 2. INTELLIGENCE LAYER (Harmonized with Market Node)
    const processedResults = useMemo(() => {
        if (!targetProduct || matches.length === 0) return [];
        
        return matches
            .map(res => {
                const relevance = sourcingService.calculateMatchRelevance(targetProduct, res);
                const roiRange = sourcingService.calculateSupplierROIRange(targetProduct.price, res.price + (res.shipping || 0));
                const trust = sourcingService.evaluateSupplierTrust(res);
                return { ...res, relevance, roiRange, trust };
            })
            .filter(res => res.relevance >= 20) 
            .sort((a, b) => b.relevance - a.relevance);
    }, [matches, targetProduct]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        performSourcing(searchQuery);
    };

    const handleContinue = (supplierProduct) => {
        setConfirmModal(supplierProduct);
    };

    const finalizeImport = async (supplierProduct) => {
        navigate('/product-import-preview', { 
            state: { 
                product: {
                    ...supplierProduct,
                    pricing: { basePrice: targetProduct.price },
                    sourceType: 'manual_aliexpress'
                } 
            } 
        });
    };

    if (!targetProduct) return <div className="p-20 text-center text-slate-500 font-bold uppercase tracking-widest">Market Node Required</div>;

    return (
        <div className="max-w-[1300px] mx-auto space-y-12 pb-40 px-6 animate-in fade-in duration-700">
            
            {/* 🧭 NAVIGATION */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="w-14 h-14 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all bg-slate-900/50">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">AliExpress Manual Search</h1>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                             Direct Scraper Flow (Deterministic)
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl flex items-center gap-4 bg-slate-900/50 border border-slate-800 p-2 rounded-2xl shadow-2xl">
                    <div className="pl-4 text-slate-500"><SearchIcon size={18} /></div>
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Refine AliExpress query..."
                        className="flex-1 bg-transparent border-none outline-none text-sm text-white py-2"
                    />
                    <button 
                        type="submit"
                        disabled={loading}
                        className="bg-white text-slate-950 px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50"
                    >
                        {loading ? 'Scraping...' : 'Search Now'}
                    </button>
                </form>
            </div>

            {/* 🔍 STATUS BAR */}
            <div className="bg-slate-950 border border-slate-900 p-8 rounded-[2rem] flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className={cn("w-3 h-3 rounded-full", loading ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{loading ? "Active Scrape Pipeline" : "Inquiry Results"}</p>
                        <h3 className="text-white font-bold text-sm">
                            {uiState === SourcingUIState.ALIEXPRESS_SEARCHING && "Bypassing automation... connecting to global node"}
                            {uiState === SourcingUIState.ALIEXPRESS_SUCCESS && `${processedResults.length} Valid matches identified`}
                            {uiState === SourcingUIState.ALIEXPRESS_EMPTY && "Zero matches found for this query"}
                            {uiState === SourcingUIState.ALIEXPRESS_BLOCKED && "Access Denied: Scraper Resistance Detected"}
                            {uiState === SourcingUIState.ALIEXPRESS_ERROR && "Technical Scrape Failure"}
                            {uiState === SourcingUIState.IDLE && "Ready for manual exploration"}
                        </h3>
                    </div>
                </div>

                {debugInfo && (
                    <button 
                        onClick={() => setShowDebug(!showDebug)}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-800 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-all"
                    >
                        <Terminal size={12} />
                        {showDebug ? "Hide Technical Details" : "Show Technical Details"}
                    </button>
                )}
            </div>

            {/* 🚥 DEBUG CONSOLE */}
            <AnimatePresence>
                {showDebug && debugInfo && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-slate-950 border border-slate-800 p-8 rounded-[2rem] font-mono text-emerald-400 text-xs">
                             <pre className="whitespace-pre-wrap break-all max-h-60 overflow-y-auto custom-scrollbar">
                                {JSON.stringify(debugInfo, null, 2)}
                             </pre>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 🏗️ SOURCING FEED */}
            <div className="space-y-8">
                {uiState === SourcingUIState.ALIEXPRESS_SEARCHING ? (
                    <div className="space-y-8">
                        {Array(3).fill(0).map((_, i) => (
                           <div key={i} className="h-40 bg-slate-900/50 rounded-[2.5rem] animate-pulse border border-slate-800/20" />
                        ))}
                    </div>
                ) : uiState === SourcingUIState.ALIEXPRESS_BLOCKED ? (
                    <div className="py-24 text-center space-y-8 bg-amber-950/10 border border-amber-950/20 rounded-[4rem]">
                        <div className="w-24 h-24 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
                             <ShieldAlert size={48} />
                        </div>
                        <div className="space-y-3">
                             <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">Access Inhibited</h4>
                             <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                                AliExpress network has detected scraping behavior. Please wait a few minutes or refine your keyword to bypass resistance.
                             </p>
                        </div>
                        <button onClick={() => performSourcing()} className="bg-amber-600 text-white px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 transition-all">Retry Sequence</button>
                    </div>
                ) : uiState === SourcingUIState.ALIEXPRESS_ERROR ? (
                    <div className="py-24 text-center space-y-8 bg-red-950/10 border border-red-950/20 rounded-[4rem]">
                        <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                             <AlertCircle size={48} />
                        </div>
                        <div className="space-y-3">
                             <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">Scrape Failure</h4>
                             <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">The scraping node failed to initialize or parse correctly. Verify technical details below.</p>
                        </div>
                        <button onClick={() => performSourcing()} className="bg-slate-800 text-white px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all">Re-initialize Node</button>
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
                ) : uiState === SourcingUIState.ALIEXPRESS_EMPTY ? (
                    <div className="py-20 text-center space-y-6">
                        <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto text-slate-800 border border-slate-800">
                             <AlertCircle size={40} />
                        </div>
                        <div className="space-y-2">
                             <h4 className="text-xl font-black text-white italic uppercase">No results found on AliExpress</h4>
                             <p className="text-slate-600 text-sm max-w-md mx-auto">Scraping returned zero relevant entries for this inquiry.</p>
                        </div>
                    </div>
                ) : null}
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
                                <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Import Manual Source?</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    This product is sourced via manual scraping and carries higher structural volatility. Do you wish to proceed?
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
