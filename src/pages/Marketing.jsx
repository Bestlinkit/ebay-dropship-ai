import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { 
  Globe, 
  TrendingUp, 
  Megaphone, 
  Target, 
  Plus, 
  Loader2, 
  ShoppingBag, 
  Clock, 
  BarChart3, 
  Percent, 
  UserCheck, 
  Play, 
  Image as ImageLucide, 
  Copy, 
  Link2, 
  CheckCircle2, 
  Activity, 
  RefreshCw, 
  Shield, 
  DollarSign, 
  Package,
  ChevronRight,
  ArrowRight,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ebayTrading from '../services/ebay_trading';
import aiService from '../services/ai';
import { useAuth } from '../context/AuthContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const Marketing = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('marketplace');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  // Neural Studio States
  const [selectedProduct, setSelectedProduct] = useState(location.state?.selectedProduct || null);
  const [generatedCopy, setGeneratedCopy] = useState(null);
  const [copyLoading, setCopyLoading] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState('tiktok');

  const handleGenerateCopy = async (channel) => {
    if (!selectedProduct) {
        toast.error("Select a listing node first.");
        return;
    }
    setSelectedChannel(channel);
    setCopyLoading(true);
    try {
        const copy = await aiService.generateMarketingCopy(selectedProduct.title, channel);
        setGeneratedCopy(copy);
        toast.success(`${channel.toUpperCase()} vectors generated!`);
    } catch (e) {
        toast.error("AI Generation failed.");
    } finally {
        setCopyLoading(false);
    }
  };

  const chartData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    datasets: [
      {
        fill: true,
        label: 'ROAS',
        data: [6.2, 6.5, 6.1, 7.2, 6.8, 7.5, 6.8],
        borderColor: '#0e8ce9',
        backgroundColor: 'rgba(14, 140, 233, 0.05)',
        tension: 0.4,
        borderWidth: 4,
        pointRadius: 0,
      },
      {
        fill: true,
        label: 'Ad Spend',
        data: [4.1, 4.3, 4.8, 5.2, 4.9, 5.5, 5.1],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        tension: 0.4,
        borderWidth: 4,
        pointRadius: 0,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { family: 'Outfit', size: 12, weight: '900' },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 16,
        cornerRadius: 16,
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10, weight: '900' } } },
      y: { display: false }
    }
  };

  const [stats, setStats] = useState([
    { label: 'Bridge Health', value: '...', trend: 'Syncing', icon: Globe, color: 'text-primary-500' },
    { label: 'Inventory Nodes', value: '...', trend: 'Syncing', icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Ad Protocol', value: '...', trend: 'Syncing', icon: Megaphone, color: 'text-amber-500' },
    { label: 'Decoded Signals', value: '...', trend: 'Syncing', icon: Target, color: 'text-indigo-500' },
  ]);

  useEffect(() => {
    const fetchLiveStats = async () => {
        setLoading(true);
        try {
            const token = user?.ebayToken || import.meta.env.VITE_EBAY_USER_TOKEN;
            const summary = await ebayTrading.getAccountSummary(token);
            
            setStats([
                { label: 'Bridge Health', value: summary.status === 'CONNECTED' ? '100%' : 'OFFLINE', trend: 'Production', icon: Globe, color: 'text-primary-500' },
                { label: 'Inventory Nodes', value: summary.activeListings.toString(), trend: 'Live Sync', icon: TrendingUp, color: 'text-emerald-500' },
                { label: 'Ad Protocol', value: 'v5.7', trend: 'Verified', icon: Megaphone, color: 'text-amber-500' },
                { label: 'Decoded Signals', value: 'Active', trend: 'Real-time', icon: Target, color: 'text-indigo-500' },
            ]);
        } catch (e) {
            console.error("Marketing Sync Fail", e);
        } finally {
            setLoading(false);
        }
    };
    fetchLiveStats();
  }, [user]);

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-32 max-w-[1700px] mx-auto">
      
      {/* Promotion Command Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-12 glass-card p-12 rounded-[3.5rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-100/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="space-y-4 relative z-10">
           <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1 rounded-lg w-fit">
              <Zap size={14} className="text-primary-400 fill-primary-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Ad Engine v5.9 Neural Pulse</span>
           </div>
           <h1 className="text-4xl md:text-5xl font-outfit font-black text-slate-900 tracking-tighter">Promotion Hub.</h1>
           <p className="text-slate-400 font-medium max-w-xl text-lg text-balance">
                Orchestrate multi-channel reach through automated ad deployment and real-time performance tracking.
           </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-6 relative z-10">
            <button 
                onClick={() => setIsAdModalOpen(true)}
                className="btn-premium-outline flex items-center gap-3 h-16"
            >
                <Plus size={20} />
                Start New Ad
            </button>
            <button 
                onClick={async () => {
                    setIsSyncing(true);
                    try {
                        const token = user?.ebayToken || import.meta.env.VITE_EBAY_USER_TOKEN;
                        await ebayTrading.getAccountSummary(token);
                        toast.success("Global Marketing Signals Synchronized!");
                    } catch (e) {
                        toast.error("Sync failed.");
                    } finally {
                        setIsSyncing(false);
                    }
                }}
                disabled={isSyncing}
                className="btn-premium flex items-center gap-3 h-16 min-w-[280px] justify-center"
            >
                {isSyncing ? <Loader2 className="animate-spin" size={20} /> : <Megaphone size={20} />}
                <span className="uppercase tracking-[0.2em] font-black">{isSyncing ? 'Syncing...' : 'Force Signal Sync'}</span>
            </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
            <motion.div 
                key={i} 
                whileHover={{ y: -5 }}
                className="glass-card p-10 rounded-[2.5rem] flex flex-col justify-between h-56 group"
            >
                <div className="flex justify-between items-start">
                    <div className={cn("w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center transition-all group-hover:scale-110 shadow-sm border border-slate-100", stat.color)}>
                        <stat.icon size={24} />
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full uppercase tracking-widest">{stat.trend}</span>
                </div>
                <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                    <p className="text-3xl font-outfit font-black text-slate-900 tracking-tighter">{stat.value}</p>
                </div>
            </motion.div>
        ))}
      </div>

      {/* Operation Tabs */}
      <div className="flex bg-white/50 backdrop-blur-md p-2 rounded-[2rem] border border-slate-100 w-fit mx-auto lg:mx-0 shadow-sm">
          {[
              { id: 'marketplace', label: 'Neural Studio', icon: ShoppingBag },
              { id: 'scheduler', label: 'Ad Scheduler', icon: Clock },
              { id: 'intelligence', label: 'ROI & Ecosystem', icon: BarChart3 },
          ].map(tab => (
              <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                      "flex items-center gap-3 px-10 py-4 rounded-[1.25rem] text-[10px] font-black transition-all uppercase tracking-[0.2em]",
                      activeTab === tab.id ? 'bg-slate-900 text-white shadow-2xl' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                  )}
              >
                  <tab.icon size={16} />
                  {tab.label}
              </button>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
            <div className="space-y-12">
                <div className="glass-card p-12 rounded-[3.5rem] space-y-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-50 pb-10">
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-black text-primary-500 uppercase tracking-[0.4em]">Viral Suite</h3>
                            <p className="text-2xl font-outfit font-black text-slate-900 uppercase italic">Neural Copy Studio.</p>
                        </div>
                        <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/10 flex items-center gap-3">
                            <Plus size={16} /> New Ad Campaign
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Product Node</label>
                                <div className="relative">
                                    <Package className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <div className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-10 text-xs font-bold text-slate-900 flex items-center uppercase tracking-widest">
                                        {selectedProduct ? selectedProduct.title : "Select from Inventory..."}
                                    </div>
                                    <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 rotate-90" size={18} />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { id: 'tiktok', label: 'TikTok Viral', icon: Play },
                                    { id: 'facebook', label: 'FB Direct Response', icon: Target },
                                    { id: 'instagram', label: 'Insta Aesthetic', icon: ImageLucide },
                                    { id: 'google', label: 'Google Search', icon: Globe }
                                ].map((channel, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => handleGenerateCopy(channel.id)}
                                        disabled={copyLoading}
                                        className={cn(
                                            "p-6 rounded-3xl border transition-all group flex flex-col gap-4 text-left",
                                            selectedChannel === channel.id ? "bg-primary-500/5 border-primary-500 shadow-lg shadow-primary-500/5" : "bg-white border-slate-100 hover:border-primary-500 hover:bg-primary-50/30"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                            selectedChannel === channel.id ? "bg-primary-500 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-primary-500 group-hover:text-white"
                                        )}>
                                            <channel.icon size={18} />
                                        </div>
                                        <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">{channel.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-[2.5rem] border border-slate-100 p-8 flex flex-col min-h-[400px]">
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Output Terminal</span>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => {
                                            if (generatedCopy) {
                                                navigator.clipboard.writeText(`${generatedCopy.headline}\n\n${generatedCopy.body}\n\n${generatedCopy.cta}`);
                                                toast.success("Copy encoded to clipboard.");
                                            }
                                        }}
                                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                                    >
                                        <Copy size={16} />
                                    </button>
                                    <button onClick={() => handleGenerateCopy(selectedChannel)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                                        <RefreshCw size={16} className={cn(copyLoading && "animate-spin")} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto no-scrollbar">
                                <AnimatePresence mode="wait">
                                    {copyLoading ? (
                                        <motion.div 
                                            key="loading"
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="h-full flex flex-col items-center justify-center space-y-4"
                                        >
                                            <Loader2 className="animate-spin text-primary-500" size={32} />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neuralizing Content...</p>
                                        </motion.div>
                                    ) : generatedCopy ? (
                                        <motion.div 
                                            key="content"
                                            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                                            className="space-y-6"
                                        >
                                            <div className="space-y-2">
                                                <p className="text-[8px] font-black text-primary-500 uppercase tracking-[0.2em]">Headline</p>
                                                <p className="text-sm font-bold text-slate-900">{generatedCopy.headline}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[8px] font-black text-primary-500 uppercase tracking-[0.2em]">Ad Body</p>
                                                <p className="text-xs font-medium text-slate-600 leading-relaxed italic">"{generatedCopy.body}"</p>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[8px] font-black text-primary-500 uppercase tracking-[0.2em]">Call to Action</p>
                                                <div className="px-4 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase text-center tracking-widest shadow-xl shadow-slate-900/10">
                                                    {generatedCopy.cta}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center space-y-6 text-center px-8">
                                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 border border-slate-100 shadow-sm shadow-slate-100">
                                                <Megaphone size={32} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900 uppercase">Awaiting Signal</h4>
                                                <p className="text-[10px] text-slate-400 font-bold mt-2 leading-relaxed uppercase tracking-widest">Select a product and channel to generate neural marketing copy.</p>
                                            </div>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>

                    <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white space-y-12 overflow-hidden relative shadow-3xl">
                         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[120px] -mr-64 -mt-64" />
                         
                         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                                       <Zap className="text-primary-400 fill-primary-400" size={20} />
                                    </div>
                                    <h3 className="text-2xl font-outfit font-black tracking-tight uppercase">eBay Neural Promotion</h3>
                                </div>
                                <p className="text-sm text-slate-400 font-medium max-w-lg text-balance leading-relaxed">
                                    Algorithmic orchestration that analyzes competitor delta and watcher behavior to deploy high-conversion eBay promotions.
                                </p>
                            </div>
                         </div>

                         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
                            {[
                                { title: 'Offer Automator', desc: 'Secure margin-safe offers to watchers.', action: 'Active (12 sent)', icon: DollarSign },
                                { title: 'Coupon Engine', desc: 'Personalized coupons for repeat LTV.', action: 'Deploy Script', icon: Percent },
                                { title: 'Flash Schedulers', desc: 'High-traffic weekend velocity spikes.', action: 'Sync Node', icon: Clock },
                            ].map((tool, i) => (
                                <div key={i} className="p-8 bg-white/5 rounded-[2rem] border border-white/5 group hover:bg-white/10 transition-all flex flex-col justify-between h-64">
                                    <div className="space-y-4">
                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-primary-400 group-hover:scale-110 transition-transform">
                                            <tool.icon size={22} />
                                        </div>
                                        <h4 className="text-base font-bold tracking-tight uppercase">{tool.title}</h4>
                                        <p className="text-[10px] text-slate-400 leading-relaxed font-medium line-clamp-2">{tool.desc}</p>
                                    </div>
                                    <button className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-white hover:text-slate-900 transition-all">
                                        {tool.action} <ArrowRight size={12} />
                                    </button>
                                </div>
                            ))}
                         </div>
                    </div>
            </div>
        </div>

        <div className="lg:col-span-4 space-y-10">
            <div className="glass-card p-12 rounded-[3.5rem] text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-[60px] -mr-16 -mt-16" />
                <div className="relative z-10 space-y-6">
                    <div className="w-20 h-20 mx-auto bg-slate-50 rounded-[2rem] flex items-center justify-center text-primary-500 border border-slate-100 shadow-sm transition-all group-hover:scale-110">
                        <Activity size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-outfit font-black text-slate-900 uppercase">System Sync</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Active Multi-channel Integration</p>
                    </div>
                    <div className="space-y-4 pt-4">
                        <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <span>TikTok Business Node</span>
                            <span className="text-emerald-500">Live</span>
                        </div>
                        <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full w-[100%] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                        </div>
                    </div>
                    <button className="w-full btn-premium-outline">Configure Vectors</button>
                </div>
            </div>

            <div className="glass-card p-10 rounded-[3rem] space-y-8">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] pb-4 border-b border-slate-50 flex items-center gap-2">
                    <Megaphone size={14} /> Intelligence Feed
                </h4>
                <div className="space-y-8">
                    {[
                        { msg: 'Global signals synchronized. Bridge health verified at 100%.', time: '02:14 UTC', color: 'bg-emerald-500' },
                        { msg: 'Production node handshake confirmed for connected account.', time: '01:50 UTC', color: 'bg-primary-500' },
                        { msg: 'Neural scanning active across target market vectors.', time: '00:12 UTC', color: 'bg-indigo-500' }
                    ].map((m, i) => (
                        <div key={i} className="flex gap-4 group">
                            <div className="pt-1">
                                <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5", m.color)} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-slate-600 leading-relaxed text-balance">{m.msg}</p>
                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{m.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Marketing;
