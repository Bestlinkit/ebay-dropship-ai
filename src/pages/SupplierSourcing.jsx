import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Lock,
  Box
} from 'lucide-react';
import cjService from '../services/cj.service';
import SupplierResultRow from '../components/sourcing/SupplierResultRow';

/**
 * Stable Supplier Sourcing (v6.0 - Infinite Stability)
 */
const SupplierSourcing = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const { ebayProduct, query } = location.state || {};
    const targetPrice = Number(ebayProduct?.price || location.state?.targetPrice || 50);
    const initialQuery = query || ebayProduct?.title || '';
    const targetProduct = ebayProduct;

    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [pipelineState, setPipelineState] = useState({ status: 'IDLE' });
    const [lastError, setLastError] = useState(null);
    const observerTarget = useRef(null);

    const performSourcing = useCallback(async (queryParam, append = false, pageNum = 1) => {
        if (!queryParam?.trim()) return;
        
        setLoading(true);
        setPipelineState({ status: 'LOADING' });
        
        if (!append) {
            setProducts([]);
            setLastError(null);
            setCurrentPage(1);
        }

        try {
            const res = await cjService.runIterativePipeline({
                query: queryParam,
                product: targetProduct,
                manualQuery: queryParam,
                pageNum
            });
            
            if (res.status === "SUCCESS") {
                const newProducts = res.products || [];
                
                if (append) {
                    setProducts(prev => {
                        const existingIds = new Set(prev.map(p => p.cj?.id));
                        const filteredNew = newProducts.filter(p => p.cj?.id && !existingIds.has(p.cj?.id));
                        return [...prev, ...filteredNew];
                    });
                } else {
                    setProducts(newProducts);
                }
                
                setHasMore(newProducts.length >= 20);
                setPipelineState({ status: 'SUCCESS' });
            } else if (res.status === "NO_MATCH_FOUND") {
                if (!append) {
                    setProducts([]);
                    setPipelineState({ status: 'NO_MATCH_FOUND' });
                }
                setHasMore(false);
            } else {
                setPipelineState({ status: 'ERROR' });
                setLastError(res.message);
            }
        } catch (err) {
            setPipelineState({ status: 'SYSTEM_DOWN' });
            setLastError(err.message);
        } finally {
            setLoading(false);
        }
    }, [targetProduct]);

    useEffect(() => {
        if (!hasMore || loading) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    const next = currentPage + 1;
                    performSourcing(searchQuery, true, next);
                    setCurrentPage(next);
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => {
            if (observerTarget.current) observer.unobserve(observerTarget.current);
        };
    }, [hasMore, loading, currentPage, performSourcing, searchQuery]);

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        performSourcing(searchQuery, false, 1);
    };

    useEffect(() => { 
        if (initialQuery) performSourcing(initialQuery, false, 1); 
    }, []);

    const handleContinue = (product) => {
        navigate(`/supplier-detail/cj/${product.cj?.id}`, { 
            state: { 
                targetProduct: ebayProduct, 
                targetPrice,
                preFetchedProduct: product
            } 
        });
    };

    if (!targetProduct && !searchQuery) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-8 bg-white text-center p-10">
                <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-[2rem] flex items-center justify-center text-slate-300">
                    <AlertCircle size={40} />
                </div>
                <h3 className="text-xl font-black text-slate-950 uppercase">Inquiry Lost</h3>
                <button onClick={() => navigate('/discovery')} className="px-10 py-5 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
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
                        <h1 className="text-3xl font-black text-slate-950 italic tracking-tighter uppercase leading-none">CJ Discovery Engine</h1>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                             <Lock size={12} className="text-indigo-500" /> v6.0 Infinite Stability
                        </p>
                    </div>
                </div>

                <div className="flex-1 max-w-xl">
                    <form onSubmit={handleSearch} className="relative group">
                        <input 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search CJ Catalog..."
                            className="w-full pl-6 pr-32 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-950 focus:border-indigo-500 focus:bg-white focus:ring-0 transition-all outline-none"
                        />
                        <button 
                            type="submit"
                            disabled={loading}
                            className="absolute right-3 top-3 bottom-3 px-6 bg-slate-950 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 disabled:opacity-50 transition-all"
                        >
                            {loading ? 'SEARCHING...' : 'SEARCH'}
                        </button>
                    </form>
                </div>

                {targetProduct && (
                    <div className="bg-slate-50 border border-slate-200 p-6 rounded-[2rem] flex items-center gap-6">
                        <img src={targetProduct.image} alt="" className="w-16 h-16 rounded-xl border border-slate-200 object-cover shadow-lg" />
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">eBay Target Price</p>
                            <p className="text-lg font-black text-emerald-600 italic leading-none">${targetPrice.toFixed(2)}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-8">
                {products.length > 0 ? (
                    <div className="grid grid-cols-1 gap-12 px-4">
                        {products.map((product, idx) => (
                            <SupplierResultRow 
                                key={`${product.cj?.id || idx}`}
                                product={product} 
                                targetPrice={targetPrice}
                                onContinue={handleContinue}
                            />
                        ))}
                        
                        <div ref={observerTarget} className="h-24 flex items-center justify-center">
                            {hasMore && (
                                <div className="flex items-center gap-3 px-8 py-4 bg-slate-900/5 rounded-2xl border border-slate-200 backdrop-blur-md">
                                    <RefreshCw size={16} className={cn("text-indigo-500", loading && "animate-spin")} />
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                        {loading ? 'Hydrating Catalog...' : 'Scroll for more'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    !loading && (
                        <div className="bg-white border-2 border-dashed border-slate-200 p-20 rounded-[4rem] text-center space-y-10 shadow-2xl shadow-slate-100 mx-4">
                            <div className="w-24 h-24 bg-slate-50 text-slate-300 border rounded-[3rem] flex items-center justify-center mx-auto">
                                <Box size={48} />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-3xl font-black text-slate-950 italic tracking-tighter uppercase leading-tight">
                                    No Products Found
                                </h3>
                                <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed font-medium">
                                    Try broadening your search keywords or manually entering a product name.
                                </p>
                            </div>
                            <button onClick={() => handleSearch()} className="px-16 py-6 bg-slate-950 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 mx-auto">
                                <RefreshCw size={20} className={loading ? "animate-spin" : ""} /> Retry Discovery
                            </button>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default SupplierSourcing;
