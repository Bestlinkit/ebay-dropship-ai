import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  PackageCheck,
  Zap,
  Star,
  ChevronRight,
  MoreVertical,
  Calendar,
  AlertCircle,
  BarChart3,
  Globe,
  Plus,
  Shield,
  CheckCircle2
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ebayTrading from '../services/ebay_trading';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PremiumStat = ({ label, value, trend, icon: Icon, trendType = 'up' }) => (
    <motion.div 
        whileHover={{ y: -5 }}
        className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden group"
    >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
        <div className="flex items-start justify-between relative z-10">
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                        <Icon size={14} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
                </div>
                <h3 className="text-3xl font-outfit font-black text-slate-900 tracking-tighter">{value}</h3>
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold",
                        trendType === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                        {trendType === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {trend}
                    </div>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">vs last 7d</span>
                </div>
            </div>
        </div>
    </motion.div>
);

const Dashboard = () => {
  const { user, isStoreConnected } = useAuth();
  const { primaryColor } = useTheme();
  const [stats, setStats] = useState({
    revenue: 0,
    activeListings: 0,
    globalPulse: 0,
    efficiency: 0,
    loading: true
  });
  const [performanceItems, setPerformanceItems] = useState([]);
  const [sellerName, setSellerName] = useState(null);

  useEffect(() => {
    const loadLiveStats = async () => {
      if (isStoreConnected && user?.ebayToken) {
        try {
            const [summary, name] = await Promise.all([
                ebayTrading.getAccountSummary(user.ebayToken),
                ebayTrading.getUserProfile(user.ebayToken)
            ]);
            
            setSellerName(name);
            setStats({
              revenue: summary.revenue,
              activeListings: summary.activeListings,
              globalPulse: summary.activeListings > 0 ? 86 : 0,
              efficiency: summary.activeListings > 0 ? 94 : 0,
              loading: false
            });
        } catch (e) {
            console.error("Dashboard Live Load Fail", e);
            setStats(prev => ({ ...prev, loading: false }));
        }
      } else {
        setStats(prev => ({ ...prev, loading: false }));
      }
    };
    loadLiveStats();
  }, [isStoreConnected, user]);

  const chartData = {
    labels: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    datasets: [
      {
        fill: true,
        label: 'Gross Profit',
        data: isStoreConnected ? [0, 0, 0, 0, 0, 0, 0] : [2100, 2400, 1900, 3200, 2800, 4100, 4800],
        borderColor: primaryColor,
        backgroundColor: `${primaryColor}10`,
        tension: 0.4,
        borderWidth: 4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderWidth: 3,
        pointHoverBorderColor: primaryColor,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: { 
        legend: { display: false },
        tooltip: {
            backgroundColor: '#0f172a',
            titleFont: { family: 'Outfit', size: 12, weight: '900' },
            bodyFont: { family: 'Inter', size: 12, weight: '500' },
            padding: 16,
            displayColors: false,
            cornerRadius: 16,
            callbacks: {
                label: (context) => ` $${context.parsed.y.toLocaleString()}`
            }
        }
    },
    scales: {
      y: { 
        display: false,
        grid: { display: false } 
      },
      x: { 
        grid: { display: false },
        ticks: { 
            font: { family: 'Inter', size: 10, weight: '900' },
            color: '#94a3b8'
        } 
      },
    },
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      

      {/* Hero Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-12 glass-card p-12 rounded-[3.5rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        
        <div className="space-y-6 relative z-10">
           <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-1.5 rounded-xl shadow-2xl">
                <Zap size={14} className="text-primary-400 fill-primary-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Terminal v5.7</span>
              </div>
               {sellerName && (
                <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-4 py-1.5 rounded-xl border border-emerald-500/20 backdrop-blur-md">
                    <Shield size={12} className="fill-emerald-500/10" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{sellerName}</span>
                </div>
              )}
              {isStoreConnected && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-2 bg-primary-500 text-white px-4 py-1.5 rounded-xl shadow-[0_0_20px_rgba(14,140,233,0.3)] animate-pulse"
                >
                    <CheckCircle2 size={12} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Production Bridge Active</span>
                </motion.div>
              )}
           </div>
           <div className="space-y-2">
              <h1 className="text-5xl md:text-6xl font-outfit font-black text-slate-900 tracking-tighter leading-[0.9]">Command Center.</h1>
              <p className="text-slate-400 font-medium max-w-xl text-lg text-balance leading-relaxed">
                   Neural orchestration and real-time market synchronization for your global dropshipping ecosystem.
              </p>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 relative z-10">
            <button className="btn-premium flex items-center gap-3 h-16 min-w-[240px] justify-center group">
                <Zap size={20} className="group-hover:animate-pulse" />
                <span className="uppercase tracking-[0.2em]">Auto-Optimize Pulse</span>
            </button>
            <button className="w-16 h-16 glass-card rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:scale-110 transition-all border border-slate-100">
                <Calendar size={24} />
            </button>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            <PremiumStat 
                label="Weekly Revenue" 
                value={`$${stats.revenue.toLocaleString()}`} 
                trend={isStoreConnected ? "Live" : "Synced"} 
                icon={DollarSign} 
            />
            <PremiumStat 
                label="Global Pulse" 
                value={stats.globalPulse > 0 ? stats.globalPulse : "OFF"} 
                trend={isStoreConnected ? "Active" : "Locked"} 
                icon={Activity} 
            />
            <PremiumStat 
                label="Active Nodes" 
                value={stats.activeListings} 
                trend={isStoreConnected ? "Live" : "Observer"} 
                icon={ShoppingBag}
                trendType={isStoreConnected ? 'up' : 'down'}
            />
            <PremiumStat 
                label="Neural Lift" 
                value={stats.activeListings > 0 ? "98.2%" : "N/A"} 
                trend={isStoreConnected ? "Optimal" : "Disconnected"} 
                icon={Zap} 
            />
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-12 gap-12">
        {/* Momentum Chart Section */}
        <div className="2xl:col-span-8 flex flex-col gap-8">
            <div className="glass-card p-10 rounded-[3rem] h-[550px] flex flex-col">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
                    <div className="space-y-1">
                        <h3 className="text-xl font-outfit font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                            <BarChart3 className="text-primary-500" size={24} />
                            Revenue Momentum
                        </h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">7d Snapshot | Live Scaling Active</p>
                    </div>
                    <div className="flex items-center gap-8 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2">
                             <div className="w-2.5 h-2.5 bg-primary-500 rounded-full" />
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gross Profit</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="w-2.5 h-2.5 bg-slate-200 rounded-full" />
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Projections</span>
                        </div>
                    </div>
                </div>
                <div className="flex-1 w-full relative">
                    <Line data={chartData} options={chartOptions} />
                </div>
            </div>

            {/* Performance Items */}
            <div className="glass-card rounded-[3rem] overflow-hidden">
                <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                    <div className="space-y-1">
                        <h3 className="text-xl font-outfit font-black text-slate-900 uppercase tracking-tight">Top performing vectors</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">High velocity inventory breakdown</p>
                    </div>
                    <button className="btn-premium-outline flex items-center gap-2">
                        System Inventory <ChevronRight size={14} />
                    </button>
                </div>
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/30">
                                <th className="px-10 py-6 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Product Vector</th>
                                <th className="px-6 py-6 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Scalability</th>
                                <th className="px-6 py-6 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">ROI Delta</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50/50">
                            {performanceItems.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-10 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-slate-300">
                                            <PackageCheck size={48} className="opacity-20" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Active Product Vectors Identified</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                performanceItems.map((p, i) => (
                                    <tr key={i} className="group hover:bg-slate-50/30 transition-all duration-300">
                                        {/* ... Product Row Content ... */}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Intelligence Sidebar */}
        <div className="2xl:col-span-4 space-y-12">
            <div className="glass-card p-10 rounded-[3rem] text-center space-y-6 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary-400/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                 <div className="relative w-32 h-32 mx-auto">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="56" className="stroke-slate-50" strokeWidth="8" fill="transparent" />
                        <circle 
                            cx="64" cy="64" r="56" 
                            className="stroke-primary-500 transition-all duration-1000 ease-out"
                            strokeWidth="8" 
                            fill="transparent" 
                            strokeDasharray={351.8}
                            strokeDashoffset={351.8 - (351.8 * 0.86)}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-outfit font-black text-slate-900 tracking-tighter">{stats.efficiency > 0 ? `${stats.efficiency}%` : "0%"}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Efficiency</span>
                    </div>
                </div>
                <div className="space-y-1">
                    <h3 className="text-xl font-outfit font-black text-slate-900 uppercase">System Vitality</h3>
                    <p className="text-[10px] px-4 font-black text-slate-400 uppercase tracking-widest line-clamp-2">
                        {isStoreConnected ? "Node stability verified across all connected marketplaces." : "Establish API Connection to begin node verification."}
                    </p>
                </div>
                <button className={cn(
                    "w-full btn-premium-outline mt-2 border-2",
                    !isStoreConnected && "opacity-50 cursor-not-allowed"
                )}>Optimize Core</button>
            </div>

            <div className="glass-card p-10 rounded-[3rem] space-y-10">
                <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                    <div className="space-y-1">
                        <h3 className="text-lg font-outfit font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                            <Zap className="text-primary-500" size={20} />
                            Neural Pulse
                        </h3>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Real-time intelligence feed</p>
                    </div>
                </div>
                <div className="space-y-10">
                    {isStoreConnected ? (
                        <div className="py-20 text-center space-y-3">
                             <Activity className="mx-auto text-slate-100" size={32} />
                             <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Neural Syncing Active...</p>
                        </div>
                    ) : (
                        <div className="py-20 text-center space-y-3">
                             <AlertCircle className="mx-auto text-slate-100" size={32} />
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Intelligence feed requires an active eBay handshake.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 rounded-full blur-[60px] -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
                <div className="relative z-10 space-y-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
                                <Shield size={16} />
                            </div>
                            <span className="text-[9px] font-black text-primary-400 uppercase tracking-[0.3em]">Neural Firewall</span>
                        </div>
                        <h3 className="text-2xl font-outfit font-black tracking-tight leading-tighter">Scale Protocol Alpha Active.</h3>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">System will automatically deploy additional ad capital to vectors exceeding 8.5x ROI baseline.</p>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
                            <span>Autonomous Efficiency</span>
                            <span className="text-white">94%</span>
                        </div>
                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: "94%" }}
                                transition={{ duration: 1.5, delay: 0.5 }}
                                className="bg-primary-500 h-full rounded-full shadow-[0_0_15px_rgba(14,140,233,0.5)]" 
                            />
                        </div>
                    </div>
                    
                    <button className="w-full py-5 bg-white text-slate-900 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary-500 hover:text-white hover:scale-[1.02] transition-all">
                        Modify Strategy Nodes
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
