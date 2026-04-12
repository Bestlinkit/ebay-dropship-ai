import React, { useState } from 'react';
import { 
  Line, 
  Bar, 
  Doughnut,
  PolarArea
} from 'react-chartjs-2';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Target,
  BarChart3,
  PieChart,
  Calendar,
  Zap,
  ArrowUpRight,
  Globe,
  Users,
  Activity,
  Shield,
  Clock,
  ExternalLink,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale
} from 'chart.js';
import { cn } from '../lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale
);

/**
 * Ultra-Pro Analytics Hub (V5.2.1)
 * High-Density Market Intelligence & Revenue Projection
 */
const Analytics = () => {
  const [timeframe, setTimeframe] = useState('7D');

  const lineData = {
    labels: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    datasets: [
      {
        label: 'Net Revenue',
        data: [12400, 15800, 14200, 19400, 24500, 31200, 28900],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.05)',
        fill: true,
        tension: 0.5,
        borderWidth: 4,
        pointRadius: 0,
        pointHoverRadius: 6,
      }
    ]
  };

  const stats = [
    { label: 'EBay Net ROI', value: '14.2x', trend: '+2.4x', icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Avg Order Value', value: '$84.20', trend: '+$12.4', icon: ShoppingCart, color: 'text-primary' },
    { label: 'Market Velocity', value: 'Extreme', trend: '84/100', icon: Activity, color: 'text-rose-500' },
    { label: 'Global Reach', value: '2.4M', trend: '+142k', icon: Globe, color: 'text-indigo-500' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24 max-w-[1500px] mx-auto">
      
      {/* Pro Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="space-y-4">
           <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-1.5 rounded-full w-fit">
              <Shield size={12} className="text-primary fill-primary" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Verified Merchant Intelligence</span>
           </div>
           <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Revenue Pulse.</h1>
           <p className="text-slate-400 font-bold max-w-lg">Advanced algorithmic tracking of sourcing ROI and multi-channel conversion velocity.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
             <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-100 flex gap-1">
                {['24H', '7D', '30D', 'ALL'].map(t => (
                    <button 
                        key={t}
                        onClick={() => setTimeframe(t)}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all",
                            timeframe === t ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        {t}
                    </button>
                ))}
             </div>
             <button className="bg-slate-900 text-white h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-slate-900/20 active:scale-95 transition-all flex items-center gap-3">
                <Zap size={16} fill="white" /> Sync Real-time
             </button>
        </div>
      </div>

      {/* KPI Overlays */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-primary/20 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-700" />
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="flex justify-between items-start mb-10">
                        <div className={cn("p-4 rounded-2xl bg-slate-50/80 shadow-inner", stat.color)}>
                            <stat.icon size={24} className="stroke-[2.5px]" />
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100/30">{stat.trend}</span>
                    </div>
                    <div>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2 leading-none">{stat.label}</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter italic">{stat.value}</p>
                    </div>
                </div>
            </div>
        ))}
      </div>

      <div className="space-y-10">
        {/* Main Performance Graph */}
        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="flex justify-between items-center mb-12">
                <div>
                   <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Gross Performance Orbit</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Algorithmic Projection Activated</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/30">
                        <ArrowUpRight size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">+22% Efficiency</span>
                    </div>
                </div>
            </div>
            <div className="flex-1 min-h-[400px]">
                <Line data={lineData} options={{ 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    plugins: { legend: { display: false }, tooltip: { borderRadius: 16, padding: 16 } },
                    scales: {
                        x: { grid: { display: false }, ticks: { font: { weight: 'black', size: 9 }, color: '#94a3b8' } },
                        y: { border: { dash: [6, 6] }, grid: { color: 'rgba(0,0,0,0.02)' }, ticks: { font: { weight: 'bold', size: 9 }, color: '#94a3b8' } }
                    }
                }} />
            </div>
        </div>

        {/* Tactical Strategy Feed - Landscape */}
        <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-20 -mt-20" />
            <h3 className="text-xl font-black mb-10 flex items-center gap-4 relative z-10 italic tracking-tighter uppercase">
                <Target className="text-primary fill-primary" size={24} />
                ROI Protocol & Execution Control
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
                {[
                    { title: 'Sourcing Optimization', desc: 'Redirecting 20% budget from "Pet Supplies" to "Home Decor" based on viral velocity.', delta: '+14% ROI' },
                    { title: 'Market Sentiment', desc: 'Competitor activity in "Electronics" increased by 30%. Defensive pricing active.', delta: 'Stable' },
                    { title: 'Shipping Efficiency', desc: 'Consolidated warehousing saved $1,240 in carrier fees this cycle.', delta: 'Saving' }
                ].map((p, i) => (
                    <div key={i} className="group cursor-pointer bg-white/5 p-8 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all">
                        <div className="flex justify-between items-end mb-3">
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{p.title}</h4>
                            <span className="text-[9px] font-black text-emerald-400 italic">{p.delta}</span>
                        </div>
                        <p className="text-xs text-white/50 font-bold leading-relaxed">{p.desc}</p>
                    </div>
                ))}
            </div>

            <button className="w-full mt-10 bg-white/5 border border-white/10 h-16 rounded-2xl flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all group">
                <span>View Full Strategic Report</span>
                <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
            </button>
        </div>
      </div>

      {/* Bottom Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-primary mb-6">
                <Users size={32} />
            </div>
            <h4 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Customer Loyalty</h4>
            <div className="mt-4 flex items-center gap-2">
                <span className="text-3xl font-black text-slate-800 tracking-tighter">84.2%</span>
                <span className="text-[10px] font-black text-emerald-500 uppercase">+4.1%</span>
            </div>
            <p className="text-xs text-slate-400 font-bold mt-2">Retention remains above industry average.</p>
         </div>

         <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-6">
                <Clock size={32} />
            </div>
            <h4 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Order Latency</h4>
            <div className="mt-4 flex items-center gap-2">
                <span className="text-3xl font-black text-slate-800 tracking-tighter">2.4m</span>
                <span className="text-[10px] font-black text-emerald-500 uppercase">-12s</span>
            </div>
            <p className="text-xs text-slate-400 font-bold mt-2">Processing speed optimized by AI agent.</p>
         </div>

         <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center text-center group cursor-pointer hover:border-primary/30 transition-all">
            <div className="w-16 h-16 bg-slate-50 group-hover:bg-primary/5 transition-all rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-primary mb-6">
                <Activity size={32} />
            </div>
            <h4 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Export Intel</h4>
            <p className="text-xs text-slate-400 font-bold mt-4 px-6 leading-relaxed">Download raw transactional data for custom modeling pipelines.</p>
            <button className="mt-6 text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                Download CSV <ExternalLink size={14} />
            </button>
         </div>
      </div>
    </div>
  );
};

export default Analytics;
