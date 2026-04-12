import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  MoreHorizontal, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock,
  Filter,
  Eye,
  Loader2,
  Package,
  Zap,
  Activity,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import ebayTrading from '../services/ebay_trading';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const MyProducts = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchListings = async () => {
        setLoading(true);
        try {
            const token = user?.ebayToken || import.meta.env.VITE_EBAY_USER_TOKEN;
            const liveProducts = await ebayTrading.getActiveListings(token);
            setProducts(liveProducts);
        } catch (e) {
            console.error("Failed to sync products:", e);
            toast.error("Vector sync failed for inventory nodes.");
        } finally {
            setLoading(false);
        }
    };

    fetchListings();
  }, [user]);

  const filteredProducts = products.filter(p => {
    if (activeTab === 'all') return true;
    return p.status.toLowerCase() === activeTab;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Inventory Pulse.</h1>
          <p className="text-slate-400 font-bold mt-1 text-sm uppercase tracking-widest flex items-center gap-2">
            <Package size={14} className="text-primary-500" />
            Live Marketplace Synchronization
          </p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input type="text" placeholder="Search live nodes..." className="w-full flex h-14 bg-white rounded-2xl border border-slate-100 pl-12 text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all" />
           </div>
           <button className="h-14 px-5 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
              <Filter size={20} />
           </button>
        </div>
      </div>

      <div className="glass-card rounded-[3rem] flex flex-col overflow-hidden border-slate-100/50">
         <div className="flex border-b border-slate-50 px-8 pt-8">
            {['All', 'Published', 'Draft', 'Archived'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
                  activeTab === tab.toLowerCase() ? 'text-slate-900' : 'text-slate-300 hover:text-slate-500'
                }`}
              >
                {tab}
                {activeTab === tab.toLowerCase() && (
                  <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-t-full" />
                )}
              </button>
            ))}
         </div>

         <div className="overflow-x-auto">
            {loading ? (
                <div className="py-40 flex flex-col items-center justify-center gap-6">
                    <Loader2 className="animate-spin text-slate-200" size={64} strokeWidth={1} />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Decoding Inventory Vectors...</p>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="py-40 flex flex-col items-center justify-center gap-6 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200">
                        <Package size={40} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-slate-900 uppercase">Empty Sector</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest max-w-[240px]">No active listings detected on your linked eBay production node.</p>
                    </div>
                    <button className="mt-4 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Establish New Link</button>
                </div>
            ) : (
                <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50/30 text-slate-400 text-[9px] font-black uppercase tracking-[0.3em]">
                    <th className="px-10 py-5">Product Identity</th>
                    <th className="px-10 py-5">Node Status</th>
                    <th className="px-10 py-5">Market Price</th>
                    <th className="px-10 py-5">Watcher Delta</th>
                    <th className="px-10 py-5">Sync Date</th>
                    <th className="px-10 py-5">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-10 py-8">
                        <span className="font-bold text-sm text-slate-900 block max-w-xs truncate group-hover:text-primary-500 transition-colors">{p.title}</span>
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">UUID: {p.id}</span>
                        </td>
                        <td className="px-10 py-8">
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            p.status === 'Published' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' : 'bg-slate-100 text-slate-400 border-slate-200/50'
                        }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${p.status === 'Published' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                            {p.status}
                        </div>
                        </td>
                        <td className="px-10 py-8">
                        <div className="flex flex-col">
                            <span className="text-base font-black text-slate-900">${p.price.toFixed(2)}</span>
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">USD Base</span>
                        </div>
                        </td>
                        <td className="px-10 py-8">
                            <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                <Eye size={16} />
                            </div>
                            <span className="text-xs font-black text-slate-900 tracking-tight">{p.views} <span className="text-[9px] text-slate-400 font-black uppercase ml-1">Watchers</span></span>
                            </div>
                        </td>
                        <td className="px-10 py-8">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.date}</span>
                        </td>
                        <td className="px-10 py-8">
                        <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-all">
                            <button 
                                onClick={() => toast.info("Quick-Edit Node initialized.")}
                                className="w-10 h-10 bg-white border border-slate-100 rounded-xl text-amber-500 hover:bg-amber-50 hover:shadow-lg transition-all flex items-center justify-center group/btn" 
                                title="Quick Sync"
                            >
                                <Zap size={16} className="group-hover/btn:scale-110 transition-transform" />
                            </button>
                            <Link 
                                to={`/optimize/${p.id}`}
                                state={{ product: p }}
                                className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl text-primary-400 hover:bg-slate-800 hover:shadow-lg transition-all flex items-center justify-center group/btn"
                                title="AI Optimization Lab"
                            >
                                <Sparkles size={16} className="group-hover/btn:scale-110 transition-transform" />
                            </Link>
                            <button className="w-10 h-10 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-500 hover:shadow-lg transition-all flex items-center justify-center">
                                <Trash2 size={16} />
                            </button>
                        </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            )}
         </div>
      </div>
    </div>
  );
};

export default MyProducts;
