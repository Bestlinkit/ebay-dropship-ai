import React from 'react';
import { 
  RefreshCw, 
  Package, 
  Globe,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Sourcing Status Header (v25.0 - CJ Unified)
 * Truth-based status bar for CJ Dropshipping discovery.
 */
const SourcingStatusHeader = ({ state, loading, resultsCount, query = "", onRetry }) => {
    
    const handleCJJump = () => {
        if (!query) return;
        const url = `https://cjdropshipping.com/product-list?keyword=${encodeURIComponent(query)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
            <div className="flex items-center gap-4">
                <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                    loading ? "bg-emerald-500/20 text-emerald-500 animate-pulse" : "bg-blue-500/20 text-blue-500"
                )}>
                    {loading ? <RefreshCw size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
                </div>
                <div>
                    <h2 className="text-xl font-black text-slate-950 italic tracking-tighter uppercase">
                        CJ Discovery Engine
                    </h2>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 text-left">
                        Status: <span className={cn(loading ? "text-emerald-500" : "text-slate-400")}>
                            {loading ? 'ANALYZING CJ CATALOG...' : 'DISCOVERY COMPLETE'}
                        </span>
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="px-5 py-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3 shadow-lg">
                        <Package size={14} className="text-slate-500" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">
                            {resultsCount} CJ Products Scored
                        </span>
                    </div>
                    {!loading && (
                      <button 
                        onClick={onRetry}
                        className="p-3 bg-white text-slate-900 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-md active:scale-95"
                        title="Re-initiate Discovery"
                      >
                        <RefreshCw size={14} />
                      </button>
                    )}
                </div>

                {loading && (
                    <button 
                        onClick={handleCJJump}
                        className="px-5 py-3 bg-indigo-600 text-white rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 animate-bounce-subtle"
                    >
                        <ExternalLink size={14} /> Search CJ Manually
                    </button>
                )}

                <div className="hidden sm:flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    CJ API Connection Active
                </div>
            </div>
        </div>
    );
};

export default SourcingStatusHeader;
