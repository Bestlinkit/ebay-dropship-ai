import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  ExternalLink, 
  ShieldCheck, 
  Star, 
  Truck, 
  Package, 
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Info,
  Loader2,
  Lock,
  Layers,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import sourcingService from '../services/sourcing';
import { cn } from '../lib/utils';

const SupplierProductDetail = () => {
    const { source, id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Context from previous search
    const targetProduct = location.state?.targetProduct;
    const targetPrice = Number(location.state?.targetPrice || 0);

    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [activeImage, setActiveImage] = useState(0);

    useEffect(() => {
        const fetchDeepDetails = async () => {
            // 🚀 Bypassing legacy API - Unified Sourcing Payload Detection
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
                const result = await sourcingService.getProductDetails(id);
                if (result.status === 'SUCCESS') {
                    setProduct(result.data);
                    if (result.data.variants && result.data.variants.length > 0) {
                        setSelectedVariant(result.data.variants[0]);
                    }
                } else {
                    toast.error(`API Fetch Failure: ${result.message}`);
                }
            } catch (error) {
                console.error("Deep Enrichment Fault:", error);
                toast.error(`AliExpress API Connection Lost`);
            } finally {
                setLoading(false);
            }
        };

        fetchDeepDetails();
    }, [source, id]);

    const handleOptimize = () => {
        if (!product) return;

        const vendorSnapshot = {
            title: product.title,
            images: product.images || [product.image],
            description: product.description,
            pricing: {
                selectedVariantPrice: selectedVariant?.price || product.price,
                totalCost: (selectedVariant?.price || product.price) + (product.shipping || 0),
                targetPrice: targetPrice
            },
            supplier: {
                source: product.source,
                id: product.id,
                url: product.url,
                rating: product.rating
            }
        };

        navigate('/optimize/new', { 
            state: { 
                importedProduct: vendorSnapshot 
            } 
        });
        toast.success("Intelligence Snapshot Captured. Launching Optimization Studio.");
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Lock size={20} className="text-slate-400" />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-black uppercase tracking-widest text-slate-950 italic">Compiling Metadata</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Processing Data Classifications...</p>
                </div>
            </div>
        );
    }

    const roi = sourcingService.calculateROI(targetPrice, selectedVariant?.price || product?.price || 0, product?.shipping || 0);
    const trust = sourcingService.evaluateSupplierTrust(product);

    return (
        <div className="max-w-[1400px] mx-auto px-6 pb-40 pt-10 animate-in fade-in duration-700">
            {/* 1. Header Navigation */}
            <div className="flex items-center justify-between mb-12">
                <button onClick={() => navigate(-1)} className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-2xl hover:border-slate-400 transition-all text-[11px] font-black uppercase tracking-widest shadow-sm">
                    <ArrowLeft size={16} /> Return to Inventory
                </button>
                <div className="flex items-center gap-4">
                    <div className="px-6 py-3 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl">
                        <Lock size={14} className="text-emerald-400" /> Sourcing Terminal: Locked
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                {/* 2. Visual Intelligence (Left Column) */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm relative group">
                        <img 
                            src={product?.images?.[activeImage] || product?.image} 
                            alt={product.title} 
                            className="w-full aspect-square object-contain p-10 bg-white"
                        />
                        <div className="absolute bottom-10 left-10 flex items-center gap-2">
                            <span className="px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-xl bg-orange-600">
                                AliExpress Protocol 1.2.5
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-4">
                        {(product.images || [product.image]).slice(0, 5).map((img, i) => (
                            <button 
                                key={i}
                                onClick={() => setActiveImage(i)}
                                className={cn(
                                    "aspect-square rounded-2xl border-2 overflow-hidden transition-all bg-white",
                                    activeImage === i ? "border-slate-950 shadow-md" : "border-slate-200 opacity-60 hover:opacity-100"
                                )}
                            >
                                <img src={img} className="w-full h-full object-cover" alt="" />
                            </button>
                        ))}
                    </div>

                    {/* Description Preview */}
                    <div className="p-10 bg-slate-50 border border-slate-200 rounded-[3rem] space-y-6">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <Info size={14} /> Supplier Metadata
                        </h4>
                        <div className="text-sm font-medium text-slate-600 leading-relaxed max-h-60 overflow-y-auto pr-4 custom-scrollbar">
                            {product.description || "No description provided by supplier."}
                        </div>
                    </div>
                </div>

                {/* 3. Decision Logic (Right Column) */}
                <div className="lg:col-span-5 space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-black text-slate-950 italic tracking-tighter leading-none uppercase">
                            {product.title}
                        </h1>
                        <div className="flex items-center gap-6">
                            <a 
                                href={product.url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 hover:text-slate-950 transition-all"
                            >
                                Original Listing <ExternalLink size={12} />
                            </a>
                        </div>
                    </div>

                    {/* ROI Pulse Card */}
                    <div className="p-8 bg-white border-2 border-slate-950 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                            <TrendingUp size={40} className="text-slate-50 opacity-10" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier Base Price</p>
                                    <p className="text-4xl font-black text-slate-950 italic">${(selectedVariant?.price || product.price).toFixed(2)}</p>
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. ROI</p>
                                    <p className={cn(
                                        "text-4xl font-black italic",
                                        roi ? "text-emerald-600" : "text-rose-500"
                                    )}>
                                        {roi ? `${roi.expected}%` : "---"}
                                    </p>
                                </div>
                            </div>
                            
                            {!roi && (
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3">
                                    <AlertTriangle size={16} className="text-rose-500" />
                                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Awaiting pricing data</p>
                                </div>
                            )}

                            <div className="h-[1px] bg-slate-100 w-full" />
                            
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                <div className="flex items-center gap-2"><Truck size={14} /> {product.delivery}</div>
                                <div className="flex items-center gap-2"><Package size={14} /> {product.shipsFrom}</div>
                            </div>
                        </div>
                    </div>

                    {/* 🧠 MARKET INTELLIGENCE ENGINE REPORT (v25.0 Structured) */}
                    {location.state?.sellData && (
                        <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] space-y-8 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                    <Zap size={16} className="text-emerald-500 fill-emerald-500" /> Market Intelligence Report
                                </h4>
                                <div className="px-3 py-1 bg-slate-950 text-white rounded-lg text-[10px] font-black italic shadow-lg">
                                    Resell Score: {location.state.sellData.resellScore}
                                </div>
                            </div>

                            {/* Interpretation Hub */}
                            <div className="grid grid-cols-1 gap-4">
                                {(location.state.sellData.interpretation?.insights || []).map((insight) => {
                                    const IconMap = { Layers, Target, Zap };
                                    const Icon = IconMap[insight.icon] || Info;
                                    
                                    return (
                                        <div key={insight.id} className="p-5 bg-white border border-slate-200 rounded-2xl flex items-start gap-4 hover:border-slate-400 transition-colors group shadow-sm">
                                            <div className={cn(
                                                "p-3 rounded-xl shrink-0 transition-colors",
                                                insight.type === 'positive' ? "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-500 group-hover:text-white" :
                                                insight.type === 'negative' ? "bg-rose-100 text-rose-700 group-hover:bg-rose-500 group-hover:text-white" :
                                                "bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white"
                                            )}>
                                                <Icon size={20} />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{insight.label}</span>
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded text-[8px] font-black uppercase",
                                                        insight.type === 'positive' ? "bg-emerald-600 text-white" :
                                                        insight.type === 'negative' ? "bg-rose-600 text-white" :
                                                        "bg-slate-800 text-white"
                                                    )}>
                                                        {insight.value}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] font-bold text-slate-700 leading-relaxed italic">
                                                    "{insight.description}"
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Zap size={40} className="text-emerald-500" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Star size={14} className="text-emerald-500 fill-emerald-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Executive Verdict</span>
                                    </div>
                                    <p className="text-[12px] font-black text-white italic leading-snug">
                                        {location.state.sellData.verdict || location.state.sellData.summary}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Trust & Ratings (AliExpress Only) */}
                    {source.toLowerCase() === 'aliexpress' && (
                        <div className="p-8 bg-slate-950 rounded-[2.5rem] text-white space-y-6 shadow-xl">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Supplier Authority</h4>
                                <ShieldCheck size={20} className="text-emerald-400" />
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Rating Score</p>
                                    <div className="flex items-center gap-2">
                                        <Star size={18} className="text-amber-400 fill-amber-400" />
                                        <span className="text-xl font-black italic">{trust.label}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Review Volume</p>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 size={18} className="text-emerald-400" />
                                        <span className="text-xl font-black italic">{product.reviews || 0}+ Reviews</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Variant Engine */}
                    {product.variants && product.variants.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Inventory Matrix</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {product.variants.slice(0, 10).map((variant, i) => (
                                    <button 
                                        key={variant.id || i}
                                        onClick={() => setSelectedVariant(variant)}
                                        className={cn(
                                            "p-4 rounded-2xl border-2 text-left transition-all",
                                            selectedVariant?.id === variant.id 
                                                ? "border-slate-950 bg-slate-50 shadow-sm" 
                                                : "border-slate-100 hover:border-slate-300 bg-white"
                                        )}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Variant</span>
                                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">${variant.price.toFixed(2)}</span>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-950 truncate">{variant.sku || `Option ${i + 1}`}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Master Action */}
                    <div className="pt-8">
                        <button 
                            onClick={handleOptimize}
                            className="w-full py-8 bg-slate-950 text-white rounded-[2.5rem] text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-2xl group"
                        >
                            <Zap size={20} className="group-hover:animate-pulse" /> Launch Optimization Studio
                        </button>
                        <p className="text-center mt-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            Intelligence snapshot will be captured immediately
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplierProductDetail;
