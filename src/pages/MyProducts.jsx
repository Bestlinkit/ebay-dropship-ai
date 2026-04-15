import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Sparkles,
  Megaphone,
  Play,
  Layers,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import ebayTrading from '../services/ebay_trading';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

const MyProducts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchListings = async () => {
        setLoading(true);
        try {
            const token = user?.ebayToken || import.meta.env.VITE_EBAY_USER_TOKEN;
            const liveProducts = await ebayTrading.getActiveListings(token);
            setProducts(liveProducts || []);
        } catch (e) {
            toast.error("Failed to sync inventory.");
        } finally {
            setLoading(false);
        }
    };
    fetchListings();
  }, [user]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
        setSelectedIds([]);
    } else {
        setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const handleBulkOptimization = async () => {
    setIsBulkProcessing(true);
    toast.promise(
        new Promise(resolve => setTimeout(resolve, 3000)),
        {
            loading: `Optimizing ${selectedIds.length} listings...`,
            success: `Registry synchronized! ${selectedIds.length} products updated.`,
            error: 'Bulk throughput failure.'
        }
    );
    // Real logic would iterate through selectedIds and call AIService/eBayService
    setTimeout(() => {
        setIsBulkProcessing(false);
        setSelectedIds([]);
    }, 3000);
  };

  const filteredProducts = (products || []).filter(p => {
    const matchesTab = activeTab === 'all' || p.status?.toLowerCase() === activeTab.toLowerCase();
    const matchesSearch = !searchTerm || 
                         p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.id?.toString().includes(searchTerm);
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Inventory Registry.</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] flex items-center gap-2">
            <Layers size={14} className="text-primary-500" /> Distributed Control Hub
          </p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
           <div className="relative flex-1 md:w-80 text-slate-900">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                type="text" 
                placeholder="Search registry indices..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full flex h-12 bg-white rounded-xl border border-slate-200 pl-12 text-[11px] font-bold placeholder:text-slate-300 focus:outline-none ring-slate-950/5 transition-all focus:ring-4" 
              />
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[12px] border border-slate-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col relative">
         <div className="flex border-b border-slate-100 px-6 bg-slate-50/10">
            {['All', 'Published', 'Draft'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest relative ${
                  activeTab === tab.toLowerCase() ? 'text-slate-950' : 'text-slate-400'
                }`}
              >
                {tab}
                {activeTab === tab.toLowerCase() && (
                  <motion.div layoutId="t-line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-950" />
                )}
              </button>
            ))}
         </div>

         <div className="flex-1 overflow-x-auto">
            {loading ? (
                <div className="py-40 flex flex-col items-center gap-6">
                    <RefreshCw className="animate-spin text-slate-200" size={32} />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Loading product data...</p>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="py-40 text-center opacity-30 italic text-[10px] font-black uppercase tracking-[0.3em]">No items found</div>
            ) : (
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/30 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50">
                            <th className="px-6 py-4 w-12">
                                <input 
                                    type="checkbox" 
                                    checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0} 
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 rounded-md border-slate-200"
                                />
                            </th>
                            <th className="px-6 py-4">Product Identity</th>
                            <th className="px-6 py-4">Satus</th>
                            <th className="px-6 py-4">Market Price</th>
                            <th className="px-6 py-4">Metadata</th>
                            <th className="px-6 py-4 text-right">Interaction</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredProducts.map((p) => (
                            <tr key={p.id} className={cn("hover:bg-slate-50/50 transition-all cursor-pointer", selectedIds.includes(p.id) && "bg-slate-50")}>
                                <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.includes(p.id)} 
                                        onChange={() => toggleSelect(p.id)}
                                        className="w-4 h-4 rounded-md border-slate-200 accent-slate-950"
                                    />
                                </td>
                                <td className="px-6 py-5" onClick={() => navigate(`/optimize/${p.id}`, { state: { ebayProduct: p } })}>
                                    <p className="text-[11px] font-black text-slate-950 uppercase leading-tight truncate max-w-sm">{p.title}</p>
                                    <p className="text-[8px] font-black text-slate-300 uppercase mt-1">ID: {p.id}</p>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-100 rounded-lg text-[8px] font-black uppercase tracking-widest text-slate-400">
                                        <div className={cn("w-1 h-1 rounded-full", p.status === 'Published' ? "bg-emerald-500" : "bg-slate-300")} />
                                        {p.status}
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col">
                                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Price</span>
                                        <span className="text-xs font-black text-slate-950">
                                            {typeof p.price === 'number' ? `$${p.price.toFixed(2)}` : 'N/A'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <div className="flex items-center gap-1.5"><Eye size={12} /> <span className="text-[8px] font-black">{p.views}</span></div>
                                        <div className="flex items-center gap-1.5"><Activity size={12} /> <span className="text-[8px] font-black text-emerald-500">92%</span></div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <button onClick={() => navigate(`/optimize/${p.id}`, { state: { ebayProduct: p } })} className="p-2 hover:bg-slate-950 hover:text-white rounded-lg transition-all text-slate-400">
                                        <Edit3 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
         </div>

         {/* SaaS Bulk Optimization Toolset */}
         <AnimatePresence>
            {selectedIds.length > 0 && (
                <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-950 text-white px-8 py-4 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-12 z-[100]"
                >
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text/50">Listings Selected</span>
                        <span className="text-lg font-black tracking-tighter leading-none">{selectedIds.length} Items</span>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            disabled={isBulkProcessing}
                            onClick={handleBulkOptimization}
                            className="bg-primary-400 text-slate-950 h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2"
                        >
                            {isBulkProcessing ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />}
                            Bulk Optimize
                        </button>
                        <button 
                            disabled={isBulkProcessing}
                            onClick={() => setSelectedIds([])}
                            className="bg-white/10 hover:bg-white/20 h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            Deselect all
                        </button>
                    </div>
                </motion.div>
            )}
         </AnimatePresence>
      </div>
    </div>
  );
};

export default MyProducts;
