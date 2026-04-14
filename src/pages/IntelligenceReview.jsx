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

/**
 * Stage II: Product Intelligence Review (Interstellar Due Diligence)
 * Enforcing 'One Decision at a Time' protocol.
 */
const IntelligenceReview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Retrieve product from state or mock for layout
  const product = location.state?.product || {
    id,
    title: "Intelligence Buffer Empty - Please return to Discovery",
    price: 0,
    thumbnail: null
  };

  const sellData = useMemo(() => sourcingService.calculateSellScore(product), [product]);

  const handleConnectProvider = () => {
    // Stage III: Provider Selection / Inventory Import
    toast.success("Intelligence Verified. Initializing Provider Connection...");
    setTimeout(() => {
        navigate('/products'); // Forward to Inventory after 'matching'
    }, 1500);
  };

  if (!location.state?.product) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-6 animate-in fade-in">
         <ShieldAlert size={64} className="text-slate-800" />
         <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Protocol Sync Failure - Target ID Missing</p>
         <button onClick={() => navigate('/discovery')} className="btn-decision btn-outline">Return to Stage I</button>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 font-inter pb-32">
      
      {/* 🧭 NAVIGATION HEADER */}
      <div className="flex items-center gap-6">
         <button 
           onClick={() => navigate(-1)}
           className="w-12 h-12 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-600 transition-all"
         >
           <ArrowLeft size={20} />
         </button>
         <div>
            <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Intelligence Review.</h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Stage II: Investment Due Diligence Nodes</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
         
         {/* 1. PRODUCT OVERVIEW (LEFT) */}
         <div className="lg:col-span-5 space-y-8">
            <div className="saas-card p-4 h-[400px] overflow-hidden">
               <img 
                 src={product.thumbnail || product.image_url} 
                 alt={product.title}
                 className="w-full h-full object-cover rounded-2xl"
               />
            </div>
            <div className="space-y-4">
               <h2 className="text-2xl font-bold text-white leading-tight">{product.title}</h2>
               <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">Market Price</span>
                     <span className="text-3xl font-black text-white italic tracking-tighter leading-none">${product.price}</span>
                  </div>
                  <div className="h-10 w-px bg-slate-800" />
                  <a 
                    href={`https://www.ebay.com/itm/${product.id}`} 
                    target="_blank" 
                    className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 hover:text-blue-300 transition-all"
                  >
                     eBay Reference <ExternalLink size={14} />
                  </a>
               </div>
            </div>
         </div>

         {/* 2. MARKET INSIGHTS PANEL (RIGHT) */}
         <div className="lg:col-span-7 space-y-8">
            
            {/* 🧠 DECISION LAYER SUMMARY */}
            <div className="bg-blue-500/5 border border-blue-500/20 p-8 rounded-[2.5rem] relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                  <ShieldCheck size={120} className="text-blue-400" />
               </div>
               <div className="relative z-10 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-[10px] font-black uppercase tracking-widest">
                     <Zap size={14} /> Intelligence Summary
                  </div>
                  <p className="text-xl font-bold text-text-primary leading-relaxed italic max-w-lg">
                    "{sellData.summary}"
                  </p>
               </div>
            </div>

            {/* 📊 CORE ANALYTICS GRID */}
            <div className="grid grid-cols-2 gap-6">
               <div className="saas-card p-8 space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sell Score</p>
                  <div className="flex items-end gap-3">
                     <span className="text-4xl font-black text-white italic tracking-tighter leading-none">{sellData.score}</span>
                     <span className={cn("text-[10px] font-bold uppercase", sellData.score >= 80 ? "text-green-500" : "text-yellow-500")}>
                        {sellData.status}
                     </span>
                  </div>
               </div>

               <div className="saas-card p-8 space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk Factor</p>
                  <div className="flex items-center gap-3">
                     {sellData.risk.level === 'Low' ? <ShieldCheck className="text-green-500" /> : <ShieldAlert className="text-yellow-500" />}
                     <span className="text-2xl font-black italic tracking-tighter text-white uppercase leading-none">{sellData.risk.label}</span>
                  </div>
               </div>
            </div>

            {/* METRIC BREAKDOWN NODES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {[
                 { label: 'Demand', value: sellData.labels.demand, icon: CircleDot, color: 'text-green-500' },
                 { label: 'Competition', value: sellData.labels.competition, icon: BarChart3, color: 'text-blue-400' },
                 { label: 'Trend Node', value: sellData.labels.trend, icon: TrendingUp, color: 'text-purple-400' }
               ].map((m, i) => (
                 <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                    <m.icon className={m.color} size={18} />
                    <div className="flex flex-col">
                       <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{m.label}</span>
                       <span className="text-[11px] font-black text-white uppercase tracking-tight leading-none">{m.value}</span>
                    </div>
                 </div>
               ))}
            </div>

            <div className="h-px bg-slate-800/50" />

            {/* 🔗 STAGE III BRIDGE */}
            <div className="flex flex-col gap-6">
               <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                  <Info size={16} className="text-slate-500 shrink-0" />
                  <p className="text-[10px] font-medium text-slate-400 leading-relaxed italic">
                    By proceeding, the system will initialize the provider connection sequence to match this product node with a high-margin supply chain variant.
                  </p>
               </div>
               
               <div className="flex items-center gap-4">
                  <button 
                    onClick={handleConnectProvider}
                    className="btn-decision btn-primary flex-1 group"
                  >
                    Connect to Providers
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={() => navigate('/discovery')}
                    className="btn-decision btn-outline px-10"
                  >
                    Discard Node
                  </button>
               </div>
            </div>

         </div>

      </div>
    </div>
  );
};

export default IntelligenceReview;
