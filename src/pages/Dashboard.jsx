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
  Shield,
  CheckCircle2,
  RefreshCw,
  Package,
  Globe,
  BarChart3,
  Plus,
  Clock,
  Terminal,
  Layers,
  Monitor,
  Layout
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
import { toast } from 'sonner';
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

const PremiumStat = ({ label, value, trend, icon: Icon, trendType = 'up', error, className }) => (
    <motion.div 
        whileHover={{ y: -5 }}
        className={cn("bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group", className)}
    >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
        <div className="flex items-start justify-between relative z-10">
            <div className="space-y-4 w-full">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-xl">
                        <Icon size={18} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">{label}</p>
                </div>
                <h2 className="text-4xl font-black text-slate-950 tracking-tighter leading-none mb-3">
                  {value}
                </h2>
                {error && (
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4 truncate w-full italic" title={error}>
                        Signal Error: {error}
                    </p>
                )}
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest",
                        trendType === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                        {trendType === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {trend}
                    </div>
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
    syncStatus: 0,
    efficiency: 0,
    loading: true,
    newCount: 0
  });
  const [performanceItems, setPerformanceItems] = useState([]);
  const [sellerName, setSellerName] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    const loadLiveStats = async () => {
      if (isStoreConnected && user?.ebayToken) {
        setStats(prev => ({ ...prev, loading: true }));
        setConnectionError(null);
        try {
            const token = user?.ebayToken || import.meta.env.VITE_EBAY_USER_TOKEN;
            const [name, summary, orders] = await Promise.all([
                ebayTrading.getUserProfile(token),
                ebayTrading.getAccountSummary(token),
                ebayTrading.getOrders(token)
            ]);

            const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);
            
            setSellerName(name);
            setStats({
                revenue: totalRevenue || summary.revenue,
                activeListings: summary.activeListings,
                toShip: summary.toShip,
                urgentShip: summary.urgentShip,
                offers: summary.offers,
                syncStatus: name ? 100 : 0, 
                efficiency: name ? 96 : 0,
                loading: false,
                recentOrders: orders,
                newCount: 0
            });
        } catch (e) {
            setConnectionError(e.message);
            setStats(prev => ({ ...prev, loading: false }));
        }
      } else {
        setStats(prev => ({ ...prev, loading: false }));
      }
    };
    loadLiveStats();
  }, [isStoreConnected, user]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: { 
        legend: { display: false },
        tooltip: {
            backgroundColor: '#020617',
            titleFont: { family: 'Outfit', size: 12, weight: '900' },
            padding: 16,
            displayColors: false,
            cornerRadius: 20,
            callbacks: {
                label: (context) => ` $${context.parsed.y.toLocaleString()}`
            }
        }
    },
    scales: {
      y: { 
        display: true,
        grid: { color: 'rgba(0,0,0,0.02)' },
        ticks: { font: { family: 'Outfit', size: 10, weight: '700' }, color: '#94a3b8' } 
      },
      x: { 
        grid: { display: false },
        ticks: { font: { family: 'Outfit', size: 10, weight: '900' }, color: '#94a3b8' } 
      },
    },
  };

  const growthData = stats.recentOrders?.reduce((acc, order, i) => {
    const prev = acc[i - 1] || 0;
    acc.push(prev + order.amount);
    return acc;
  }, []) || [0,0,0,0,0,0,0];

  const lineChartData = {
    labels: stats.recentOrders?.slice(0, 7).reverse().map(o => o.date) || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    datasets: [
      {
        fill: true,
        label: 'Revenue Delta',
        data: growthData.slice(0, 7).reverse(),
        borderColor: '#0ea5e9',
        backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(14, 165, 233, 0.1)');
            gradient.addColorStop(1, 'rgba(14, 165, 233, 0)');
            return gradient;
        },
        tension: 0.5,
        borderWidth: 6,
        pointRadius: 6,
        pointHoverRadius: 10,
        pointBackgroundColor: '#0ea5e9',
        pointBorderColor: '#fff',
        pointBorderWidth: 4,
      },
    ],
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-[1700px] mx-auto pb-20">
      
      {/* Standard Pro Hero Header */}
      <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden flex flex-col xl:flex-row xl:items-center justify-between gap-12">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-32 -mt-32" />
        
        <div className="space-y-8 relative z-10">
           <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 bg-slate-950 text-white px-5 py-2 rounded-2xl shadow-2xl">
                <Zap size={16} className="text-primary fill-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Telemetry Active</span>
              </div>
               {sellerName && (
                <div className="flex items-center gap-3 bg-emerald-50 text-emerald-600 px-5 py-2 rounded-2xl border border-emerald-100 shadow-sm">
                    <Shield size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Identity: {sellerName}</span>
                </div>
              )}
           </div>
           <div className="space-y-4">
              <h1 className="text-6xl md:text-7xl font-black text-slate-950 tracking-tighter leading-[0.8] uppercase italic">
                Business <br/> Intelligence.
              </h1>
              <p className="text-slate-400 font-bold text-lg max-w-xl leading-relaxed italic opacity-80">
                   Automated eBay production hub. Orchestrating revenue signals and inventory sync.
              </p>
           </div>
        </div>

        <div className="flex items-center gap-6 relative z-10">
            <button 
                onClick={() => window.location.reload()}
                className="bg-slate-950 text-white h-20 px-12 rounded-[2rem] flex items-center justify-center gap-6 font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.05] transition-all group"
            >
                <RefreshCw size={24} className="group-hover:rotate-180 transition-transform duration-700" />
                Force System Sync
            </button>
        </div>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            <PremiumStat 
                label="Primary Connection" 
                value={sellerName || "Searching..."} 
                trend={isStoreConnected ? "Signal Strong" : "Disconnected"} 
                icon={Globe} 
                className="xl:col-span-1"
            />
            <PremiumStat 
                label="Fulfillment Queue" 
                value={stats.urgentShip || 0} 
                trend="Action Required" 
                icon={Box}
                trendType="down"
                className={cn("xl:col-span-1", stats.urgentShip > 0 && "ring-4 ring-rose-500/10")}
            />
            <PremiumStat 
                label="Production Volume" 
                value={stats.activeListings} 
                trend="Verified Inventory" 
                icon={Layers} 
            />
            <PremiumStat 
                label="Market Efficiency" 
                value={`${stats.efficiency}%`} 
                trend="Optimal Health" 
                icon={Layout} 
            />
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-12 gap-12">
        {/* Analytics Core */}
        <div className="2xl:col-span-8 space-y-8">
            <div className="bg-white p-12 rounded-[4rem] h-[600px] border border-slate-100 shadow-sm flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
                    <div className="space-y-4">
                        <h3 className="text-2xl font-black text-slate-950 uppercase italic tracking-tight flex items-center gap-4">
                            <Monitor className="text-primary" size={28} />
                            Revenue Momentum
                        </h3>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic opacity-60">Cumulative Store Delta | Multi-Node Tracking</p>
                    </div>
                    <div className="flex bg-slate-50 p-2 rounded-2xl border border-slate-100">
                        <button className="px-8 py-3 bg-white shadow-sm rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-950">Broadcast 7D</button>
                        <button className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Quarterly Signals</button>
                    </div>
                </div>
                <div className="flex-1 w-full opacity-90 transition-opacity hover:opacity-100">
                    <Line data={lineChartData} options={chartOptions} />
                </div>
            </div>

            {/* Sales Protocol Grid */}
            <div className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-12 border-b border-slate-50 flex items-center justify-between bg-slate-50/10">
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-950 uppercase italic tracking-tight">Production Log</h3>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic opacity-60">Verified Order Telemetry</p>
                    </div>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-12 py-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Vector ID / Time</th>
                                <th className="px-8 py-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Value ($)</th>
                                <th className="px-8 py-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Protocol Status</th>
                                <th className="px-12 py-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50/50">
                            {stats.recentOrders?.map((order, i) => (
                                <tr key={i} className="group hover:bg-slate-50/30 transition-all duration-300">
                                    <td className="px-12 py-8">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 bg-slate-950 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                <ShoppingBag size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-950 italic uppercase tracking-tight">#{order.id.slice(-8)}</p>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{order.date}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-8">
                                        <span className="text-2xl font-black text-emerald-500 tracking-tighter italic">${order.amount}</span>
                                    </td>
                                    <td className="px-8 py-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_10px_rgba(30,190,230,0.5)]" />
                                            <span className="text-[10px] font-black text-slate-950 uppercase tracking-widest italic">{order.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-12 py-8 text-right">
                                        <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-950 hover:text-white transition-all shadow-sm">
                                            <ChevronRight size={20} />
                                        </button>
                                    </td>
                                </tr>
                            )) || (
                                <tr>
                                    <td colSpan="4" className="px-12 py-32 text-center">
                                        <div className="flex flex-col items-center gap-6 opacity-20">
                                            <PackageCheck size={80} className="text-slate-200" />
                                            <p className="text-[12px] font-black uppercase tracking-[0.5em] text-slate-400 italic">No Sales Identified in Signal</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Intelligence Sidebar */}
        <div className="2xl:col-span-4 space-y-12">
            
            {/* Efficiency Node */}
            <div className="bg-white p-12 rounded-[4.5rem] border border-slate-100 shadow-sm text-center space-y-10 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[80px] -mr-24 -mt-24 group-hover:scale-150 transition-transform duration-1000" />
                 <div className="relative w-44 h-44 mx-auto">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="88" cy="88" r="78" className="stroke-slate-100" strokeWidth="12" fill="transparent" />
                        <circle 
                            cx="88" cy="88" r="78" 
                            className="stroke-primary transition-all duration-1000 ease-out"
                            strokeWidth="12" 
                            fill="transparent" 
                            strokeDasharray={490.1}
                            strokeDashoffset={490.1 - (490.1 * 0.96)}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-black text-slate-950 tracking-tighter italic">{stats.efficiency}%</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em] mt-2 italic">Neural Health</span>
                    </div>
                </div>
                <div className="space-y-4 px-4">
                    <h3 className="text-[12px] font-black text-slate-950 uppercase tracking-[0.5em] italic">Synergy Matrix</h3>
                    <p className="text-[11px] font-bold text-slate-400 leading-relaxed italic opacity-60">
                        Autonomous store stability verified across all connected marketplaces. Logic engine running at peak capacity.
                    </p>
                </div>
                <button className="w-full h-16 bg-slate-50 text-slate-950 border border-slate-100 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-slate-950 hover:text-white transition-all shadow-sm italic">Recalibrate Sync</button>
            </div>

            {/* Neural Heartbeat */}
            <div className="bg-slate-950 p-12 rounded-[4.5rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none transform rotate-12 scale-150">
                    <Activity size={100} className="text-primary" />
                </div>
                <div className="relative z-10 space-y-10">
                    <div className="space-y-6">
                        <div className="flex justify-between items-center px-2">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.5em] italic">System Load</span>
                            <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_12px_#10b981]" />
                        </div>
                        <h3 className="text-4xl font-black tracking-tight leading-none italic uppercase italic leading-[0.9]">Autonomous <br/> Scaling.</h3>
                        <p className="text-sm text-slate-400 font-bold leading-relaxed italic opacity-80">Orchestrating ad capital and inventory allocation with Tier-1 precision.</p>
                    </div>
                    
                    <div className="space-y-4">
                         <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">
                            <span>Vector Match</span>
                            <span className="text-primary">94% Stable</span>
                        </div>
                        <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: "94%" }}
                                transition={{ duration: 2, delay: 0.5 }}
                                className="bg-primary h-full rounded-full shadow-[0_0_20px_rgba(14,165,233,0.6)]" 
                            />
                        </div>
                    </div>
                    
                    <button className="w-full h-20 bg-white text-slate-950 rounded-[2.2rem] text-[11px] font-black uppercase tracking-[0.5em] hover:bg-primary hover:text-white hover:scale-[1.05] transition-all italic shadow-2xl">
                        Adjust Growth Node
                    </button>
                </div>
            </div>

            {/* Support Matrix */}
            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic px-4">Production Connectivity</h4>
                 <div className="space-y-6">
                    {[
                        { label: "Marketplace Bridge", status: "Secure", ok: true },
                        { label: "Neural Pricing Hub", status: "Active", ok: true },
                        { label: "Broadcast Server", status: "Synced", ok: true }
                    ].map((sys, i) => (
                        <div key={i} className="flex justify-between items-center px-4">
                             <div className="flex items-center gap-4">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                <span className="text-xs font-bold text-slate-950 tracking-tight">{sys.label}</span>
                             </div>
                             <span className="text-[9px] font-black text-primary uppercase tracking-widest">{sys.status}</span>
                        </div>
                    ))}
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
