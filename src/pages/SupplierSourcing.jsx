import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  DollarSign, 
  ShieldAlert, 
  Zap,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Activity,
  Layers,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import cjService from '../services/cj.service';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import SourcingStatusHeader from '../components/sourcing/SourcingStatusHeader';

/**
 * 🧠 CJ Dropshipping Post-Selection Intelligence Engine
 * Activates ONLY upon user selection from eBay Discovery.
 */
const SupplierSourcing = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const { ebayProduct, targetPrice = 50, batchContext } = location.state || {};
    
    // Core Intelligence State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [intel, setIntel] = useState(null);

    useEffect(() => {
        if (!ebayProduct?.id) return;
        
        let isMounted = true;
        
        const executeIntelligenceEngine = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // Ensure connection is viable
                const authCheck = await cjService.testConnection();
                if (authCheck.cjConnectionStatus !== 'CONNECTED') {
                    throw new Error("CJ Vault is unreachable or unauthenticated.");
                }

                const payload = await cjService.buildIntelligencePayload({ 
                    ebayProduct, 
                    batchContext 
                });
                
                if (isMounted && payload.status === "CJ_INTELLIGENCE_READY") {
                    setIntel(payload);
                    toast.success("Intelligence Payload Derived");
                }
            } catch (err) {
                console.error("[CJ ENGINE CRASH]", err);
                if (isMounted) {
                    setError(err.message || "Failed to derive mathematical models from CJ.");
                    toast.error("Intelligence Pipeline Failed");
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        executeIntelligenceEngine();
        
        return () => { isMounted = false; };
    }, [ebayProduct]);

    if (!ebayProduct) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-[#0B1220]">
                <ShieldAlert size={40} className="text-rose-500 mb-6" />
                <h3 className="text-xl font-black text-white italic tracking-tighter uppercase mb-4">No Target Specified</h3>
                <button onClick={() => navigate('/discovery')} className="text-[10px] uppercase font-black tracking-widest text-[#2A3A55] hover:text-white">
                    Return to Discovery
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-[#0B1220]">
                <Activity size={40} className="text-emerald-500 animate-pulse mb-6" />
                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Connecting to CJ Dropshipping Intelligence</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-4 animate-pulse">Running Mathematical Models & Risk Engines...</p>
            </div>
        );
    }

    if (error) {
        return (
             <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-[#0B1220]">
                <AlertTriangle size={60} className="text-rose-500 mb-6" />
                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Engine Failure</h3>
                <p className="text-[12px] font-medium text-slate-400 mt-4 max-w-md text-center border border-rose-500/20 bg-rose-500/5 p-4 rounded-xl">
                    {error}
                </p>
                <div className="flex gap-4 mt-8">
                    <button onClick={() => navigate('/discovery')} className="px-8 py-3 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-emerald-500 hover:text-white transition-all">
                        Return to Discovery
                    </button>
                    <button onClick={() => window.location.reload()} className="px-8 py-3 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-white/10 transition-all">
                        Retry Match
                    </button>
                </div>
            </div>
        );
    }

    if (!intel) return null;

    // Data Destructuring for clean UI
    const { 
        cj_product, 
        roi, 
        shipping, 
        risk, 
        variants, 
        sell_score 
    } = intel;

    const getScoreColor = (classification) => {
        if (classification === 'SELL') return 'text-emerald-500';
        if (classification === 'REVIEW') return 'text-yellow-500';
        return 'text-rose-500';
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-12 pb-40 px-6 font-inter pt-10">
            {/* Header: Identity Alignment */}
            <div className="flex items-center justify-between p-8 bg-[#0B1220] border border-white/5 rounded-[2.5rem] shadow-2xl">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="w-14 h-14 rounded-2xl bg-[#111C33] flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-inner border border-white/5">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Commerce Intelligence</h1>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-2">{intel.status}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4 bg-[#111C33] p-2 rounded-[2rem] border border-white/5">
                    <div className="flex items-center gap-4 px-4">
                        <img src={ebayProduct.image} className="w-12 h-12 rounded-xl object-cover" alt="" />
                        <ArrowRight size={16} className="text-slate-600" />
                        <img src={cj_product.image || ebayProduct.image} className="w-12 h-12 rounded-xl object-cover border border-white/10" alt="" />
                    </div>
                    <div className="pr-6 pl-2 border-l border-white/5 py-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Target Identity</span>
                        <span className="text-[12px] font-bold text-white uppercase line-clamp-1 max-w-[200px]">
                            {cj_product.title}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* 1. Core Synthesis & Classification */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Sell Score Orchestration */}
                    <div className="p-10 bg-[#111C33] border border-emerald-500/20 rounded-[2.5rem] shadow-[0_0_40px_rgba(16,185,129,0.05)] relative overflow-hidden group">
                        <div className="absolute -right-8 -top-8 text-emerald-500/5 group-hover:scale-110 transition-transform duration-700">
                            <Activity size={200} />
                        </div>
                        <div className="relative z-10 flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Composite Sell Score</span>
                                <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10", getScoreColor(sell_score.classification))}>
                                    GRADE: {sell_score.classification}
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className={cn("text-8xl font-black italic tracking-tighter leading-none", getScoreColor(sell_score.classification))}>
                                    {sell_score.sell_score}
                                </span>
                                <span className="text-slate-500 font-bold">/100</span>
                            </div>
                        </div>
                    </div>

                    {/* ROI Engine Output */}
                    <div className="p-10 bg-[#0B1220] border border-white/5 rounded-[2.5rem] flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-8">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <DollarSign size={14} className="text-emerald-500" /> ROI & Margin Matrix
                            </span>
                            <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-white/10", 
                                roi.profit_label === 'HIGH' ? "text-emerald-400 bg-emerald-500/10" : 
                                roi.profit_label === 'MEDIUM' ? "text-yellow-400 bg-yellow-500/10" : "text-rose-400 bg-rose-500/10"
                            )}>
                                {roi.profit_label} MARGIN
                            </span>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="flex items-end justify-between border-b border-white/5 pb-4">
                                <span className="text-slate-500 font-medium text-sm">Calculated Profit (Per Sale)</span>
                                <span className="text-3xl font-black text-white italic">${roi.roi_value}</span>
                            </div>
                            <div className="flex items-end justify-between">
                                <span className="text-slate-500 font-medium text-sm">Operating Margin</span>
                                <span className="text-3xl font-black text-emerald-400 italic">+{roi.roi_percent}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Logistics Engine Output */}
                    <div className="p-8 bg-[#0B1220] border border-white/5 rounded-[2.5rem] space-y-6">
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-indigo-500/10 rounded-xl">
                                 <Truck size={20} className="text-indigo-400" />
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Logistics & Freight</span>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div className="bg-[#111C33] p-5 rounded-2xl border border-white/5">
                                 <span className="text-[9px] text-slate-500 block uppercase tracking-widest mb-2">Delivery Window</span>
                                 <span className="text-lg font-black text-white uppercase">{shipping.delivery_estimate}</span>
                             </div>
                             <div className="bg-[#111C33] p-5 rounded-2xl border border-white/5">
                                 <span className="text-[9px] text-slate-500 block uppercase tracking-widest mb-2">Origin Hub</span>
                                 <span className="text-lg font-black text-white uppercase">{shipping.warehouse}</span>
                             </div>
                         </div>
                         <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-t border-white/5 pt-4">
                             System Freight Score: <span className="text-indigo-400">{shipping.shipping_score}/100</span>
                         </div>
                    </div>

                     {/* Risk Assessment Engine */}
                     <div className="p-8 bg-[#0B1220] border border-white/5 rounded-[2.5rem] space-y-6">
                         <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                 <div className={cn("p-2 rounded-xl", risk.risk_level === 'HIGH' ? 'bg-rose-500/10' : 'bg-emerald-500/10')}>
                                     <ShieldAlert size={20} className={risk.risk_level === 'HIGH' ? 'text-rose-500' : 'text-emerald-500'} />
                                 </div>
                                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Threat Assessment</span>
                             </div>
                             <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-white/10", 
                                risk.risk_level === 'HIGH' ? "text-rose-400 bg-rose-500/10" : 
                                risk.risk_level === 'MEDIUM' ? "text-yellow-400 bg-yellow-500/10" : "text-emerald-400 bg-emerald-500/10"
                            )}>
                                {risk.risk_level} RISK
                            </span>
                         </div>

                         <div className="bg-[#111C33] p-5 rounded-2xl border border-white/5 min-h-[90px]">
                             {risk.risk_flags.length === 0 ? (
                                 <div className="flex items-center gap-2 text-emerald-500 text-[12px] font-black uppercase">
                                     <CheckCircle2 size={16} /> Zero critical risk flags detected
                                 </div>
                             ) : (
                                 <div className="space-y-3">
                                     {risk.risk_flags.map((flag, idx) => (
                                         <div key={idx} className="flex items-center gap-2 text-rose-400 text-[11px] font-bold uppercase tracking-tight">
                                             <AlertTriangle size={14} /> {flag}
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </div>
                         <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-t border-white/5 pt-4">
                             Current Core Stock: <span className="text-white">{cj_product.stock} units</span>
                         </div>
                    </div>
                </div>

                {/* 2. Variants Engine array sidebar */}
                <div className="lg:col-span-4 bg-[#0B1220] border border-white/5 rounded-[2.5rem] p-8 flex flex-col h-full max-h-[800px]">
                    <div className="flex items-center gap-3 mb-8">
                         <div className="p-2 bg-slate-800 rounded-xl">
                             <Layers size={20} className="text-slate-300" />
                         </div>
                         <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">SKU Array Engine</span>
                            <span className="text-sm font-black text-white">{variants.variants.length} Mapped Variants</span>
                         </div>
                     </div>

                     <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                         {!variants.has_variants ? (
                             <div className="p-8 text-center border border-white/5 rounded-2xl bg-[#111C33]">
                                 <p className="text-[11px] uppercase tracking-widest font-black text-slate-500">No variant branches found</p>
                             </div>
                         ) : (
                             variants.variants.map((v, i) => (
                                 <div key={i} className="p-4 bg-[#111C33] rounded-2xl border border-white/5 flex items-center justify-between">
                                     <div className="flex flex-col">
                                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SKU: {String(v.sku_id).slice(0, 12)}...</span>
                                         <span className="text-[12px] font-bold text-white uppercase mt-1">{v.attributes}</span>
                                     </div>
                                     <div className="flex flex-col items-end">
                                         <span className="text-[14px] font-black text-emerald-400 italic">${v.price}</span>
                                     </div>
                                 </div>
                             ))
                         )}
                     </div>

                     <div className="pt-8 border-t border-white/5 mt-8 space-y-4">
                         <a 
                            href={`https://cjdropshipping.com/product-detail.html?id=${cj_product.cj_product_id}`}
                            target="_blank" rel="noreferrer"
                            className="w-full flex items-center justify-center gap-2 py-4 bg-[#111C33] border border-white/10 hover:bg-white hover:text-black transition-colors rounded-xl text-[11px] font-black uppercase tracking-widest text-white"
                         >
                             View Raw CJ Metadata <ExternalLink size={14} />
                         </a>
                         
                         <button className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 transition-colors text-black rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                             Sync to Catalog
                         </button>
                     </div>
                </div>

            </div>
        </div>
    );
};

export default SupplierSourcing;
