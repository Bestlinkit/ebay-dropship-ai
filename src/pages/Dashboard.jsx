import React from 'react';
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
  Shield
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
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

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
  const chartData = {
    labels: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    datasets: [
      {
        fill: true,
        label: 'Gross Profit',
        data: [2100, 2400, 1900, 3200, 2800, 4100, 4800],
        borderColor: '#026dc6',
        backgroundColor: 'rgba(14, 140, 233, 0.05)',
        tension: 0.4,
        borderWidth: 4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderWidth: 3,
        pointHoverBorderColor: '#026dc6',
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
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-4">
             <div className="px-3 py-1 bg-primary-500 text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary-500/20">
                Live Terminal
             </div>
             <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Nodes Connected
             </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-outfit font-black text-slate-900 tracking-tighter leading-none">Command Center.</h1>
          <p className="text-slate-400 font-medium text-lg text-balance max-w-xl">System orchestration for your eBay dropshipping ecosystem. Monitoring high-velocity market vectors.</p>
        </div>
        
        <div className="flex items-center gap-4">
             <button className="btn-premium flex items-center gap-3">
                 <Zap size={16} className="fill-white" />
                 <span>Auto-Optimize Pulse</span>
             </button>
             <button className="w-16 h-16 glass-card rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900">
                 <Calendar size={24} />
             </button>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            <PremiumStat 
                label="Weekly Revenue" 
                value="$184,204" 
                trend="+14.2%" 
                icon={DollarSign} 
            />
            <PremiumStat 
                label="Global Pulse" 
                value="8.4k" 
                trend="+2,410" 
                icon={Activity} 
            />
            <PremiumStat 
                label="Active Nodes" 
                value="124" 
                trend="-2.4%" 
                icon={ShoppingBag}
                trendType="down"
            />
            <PremiumStat 
                label="Neural Lift" 
                value="98.2%" 
                trend="Optimal" 
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
                            {[
                                { title: 'Neural Vitality Serum 2.0', price: '$45.00', sales: '840 Unit Lift', roi: '12.4x', img: 'https://images.unsplash.com/photo-1570172619992-052267ad7c32' },
                                { title: 'MagSync Wireless Matrix', price: '$59.00', sales: '612 Unit Lift', roi: '8.2x', img: 'https://images.unsplash.com/photo-1583394838336-acd977730f90' },
                                { title: 'Posture Alignment Node', price: '$19.00', sales: '1,2k Unit Lift', roi: '15.1x', img: 'https://images.unsplash.com/photo-1616763355548-1b606f439f86' },
                            ].map((p, i) => (
                                <tr key={i} className="group hover:bg-slate-50/30 transition-all duration-300">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-6">
                                            <div className="relative">
                                                <img src={p.img} className="w-16 h-16 rounded-[1.25rem] object-cover bg-slate-50 border border-slate-100 group-hover:scale-105 transition-transform duration-500" />
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 text-white rounded-lg flex items-center justify-center border-2 border-white shadow-lg">
                                                    <Star size={8} className="fill-white" />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 uppercase tracking-tight leading-none mb-2">{p.title}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs text-slate-400 font-black uppercase tracking-widest">{p.price}</p>
                                                    <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                    <div className="flex items-center gap-1 text-[9px] font-black text-primary-500 uppercase tracking-widest">
                                                        <Globe size={10} /> eBay Global
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                <span>Intensity</span>
                                                <span className="text-slate-900">84%</span>
                                            </div>
                                            <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="bg-primary-500 h-full w-[84%] rounded-full shadow-[0_0_8px_rgba(14,140,233,0.3)]" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                            <TrendingUp size={12} /> {p.roi} ROI
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center mx-auto lg:ml-auto lg:mr-0">
                                            <Plus size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
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
                        <span className="text-3xl font-outfit font-black text-slate-900 tracking-tighter">86%</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Efficiency</span>
                    </div>
                </div>
                <div className="space-y-1">
                    <h3 className="text-xl font-outfit font-black text-slate-900 uppercase">System Vitality</h3>
                    <p className="text-[10px] px-4 font-black text-slate-400 uppercase tracking-widest line-clamp-2">Node stability verified across 18 Global marketplaces.</p>
                </div>
                <button className="w-full btn-premium-outline mt-2 border-2">Optimize Core</button>
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
                    {[
                        { icon: TrendingUp, color: "text-emerald-500", text: "New viral trend detected in 'Neural Wellness'. Suggest expansion in Node #4.", title: "Growth Vector" },
                        { icon: AlertCircle, color: "text-amber-500", text: "Vendor discrepancy found on SKU-284. Neural script auto-correcting listing.", title: "Self-Correction" },
                        { icon: Activity, color: "text-primary-500", text: "TikTok Pulse integration complete. 1.2M impressions buffered for dispatch.", title: "Traffic Matrix" },
                    ].map((insight, i) => (
                        <div key={i} className="flex gap-6 items-start group">
                             <div className={cn("w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center transition-all group-hover:scale-110", insight.color)}>
                                <insight.icon size={20} />
                             </div>
                             <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.1em]">{insight.title}</p>
                                <p className="text-xs font-medium text-slate-400 leading-relaxed text-balance">{insight.text}</p>
                             </div>
                        </div>
                    ))}
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
