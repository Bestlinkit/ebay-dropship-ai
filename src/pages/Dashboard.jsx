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
  ChevronRight,
  Package,
  Globe,
  BarChart3,
  RefreshCw,
  Monitor,
  Layout,
  Layers,
  Clock
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
  <div className="bg-white p-4 h-[120px] rounded-[12px] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
        <Icon size={16} />
      </div>
    </div>
    <div className="flex items-end justify-between">
      <h2 className="text-2xl font-black text-slate-950 tracking-tighter leading-none">{value}</h2>
      <div className={cn(
        "flex items-center gap-1 text-[9px] font-black uppercase tracking-widest",
        trendType === 'up' ? "text-emerald-500" : "text-rose-500"
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
                recentOrders: orders
            });
        } catch (e) {
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
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Inter', size: 10, weight: '700' } } },
      x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 10, weight: '900' } } }
    }
  };

  const lineChartData = {
    labels: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    datasets: [{
      fill: true,
      data: [12, 19, 13, 15, 22, 30, 25],
      borderColor: '#0ea5e9',
      backgroundColor: 'rgba(14, 165, 233, 0.05)',
      tension: 0.4,
      pointRadius: 4
    }]
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Row 1: SaaS Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard label="Total Products" value={stats.activeListings} trend="+12.5%" icon={Package} />
        <StatCard label="Active Listings" value={stats.activeListings} trend="Synced" icon={Zap} />
        <StatCard label="Estimated Revenue" value={`$${stats.revenue.toLocaleString()}`} trend="+8.4%" icon={DollarSign} />
        <StatCard label="Conversion Rate" value={`${stats.efficiency}%`} trend="Optimal" icon={TrendingUp} trendType="up" />
      </div>

      {/* Row 2: Analytics 70/30 */}
      <div className="grid grid-cols-1 2xl:grid-cols-10 gap-6">
        <div className="2xl:col-span-7 bg-white p-6 rounded-[12px] border border-slate-100 shadow-sm h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Sales Graph</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Marketplace Momentum Node</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-1.5 bg-slate-950 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">7 Days</button>
                    <button className="px-4 py-1.5 bg-slate-50 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest">30 Days</button>
                </div>
            </div>
            <div className="flex-1">
                <Line data={lineChartData} options={chartOptions} />
            </div>
        </div>

        <div className="2xl:col-span-3 bg-white p-6 rounded-[12px] border border-slate-100 shadow-sm h-[400px] overflow-hidden flex flex-col">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-6">Top Performing</h3>
            <div className="space-y-4 overflow-y-auto pr-2 scrollbar-hide">
                {stats.recentOrders?.slice(0, 5).map((order, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-all cursor-pointer">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-black text-slate-400 text-[10px]">#{i+1}</div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black text-slate-950 truncate uppercase leading-tight">Order Vector {order.id.slice(-4)}</p>
                            <p className="text-[9px] text-emerald-500 font-black uppercase mt-1 tracking-widest">High Probability</p>
                        </div>
                        <span className="text-[11px] font-black text-slate-950">${order.amount}</span>
                    </div>
                )) || <div className="py-20 text-center text-[10px] font-black text-slate-300 uppercase italic">No performance data nodes detected</div>}
            </div>
        </div>
      </div>

      {/* Row 3: Activity Table */}
      <div className="bg-white rounded-[12px] border border-slate-100 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/10">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Recent Activity Log</h3>
            <button className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
                View Full Logs <ChevronRight size={14} />
            </button>
         </div>
         <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Product Node</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Price Registry</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Performance</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50/50">
                    {stats.recentOrders?.map((order, i) => (
                        <tr key={i} className="hover:bg-slate-50/30 transition-all cursor-pointer">
                            <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-slate-950 text-white rounded-lg flex items-center justify-center"><ShoppingBag size={14} /></div>
                                    <span className="text-[11px] font-black text-slate-900 uppercase">Vector ID: {order.id.slice(-8)}</span>
                                </div>
                            </td>
                            <td className="px-6 py-5">
                                <span className="text-[11px] font-black text-slate-950 tracking-tighter">${order.amount.toFixed(2)}</span>
                            </td>
                            <td className="px-6 py-5">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest italic">{order.status}</span>
                                </div>
                            </td>
                            <td className="px-6 py-5 text-right">
                                <div className="flex items-center justify-end gap-1.5 text-emerald-500 font-bold text-[10px]">
                                    <TrendingUp size={12} /> 94%
                                </div>
                            </td>
                        </tr>
                    )) || (
                        <tr>
                            <td colSpan="4" className="py-20 text-center">
                                <div className="flex flex-col items-center gap-3 opacity-20">
                                    <PackageCheck size={48} className="text-slate-200" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">No Activity Detected</p>
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
