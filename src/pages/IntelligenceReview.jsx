import React, { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Target, 
  TrendingUp, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldQuestion,
  ExternalLink,
  Zap,
  BarChart3,
  DollarSign,
  CircleDot,
  ArrowRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import sourcingService from '../services/sourcing';

// Confidence Level Badge (Deterministic Metadata Quality Indicator)
const ConfidenceBadge = ({ level }) => {
    const styles = {
      High: "bg-green-500/10 text-green-500 border-green-500/30",
      Medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
      Low: "bg-red-500/10 text-red-500 border-red-500/30"
    };
    const Icon = level === 'High' ? ShieldCheck : (level === 'Medium' ? ShieldQuestion : ShieldAlert);
    
    return (
      <div className={cn("px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2", styles[level])}>
        <Icon size={14} /> {level} Confidence Level
      </div>
    );
  };

/**
 * Stage II: Product Intelligence Review (Real-Data Due Diligence)
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
      <div className="h-[70vh] flex flex-col items-center justify-center gap-8 animate-in fade-in">
         <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-[2rem] flex items-center justify-center text-slate-700">
            <ShieldAlert size={40} />
         </div>
         <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Market Intelligence Buffer Empty</p>
         <button onClick={() => navigate('/discovery')} className="p-4 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary transition-all">
            Return to Market Research <ArrowRight size={14} />
         </button>
      </div>
    );
  }

  const sellData = useMemo(() => sourcingService.calculateSellScore(product, batchContext), [product, batchContext]);

  const handleConnectProvider = () => {
    // Stage III: Provider Selection logic starts here
    navigate('/products'); 
  };

  return (
    <div className="max-w-[1250px] mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 font-inter pb-40">
      
      {/* 🧭 NAVIGATION HEADER */}
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-8">
            <button 
              onClick={() => navigate(-1)}
              className="w-14 h-14 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 transition-all bg-slate-900 shadow-xl"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
               <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Market Intelligence.</h1>
               <div className="flex items-center gap-4 mt-3">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest tracking-[0.2em]">Investment Due Diligence Review</p>
                  <div className="w-1 h-1 rounded-full bg-slate-700" />
                  <ConfidenceBadge level={sellData.confidence} />
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
         
         {/* 1. PRODUCT OVERVIEW (LEFT) */}
         <div className="lg:col-span-5 space-y-10">
            <div className="bg-slate-900 border border-slate-800 p-5 h-[450px] overflow-hidden rounded-[2.5rem] shadow-2xl relative group">
               <img 
                 src={product.thumbnail || product.image_url} 
                 alt={product.title}
                 className="w-full h-full object-cover rounded-[2rem] transition-transform duration-700 group-hover:scale-105"
               />
               <div className="absolute top-8 right-8">
                  <div className="px-4 py-2 bg-slate-950/80 backdrop-blur-md rounded-xl border border-white/10 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                     <Target size={14} className="text-primary" /> Live Listing
                  </div>
               </div>
            </div>
            <div className="space-y-6 px-4">
               <h2 className="text-3xl font-bold text-white leading-tight italic tracking-tight">{product.title}</h2>
               <div className="flex items-center gap-8">
                  <div className="flex flex-col">
                     <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none mb-3">Target Price</span>
                     <span className="text-4xl font-black text-white italic tracking-tighter leading-none">${product.price}</span>
                  </div>
                  <div className="h-12 w-px bg-slate-800" />
                  <a 
                    href={product.itemWebUrl || `https://www.ebay.com/itm/${product.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[11px] font-black text-primary uppercase tracking-widest flex items-center gap-2 hover:text-white transition-all underline underline-offset-8 decoration-primary/30"
                  >
                     Research Listing on eBay <ExternalLink size={16} />
                  </a>
               </div>
            </div>
         </div>

         {/* 2. MARKET ANALYTICS TERMINAL (RIGHT) */}
         <div className="lg:col-span-7 space-y-10">
            
            {/* 🧠 STRATEGIC DECISION SUMMARY */}
            <div className="bg-primary hover:bg-white text-slate-950 p-10 rounded-[3rem] relative overflow-hidden transition-all group shadow-2xl">
               <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform">
                  <ShieldCheck size={140} />
               </div>
               <div className="relative z-10 space-y-5">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-950 rounded-xl text-white text-[10px] font-black uppercase tracking-widest">
                     <Zap size={16} className="text-primary fill-primary" /> AI Intelligence Summary
                  </div>
                  <p className="text-2xl font-black leading-tight max-w-lg italic tracking-tighter">
                    "{sellData.summary}"
                  </p>
               </div>
            </div>

            {/* 📊 CORE ANALYTICS GRID */}
            <div className="grid grid-cols-2 gap-8">
               <div className="bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] space-y-4 hover:border-slate-700 transition-all shadow-xl">
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Market Yield Score</p>
                  <div className="flex items-end gap-4">
                     <span className="text-5xl font-black text-white italic tracking-tighter leading-none">{sellData.score}</span>
                     <span className={cn("text-[11px] font-black uppercase px-2 py-1 rounded border leading-none mb-1", sellData.isWinner ? "text-green-500 border-green-500/20 bg-green-500/5" : "text-yellow-500 border-yellow-500/20 bg-yellow-500/5")}>
                        {sellData.status}
                     </span>
                  </div>
               </div>

               <div className="bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] space-y-4 hover:border-slate-700 transition-all shadow-xl">
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Price Distribution</p>
                  <div className="flex items-center gap-4">
                     <BarChart3 className={sellData.metrics.priceYield > 0.1 ? "text-green-400" : "text-slate-500"} size={28} />
                     <span className="text-2xl font-black italic tracking-tighter text-white uppercase leading-none">
                        {Math.abs(parseFloat(sellData.metrics.priceYield) * 100).toFixed(0)}% {parseFloat(sellData.metrics.priceYield) > 0 ? 'Under' : 'Over'} Avg
                     </span>
                  </div>
               </div>
            </div>

            {/* REAL-TIME MARKET SIGNALS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {[
                 { label: 'Demand Velocity', value: sellData.score >= 50 ? 'High' : 'Stable', icon: CircleDot, color: 'text-green-400' },
                 { label: 'Market Density', value: product.totalFound < 500 ? 'Low Saturation' : 'Balanced', icon: Target, color: 'text-blue-400' },
                 { label: 'Arbitrage Yield', value: sellData.metrics.priceYield > 0 ? 'Positive' : 'Baseline', icon: DollarSign, color: 'text-emerald-400' }
               ].map((m, i) => (
                 <div key={i} className="bg-slate-950 border border-slate-800 rounded-3xl p-6 flex items-center gap-5 hover:bg-slate-900 transition-colors">
                    <div className={cn("w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center", m.color)}>
                       <m.icon size={20} />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1.5">{m.label}</span>
                       <span className="text-[11px] font-black text-white uppercase tracking-tight leading-none">{m.value}</span>
                    </div>
                 </div>
               ))}
            </div>

            {/* 🔗 STAGE III: SOURCE STRATEGY */}
            <div className="flex flex-col gap-8 pt-6">
               <div className="flex items-center gap-4 p-6 bg-slate-900/40 rounded-3xl border border-slate-800/50 italic">
                  <Info size={20} className="text-primary shrink-0" />
                  <p className="text-[11px] font-medium text-slate-400 leading-relaxed max-w-xl">
                    By initializing sourcing, the system will verify supply chain compatibility with production-grade providers across AliExpress and eProlo.
                  </p>
               </div>
               
               <div className="flex items-center gap-6">
                  <button 
                    onClick={handleConnectProvider}
                    className="flex-1 px-10 py-5 bg-white text-slate-950 rounded-[2rem] text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-primary transition-all active:scale-[0.98] shadow-2xl shadow-white/5 group"
                  >
                    Initialize Sourcing Bridge
                    <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform duration-300" />
                  </button>
                  <button 
                    onClick={() => navigate('/discovery')}
                    className="px-12 py-5 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 rounded-[2rem] text-[11px] font-black uppercase tracking-widest transition-all"
                  >
                    Discard Analysis
                  </button>
               </div>
            </div>

         </div>

      </div>
    </div>
  );
};

export default IntelligenceReview;
