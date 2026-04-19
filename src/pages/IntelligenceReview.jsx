import React, { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Target, 
  ShieldCheck, 
  AlertTriangle, 
  ShieldQuestion,
  ExternalLink,
  Zap,
  BarChart3,
  DollarSign,
  ArrowRight,
  Info,
  Activity,
  Wand2 as Sparkles,
  Layers
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import sourcingService from '../services/sourcing';

// Confidence Level Badge (AI-Assisted Multi-Signal Indicator)
const ConfidenceBadge = ({ level }) => {
    const styles = {
      High: "bg-green-500/10 text-green-500 border-green-500/30",
      Medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
      Low: "bg-red-500/10 text-red-500 border-red-500/30"
    };
    const Icon = level === 'High' ? ShieldCheck : (level === 'Medium' ? ShieldQuestion : AlertTriangle);
    
    return (
      <div className={cn("px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2", styles[level])}>
        <Icon size={14} /> {level} Confidence
      </div>
    );
  };

/**
 * Stage II: Market Intelligence Review (v12.1 Humanized)
 * Professional investment analysis for eBay marketplace opportunities.
 */
const IntelligenceReview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Retrieve product & context from state
  const product = location.state?.product;
  const batchContext = location.state?.batchContext;

  if (!product) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-8 animate-in fade-in bg-[#0B1220]">
         <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-[2rem] flex items-center justify-center text-slate-700">
            <AlertTriangle size={40} className="text-rose-500" />
         </div>
         <div className="error-banner px-6 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
            System Alert: CJ Bridge Issue Detected
         </div>
         <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Market Context Registry Empty</p>
         <button onClick={() => navigate('/discovery')} className="p-4 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-500 transition-all font-inter">
            Return to Market Research <ArrowRight size={14} />
         </button>
      </div>
    );
  }

  const sellData = useMemo(() => sourcingService.calculateSellScore(product, batchContext), [product, batchContext]);

  const handleConnectProvider = () => {
    navigate('/products'); 
  };

  return (
    <div className="max-w-[1300px] mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 font-inter pb-40 px-6">
      
      {/* 🧭 NAVIGATION & CONTEXT HEADER */}
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-10">
            <button 
              onClick={() => navigate(-1)}
              className="w-16 h-16 rounded-3xl border border-[#2A3A55] flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all bg-[#111C33] shadow-2xl"
            >
              <ArrowLeft size={28} />
            </button>
            <div className="space-y-2">
               <h1 className="text-5xl font-black text-slate-950 italic tracking-tighter uppercase leading-none drop-shadow-sm">Intelligence.</h1>
               <div className="flex items-center gap-4">
                  <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.3em]">Smart Business Assistant Feedback</p>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                  <ConfidenceBadge level={sellData.confidence} />
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
         
         {/* 1. PRODUCT SPECIFICATION (LEFT) */}
         <div className="lg:col-span-5 space-y-12">
            <div className="bg-[#111C33] border border-[#2A3A55] p-6 h-[500px] overflow-hidden rounded-[3rem] shadow-3xl relative group">
                <img 
                  src={product?.images?.[0] || product?.image || product?.thumbnail || product?.image_url || "/placeholder-product.png"} 
                  alt={product?.title}
                  className="w-full h-full object-cover rounded-[2.5rem] transition-transform duration-1000 group-hover:scale-105"
                />
               <div className="absolute top-10 right-10">
                  <div className="px-5 py-2.5 bg-[#0B1220]/80 backdrop-blur-xl rounded-2xl border border-white/10 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                     <Target size={16} className="text-emerald-500" /> Top Opportunity
                  </div>
               </div>
            </div>
            <div className="space-y-8 px-6">
               <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-[1.1] italic tracking-tight uppercase drop-shadow-sm">{product.title}</h2>
               <div className="flex flex-col sm:flex-row sm:items-center gap-10">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Optimal Placement</span>
                     <span className="text-5xl font-black text-slate-950 italic tracking-tighter leading-none">
                        {typeof product.price === 'number' ? `$${product.price.toFixed(2)}` : 'N/A'}
                     </span>
                 </div>
                  <div className="hidden sm:block h-16 w-px bg-slate-200" />
                  <a 
                    href={product.itemWebUrl || `https://www.ebay.com/itm/${product.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[12px] font-black text-emerald-600 hover:text-emerald-700 transition-all uppercase tracking-widest flex items-center gap-3 underline underline-offset-[12px] decoration-emerald-500/30 group/link"
                  >
                     View on eBay <ExternalLink size={18} className="group-hover/link:translate-x-1 transition-transform" />
                  </a>
               </div>
            </div>
         </div>

         {/* 2. ANALYTICS TERMINAL (RIGHT) */}
         <div className="lg:col-span-7 space-y-12">
            
            {/* 🧠 STRATEGIC RECOMMENDATION (ACTIONABLE) */}
            <div className="p-8 md:p-12 bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[3.5rem] space-y-10 relative overflow-hidden group shadow-3xl">
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform">
                    <Sparkles size={160} className="text-emerald-500" />
                </div>
                
                <div className="relative z-10 flex flex-col gap-8">
                    <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B1220] rounded-2xl text-white text-[10px] font-black uppercase tracking-widest border border-white/5">
                            <Zap size={18} className="text-emerald-500 fill-emerald-500" /> Intelligence Interpretation
                        </div>
                        <div className="hidden sm:block px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black italic text-slate-400">
                            Record ID: {product.id}
                        </div>
                    </div>

                    {/* Structured Insight Hub */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(sellData.interpretation?.insights || []).map((insight) => {
                            const IconMap = { Layers, Target, Zap };
                            const Icon = IconMap[insight.icon] || Info;
                            
                            return (
                                <div key={insight.id} className="p-6 bg-slate-900/60 border border-white/5 rounded-[2.5rem] flex flex-col gap-4 transition-all hover:bg-emerald-500/5 hover:border-emerald-500/20 group/item shadow-2xl backdrop-blur-md">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xl",
                                        insight.type === 'positive' ? "bg-emerald-500/10 text-emerald-400 group-hover/item:bg-emerald-500 group-hover/item:text-slate-950" :
                                        insight.type === 'negative' ? "bg-rose-500/10 text-rose-400 group-hover/item:bg-rose-500 group-hover/item:text-white" :
                                        "bg-white/5 text-slate-300 group-hover/item:bg-white group-hover/item:text-slate-950"
                                    )}>
                                        <Icon size={24} />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{insight.label}</span>
                                        <span className={cn(
                                            "text-[13px] font-black uppercase tracking-tight",
                                            insight.type === 'positive' ? "text-emerald-400" :
                                            insight.type === 'negative' ? "text-rose-400" :
                                            "text-white"
                                        )}>
                                            {insight.value}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-black text-white/40 leading-relaxed uppercase tracking-widest border-l-2 border-white/5 pl-3 mt-2">
                                        {insight.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Strategic Intelligence [STRICT OVERRIDE] */}
                    <div className="p-10 bg-[#0A0F1E] border border-white/5 rounded-[3rem] relative overflow-hidden group shadow-3xl">
                        <div className="relative z-10 flex flex-col gap-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                                    <Target size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Market Classification</span>
                                    <span className={cn(
                                        "text-[10px] font-black uppercase",
                                        sellData.resellScore >= 70 ? "text-emerald-400" : (sellData.resellScore >= 40 ? "text-yellow-400" : "text-rose-400")
                                    )}>
                                        {sellData.interpretation?.classification}
                                    </span>
                                </div>
                                <span className={cn(
                                    "ml-auto px-4 py-1.5 rounded-full bg-slate-900 border border-white/10 text-[10px] font-black uppercase tracking-widest",
                                    sellData.resellScore >= 70 ? "text-emerald-400" : (sellData.resellScore >= 40 ? "text-yellow-400" : "text-rose-400")
                                )}>
                                    Grade: {sellData.grade}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Target Action</span>
                                      <span className={cn(
                                          "text-4xl font-black uppercase italic tracking-tighter",
                                          sellData.resellScore >= 70 ? "text-emerald-400" : (sellData.resellScore >= 40 ? "text-yellow-400" : "text-rose-400")
                                      )}>
                                          {sellData.interpretation?.action}
                                      </span>
                                   </div>
                                </div>
                                
                                <div className="space-y-4">
                                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Classification Basis</span>
                                   <div className="flex flex-wrap gap-2">
                                       {(sellData.interpretation?.basis || []).map((item, idx) => (
                                           <div key={idx} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-white uppercase tracking-tight">
                                               {item}
                                           </div>
                                       ))}
                                   </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 📊 CORE ANALYTICS ARCHITECTURE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
               <div className="bg-[#111C33] border border-[#2A3A55] p-10 rounded-[3rem] space-y-6 shadow-2xl relative overflow-hidden">
                  <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Resell Score</p>
                  <div className="flex flex-wrap items-center gap-6">
                     <span className={cn(
                         "text-6xl font-black italic tracking-tighter leading-none",
                         sellData.resellScore >= 70 ? "text-emerald-500" : (sellData.resellScore >= 40 ? "text-yellow-500" : "text-rose-500")
                     )}>
                         {sellData.resellScore}%
                     </span>
                     <span className="text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border border-white/10 text-slate-400">
                        {sellData.grade} CLASSIFICATION
                     </span>
                  </div>
               </div>

               <div className="bg-[#111C33] border border-[#2A3A55] p-10 rounded-[3rem] space-y-6 shadow-2xl relative overflow-hidden">
                  <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Market Index</p>
                  <div className="flex items-center gap-6">
                     <Activity className={cn(
                         sellData.resellScore >= 70 ? "text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : (sellData.resellScore >= 40 ? "text-yellow-500" : "text-rose-500")
                     )} size={40} />
                     <div className="flex flex-col">
                        <span className="text-xl font-black italic tracking-tighter text-white uppercase leading-none">
                           {sellData.interpretation?.marketIndex} INDEX
                        </span>
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-2 px-1">Calculated Signal Strength</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* 📈 MARKET MOMENTUM DETAIL (ESTIMATED) */}
            <div className="bg-[#0B1220] border border-[#2A3A55] p-10 rounded-[3rem] space-y-8">
               <div className="flex items-center justify-between">
                  <div className="space-y-1">
                     <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Demand Trend (Last 30 Days)</h4>
                     <p className="text-[9px] font-medium text-slate-600 italic">Based on current market listings and pricing behavior.</p>
                  </div>
                  <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[8px] font-black text-slate-700 uppercase tracking-widest">
                     Market Signal Archive
                  </div>
               </div>
               
               <div className="h-24 w-full flex items-end gap-1 px-2">
                  {sellData.momentum.map((p, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${p.y}%` }}
                      transition={{ delay: i * 0.05, duration: 0.8 }}
                      className={cn("flex-1 rounded-t-sm transition-colors", p.y > 60 ? "bg-emerald-500/40" : "bg-slate-800/40")}
                    />
                  ))}
               </div>
            </div>

            {/* 🔗 STRATEGIC SOURCING BRIDGE */}
            <div className="space-y-10 pt-4">
               <div className="flex items-center gap-6 p-8 bg-[#111C33] rounded-[2.5rem] border border-[#2A3A55]/50 italic shadow-inner">
                  <div className="w-12 h-12 bg-[#0B1220] rounded-2xl flex items-center justify-center shrink-0 border border-white/5">
                     <Info size={24} className="text-emerald-500" />
                  </div>
                  <p className="text-[12px] font-medium text-slate-400 leading-relaxed">
                    Initializing the sourcing bridge will cross-reference this market signal against production-ready supply chains. No investment is committed at this stage.
                  </p>
               </div>
               
               <div className="flex items-center gap-8">
                  <button 
                    onClick={() => navigate('/supplier-sourcing', { 
                        state: { 
                            ebayProduct: {
                                id: product.id,
                                title: product.title,
                                price: Number(product.price) || 0,
                                image: product.image || product.thumbnail || product.image_url || null
                            },
                            targetPrice: Number(product.price) || 0, // EXPLICIT HAND-OFF v4.7.5
                            batchContext 
                        } 
                    })}
                    className="flex-[2] px-12 py-6 bg-white text-slate-950 rounded-[2rem] text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-emerald-500 hover:text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-3xl shadow-white/5 group"
                  >
                    Add to Store
                    <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform duration-300" />
                  </button>
                  <button 
                    onClick={() => navigate('/discovery')}
                    className="flex-1 px-10 py-6 border border-slate-800 text-slate-500 hover:text-white hover:border-white/20 rounded-[2rem] text-[12px] font-black uppercase tracking-widest transition-all hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                  >
                    Discard
                  </button>
               </div>
            </div>
         </div>

      </div>
   </div>
  );
};

export default IntelligenceReview;
