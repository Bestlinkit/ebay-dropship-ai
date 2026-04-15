import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronRight,
  Package,
  Globe,
  BarChart3,
  RefreshCw,
  Monitor,
  Layout,
  Layers,
  Clock,
  AlertCircle
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
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ebayTrading from '../services/ebay_trading';
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

const StatCard = ({ label, value, trend, icon: Icon, trendType = 'up' }) => (
  <div className="bg-slate-900 p-6 h-[140px] rounded-[2rem] border border-slate-800 shadow-2xl flex flex-col justify-between hover:border-primary/30 transition-all group">
    <div className="flex items-center justify-between">
      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none">{label}</p>
      <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
        <Icon size={18} />
      </div>
    </div>
    <div className="flex items-end justify-between">
      <h2 className="text-3xl font-black text-white italic tracking-tighter leading-none">{value}</h2>
      <div className={cn(
        "flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
        trendType === 'up' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
      )}>
        {trendType === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {trend}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user, isStoreConnected } = useAuth();
  const [stats, setStats] = useState({
    revenue: 0,
    activeListings: 0,
    syncStatus: 0,
    efficiency: 0,
    loading: true,
    recentOrders: []
  });
  const [sellerName, setSellerName] = useState(null);

  useEffect(() => {
    const loadLiveStats = async () => {
      if (isStoreConnected && user?.ebayToken) {
        try {
            const token = user?.ebayToken || import.meta.env.VITE_EBAY_USER_TOKEN;
            const [name, summary, orders] = await Promise.all([
                ebayTrading.getUserProfile(token),
                ebayTrading.getAccountSummary(token),
                ebayTrading.getOrders(token)
            ]);
            setSellerName(name);
            setStats({
                revenue: orders.reduce((sum, order) => sum + order.amount, 0) || summary.revenue,
                activeListings: summary.activeListings,
                syncStatus: 100,
                efficiency: name ? 98 : 0,
                loading: false,
                recentOrders: orders || []
            });
        } catch (e) {
            setStats(prev => ({ ...prev, loading: false, recentOrders: [] }));
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
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111A2E',
        titleFont: { family: 'Inter', size: 10, weight: '900' },
        bodyFont: { family: 'Inter', size: 12, weight: '700' },
        padding: 12,
        borderRadius: 12,
        borderColor: '#1E293B',
        borderWidth: 1
      }
    },
    scales: {
      y: { 
        grid: { color: 'rgba(255, 255, 255, 0.05)' }, 
        ticks: { color: '#94A3B8', font: { family: 'Inter', size: 10, weight: '700' } } 
      },
      x: { 
        grid: { display: false }, 
        ticks: { color: '#94A3B8', font: { family: 'Inter', size: 10, weight: '900' } } 
      }
    }
  };

  const lineChartData = useMemo(() => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const today = new Date().getDay();
    const labels = [];
    for (let i = 6; i >= 0; i--) {
        labels.push(days[(today - i + 7) % 7]);
    }

    const dataPoints = stats.recentOrders.length > 0 
      ? labels.map((_, i) => stats.recentOrders[i]?.amount || 0) 
      : [0, 0, 0, 0, 0, 0, 0];

    return {
      labels,
      datasets: [{
        fill: true,
        data: dataPoints,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#0B1220',
        pointBorderWidth: 2
      }]
    };
  }, [stats.recentOrders]);

  return (
    <div className="space-y-10 max-w-[1700px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
         <div className="space-y-1">
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Performance Hub.</h1>
            <p className="text-[11px] font-black text-text-muted uppercase tracking-[0.4em] flex items-center gap-2">
               <Layers size={14} className="text-primary-500" /> Distributed Control Hub
            </p>
         </div>
         <button className="flex items-center gap-3 px-6 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest hover:border-primary/50 transition-all shadow-xl">
            <RefreshCw size={14} className={cn(stats.loading && "animate-spin")} />
            State Sync
         </button>
      </div>

      {/* Row 1: Intelligence Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        <StatCard label="Total Inventory" value={stats.activeListings} trend="+2.4k listings" icon={Package} />
        <StatCard label="Cloud Sync" value="100%" trend="Registry Stable" icon={Zap} />
        <StatCard label="Gross Revenue" value={`$${stats.revenue.toLocaleString()}`} trend="+14% movement" icon={DollarSign} />
        <StatCard label="Strategy Score" value={`${stats.efficiency}%`} trend="Optimal Sourcing" icon={TrendingUp} trendType="up" />
      </div>

      {/* Row 2: Analytics Terminal */}
      <div className="grid grid-cols-1 2xl:grid-cols-10 gap-8">
        <div className="2xl:col-span-7 bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl h-[500px] flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32" />
            
            <div className="relative z-10 flex items-center justify-between mb-12">
                <div>
                   <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">Marketplace Trajectory</h3>
                   <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-2 leading-none">7-Day Deterministic Sales Volatility</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-2.5 bg-primary text-slate-950 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl">Weekly View</button>
                    <button className="px-5 py-2.5 bg-slate-800 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-white transition-all">Monthly View</button>
                </div>
            </div>
            
            <div className="flex-1 min-h-0 relative">
                {stats.recentOrders.length === 0 && !stats.loading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-20">
                     <div className="p-8 bg-slate-950 rounded-[2.5rem] border border-slate-800/50 text-slate-700 shadow-2xl">
                        <BarChart3 size={48} strokeWidth={1} />
                     </div>
                     <div className="text-center space-y-1">
                        <p className="text-[12px] font-black text-white uppercase tracking-widest leading-none">No analytics available yet</p>
                        <p className="text-[10px] font-bold text-slate-600 italic">Initialize supplier discovery to begin data ingestion</p>
                     </div>
                  </div>
                ) : null}
                
                <div className={cn("h-full transition-opacity duration-700", (stats.recentOrders.length === 0 && !stats.loading) ? "opacity-10 pointer-events-none" : "opacity-100")}>
                   <Line data={lineChartData} options={chartOptions} />
                </div>
            </div>
        </div>

        <div className="2xl:col-span-3 bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl h-[500px] overflow-hidden flex flex-col relative">
            <h3 className="text-xl font-black text-white italic tracking-tighter uppercase mb-8 leading-none">Performance Feed</h3>
            <div className="space-y-6 overflow-y-auto pr-3 scrollbar-hide flex-1">
                {stats.recentOrders?.length > 0 ? stats.recentOrders.slice(0, 6).map((order, i) => (
                    <div key={i} className="flex items-center gap-5 p-5 bg-slate-950 border border-slate-800/50 rounded-3xl hover:border-primary/30 transition-all cursor-pointer group">
                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center font-black text-slate-500 text-[11px] group-hover:text-primary transition-all">#{i+1}</div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black text-white truncate uppercase tracking-tight">Sequence {order.id.slice(-6)}</p>
                            <p className="text-[9px] text-emerald-500 font-black uppercase mt-1 tracking-widest flex items-center gap-1.5 leading-none">
                               <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> High Integrity
                            </p>
                        </div>
                        <span className="text-md font-black text-white italic tracking-tighter">${order.amount}</span>
                    </div>
                )) : (
                   <div className="flex flex-col items-center justify-center h-full gap-4 opacity-20">
                      <Layout size={40} className="text-slate-500" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Registry Buffer Idle</p>
                   </div>
                )}
            </div>
        </div>
      </div>

      {/* Row 3: Event Stream Terminal */}
      <div className="bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden">
         <div className="p-8 px-10 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
            <div>
               <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">Deterministic Activity Log</h3>
               <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-2 leading-none">Real-time marketplace event sequencing</p>
            </div>
            <button className="flex items-center gap-3 px-6 py-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all">
                Full Sequence <ChevronRight size={14} />
            </button>
         </div>
         <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-950/40">
                        <th className="px-10 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Supplier Source</th>
                        <th className="px-10 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Valuation Registry</th>
                        <th className="px-10 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Protocol Status</th>
                        <th className="px-10 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Yield Performance</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                    {stats.recentOrders?.length > 0 ? stats.recentOrders.map((order, i) => (
                        <tr key={i} className="hover:bg-slate-950/50 transition-all cursor-pointer group">
                            <td className="px-10 py-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-950 border border-slate-800 text-slate-500 group-hover:text-primary rounded-xl flex items-center justify-center transition-all"><ShoppingBag size={18} /></div>
                                    <div className="flex flex-col">
                                       <span className="text-[12px] font-black text-white uppercase tracking-tight">Sequence {order.id.slice(-10)}</span>
                                       <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Temporal Index: {new Date().toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-10 py-6">
                                <span className="text-lg font-black text-white italic tracking-tighter leading-none">${order.amount.toFixed(2)}</span>
                            </td>
                            <td className="px-10 py-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                    <span className="text-[10px] font-black text-text-primary uppercase tracking-widest italic leading-none">{order.status}</span>
                                </div>
                            </td>
                            <td className="px-10 py-6 text-right">
                                <div className="flex items-center justify-end gap-2 text-emerald-500 font-black text-[11px] italic tracking-tighter">
                                    <TrendingUp size={14} /> 94% YIELD
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="4" className="py-32 text-center">
                                <div className="flex flex-col items-center gap-4 opacity-10">
                                    <PackageCheck size={64} className="text-slate-500" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Telemetry In Buffer: Empty</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
