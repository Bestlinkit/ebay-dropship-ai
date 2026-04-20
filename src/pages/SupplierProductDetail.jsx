import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  ExternalLink, 
  ShieldCheck, 
  Star, 
  Truck, 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Zap, 
  Info, 
  Lock, 
  Layers, 
  Target,
  DollarSign,
  Activity
} from 'lucide-react';
import { cn } from '../lib/utils';
import cjService from '../services/cj.service';

/**
 * 🔍 CJ DEEP DETAIL ENGINE (v4.7 - Profit First)
 */
const SupplierProductDetail = () => {
    const { source, id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Context from previous search (v4.7 Sync)
    const targetProduct = location.state?.targetProduct;
    const targetPrice = Number(location.state?.targetPrice || 0);
    const sellData = location.state?.sellData;

    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [activeImage, setActiveImage] = useState(0);
    
    // v13.0 Shipping Options State
    const [shippingOptions, setShippingOptions] = useState([]);
    const [selectedShipping, setSelectedShipping] = useState(null);
    const [shippingLoading, setShippingLoading] = useState(false);

    useEffect(() => {
        const fetchDeepDetails = async () => {
            // v4.7 - High Fidelity State Consumption
            if (location.state?.preFetchedProduct) {
                const data = location.state.preFetchedProduct;
                setProduct(data);
                if (data.variants && data.variants.length > 0) {
                    setSelectedVariant(data.variants[0]);
                }
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // If we don't have prefetched state, we use the pipeline to ensure v4.7 normalization
                const result = await cjService.runIterativePipeline({ product: targetProduct });
                if (result.status === 'SUCCESS') {
                    const match = result.products.find(p => p.product_id === id);
                    if (match) {
                        setProduct(match);
                        if (match.variants?.length > 0) setSelectedVariant(match.variants[0]);
                        
                        // v13.0 Fetch Shipping Options
                        setShippingLoading(true);
                        const options = await cjService.getShippingOptions(id);
                        setShippingOptions(options);
                        if (options.length > 0) setSelectedShipping(options[0]);
                        setShippingLoading(false);
                    }
                }
            } catch (error) {
                console.error("Deep Enrichment Fault:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDeepDetails();
    }, [source, id, location.state, targetProduct]);

    // v13.0 Gallery Sync Effect
    useEffect(() => {
        if (selectedVariant?.image && product?.gallery) {
            const index = product.gallery.indexOf(selectedVariant.image);
            if (index !== -1) setActiveImage(index);
        }
    }, [selectedVariant, product?.gallery]);

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
                <div className="w-20 h-20 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-black uppercase tracking-widest text-slate-950 italic">Synchronizing Terminal</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">v4.7 Profit-First Intelligence Booting...</p>
                </div>
            </div>
        );
    }

    if (!product) return <div className="p-20 text-center font-black uppercase tracking-widest text-slate-400">Enforcement Failure: Metadata Unreachable</div>;

    const financials = product.intelligence?.financials;
    const logistics = product.intelligence?.shipping;
    const currentPrice = Number(selectedVariant?.price || product.price);
    
    // v13.0 Shipping Cost Logic
    const shippingCost = selectedShipping ? selectedShipping.cost : (financials?.shipping_cost || 5.00);
    
    // v13.0 Profit Engine (Dynamic)
    // profit = sellPrice - (cost + shipping)
    const netProfit = targetPrice - (currentPrice + shippingCost);
    const profitFormatted = netProfit < 0 ? `-$${Math.abs(netProfit).toFixed(2)}` : `+$${netProfit.toFixed(2)}`;
    const marginSignal = netProfit > 10 ? "High Profit" : (netProfit >= 3 ? "Medium Profit" : "Low Profit");

    const gallery = product.gallery || [];

    return (
        <div className="max-w-[1400px] mx-auto px-6 pb-40 pt-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <button onClick={() => navigate(-1)} className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-2xl hover:border-slate-400 transition-all text-[11px] font-black uppercase tracking-widest shadow-sm">
                    <ArrowLeft size={16} /> Return to Sourcing Grid
                </button>
                <div className="flex items-center gap-4">
                    <a 
                        href={product.cj_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-indigo-600 transition-colors"
                    >
                        <ExternalLink size={14} /> View on CJ
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                {/* Visuals */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm relative group">
                        {gallery.length > 0 ? (
                            <img 
                                src={selectedVariant?.image || gallery[activeImage]} 
                                alt={product.title} 
                                className="w-full aspect-square object-contain p-10 bg-white"
                            />
                        ) : (
                            <div className="w-full aspect-square flex items-center justify-center bg-slate-50 text-slate-300 font-black uppercase tracking-[0.2em] text-sm">
                                CJ Image Not Available
                            </div>
                        )}
                        <div className="absolute top-10 left-10">
                            <span className="px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-xl bg-slate-900 border border-white/20">
                                SKU: {selectedVariant?.sku || product.sku}
                            </span>
                        </div>
                    </div>

                    {/* v5.0 - UNLIMITED GALLERY LOOP */}
                    {gallery.length > 1 && (
                        <div className="grid grid-cols-6 gap-4">
                            {gallery.map((img, i) => (
                                <button 
                                    key={i}
                                    onClick={() => {
                                        setActiveImage(i);
                                        setSelectedVariant(null);
                                    }}
                                    className={cn(
                                        "aspect-square rounded-2xl border-2 overflow-hidden transition-all bg-white",
                                        activeImage === i && !selectedVariant ? "border-indigo-600 shadow-md" : "border-slate-200 opacity-60 hover:opacity-100"
                                    )}
                                >
                                    <img src={img} className="w-full h-full object-cover" alt="" />
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="p-10 bg-slate-50 border border-slate-200 rounded-[3rem] space-y-6">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                            <Info size={14} /> Production Description
                        </h4>
                        <div 
                            className="text-sm font-medium text-slate-600 leading-relaxed max-h-96 overflow-y-auto pr-4 custom-scrollbar supplier-description-preview"
                            dangerouslySetInnerHTML={{ __html: product.description || "No description provided." }}
                        />
                    </div>
                </div>

                {/* Data */}
                <div className="lg:col-span-5 space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-black text-slate-950 italic tracking-tighter leading-none uppercase">
                            {product.title}
                        </h1>
                        <div className="flex items-center gap-6">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {product.product_id}</span>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">|</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Warehouse: {product.warehouse}</span>
                        </div>
                    </div>

                    {/* v4.7 Profit Pulse */}
                    <div className="p-8 bg-white border-2 border-slate-950 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                            <DollarSign size={40} className="text-slate-50 opacity-10" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Net Profit ($)</p>
                                    <p className={cn(
                                        "text-4xl font-black italic tracking-tighter",
                                        netProfit >= 0 ? "text-emerald-500" : "text-rose-500"
                                    )}>
                                        {profitFormatted}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <Zap size={10} className="text-indigo-400" />
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{marginSignal.toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="h-[1px] bg-slate-100 w-full" />
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CJ Cost</p>
                                    <p className="text-lg font-black text-slate-950">${currentPrice.toFixed(2)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">eBay Price</p>
                                    <p className="text-lg font-black text-slate-950">${targetPrice.toFixed(2)}</p>
                                </div>
                            </div>

                             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                <div className="flex items-center gap-2"><Truck size={14} /> {selectedShipping?.deliveryTime || logistics?.delivery_estimate || "7-15 DAYS"}</div>
                                <div className="flex items-center gap-2">
                                    <Activity size={14} /> 
                                    TOTAL STOCK: {product.stock || 0} 
                                    {selectedVariant && <span className="text-indigo-400"> (SELECTED: {selectedVariant.inventory})</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* v13.0 Shipping Option Selector */}
                    <div className="space-y-6">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-between">
                            Available Shipping Methods
                            {shippingLoading && <RefreshCw size={10} className="animate-spin" />}
                        </h4>
                        <div className="space-y-3 bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
                            {shippingOptions.length > 0 ? (
                                shippingOptions.map((opt, i) => (
                                    <label 
                                        key={`${opt.name}-${i}`}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-slate-50",
                                            selectedShipping?.name === opt.name ? "border-slate-950 bg-slate-50" : "border-slate-50 bg-white"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <input 
                                                type="radio" 
                                                name="shipping"
                                                checked={selectedShipping?.name === opt.name}
                                                onChange={() => setSelectedShipping(opt)}
                                                className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-600" 
                                            />
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-black text-slate-950 uppercase">{opt.name}</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{opt.deliveryTime}</p>
                                            </div>
                                        </div>
                                        <span className="text-[11px] font-black text-indigo-600">${opt.cost.toFixed(2)}</span>
                                    </label>
                                ))
                            ) : (
                                <div className="text-center py-4 opacity-50 text-[10px] font-bold uppercase tracking-widest italic">
                                    {shippingLoading ? "Fetching Logistics Data..." : "No shipping methods detected."}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Variant Engine (v4.7) */}
                    {product.variants && product.variants.length > 0 && (
                        <div className="space-y-6">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Inventory Matrix ({product.variants.length})</h4>
                            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {product.variants.map((v, i) => (
                                    <button 
                                        key={v.sku_id || i}
                                        onClick={() => setSelectedVariant(v)}
                                        className={cn(
                                            "p-4 rounded-2xl border-2 text-left transition-all",
                                            selectedVariant?.sku_id === v.sku_id 
                                                ? "border-slate-950 bg-slate-50" 
                                                : "border-slate-100 hover:border-slate-300 bg-white"
                                        )}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[80px]">{v.color} {v.size !== "Standard" ? `(${v.size})` : ""}</span>
                                            <span className="text-[10px] font-black text-slate-950">${v.price.toFixed(2)}</span>
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-600 truncate">SKU: {v.sku}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-8">
                        <button 
                            className="w-full py-8 bg-slate-950 text-white rounded-[2.5rem] text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-2xl group"
                        >
                            <Zap size={20} className="group-hover:animate-pulse" /> Finalize Selection
                        </button>
                        <p className="text-center mt-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            RATING: {product.rating || "No rating yet"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplierProductDetail;
