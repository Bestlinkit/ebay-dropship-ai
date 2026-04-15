import React from 'react';
import { 
  RefreshCw, 
  Package, 
  Globe,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Sourcing Status Header (v3.0)
 * Truth-based status bar for Eprolo and AliExpress flows.
 */
const SourcingStatusHeader = ({ state, loading, resultsCount, isGlobal = false }) => {
    return (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800 pb-8">
            <div className="flex items-center gap-4">
                <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                    loading ? "bg-emerald-500/20 text-emerald-500 animate-pulse" : 
                    isGlobal ? "bg-amber-500/20 text-amber-500" : "bg-blue-500/20 text-blue-500"
                )}>
                    {loading ? <RefreshCw size={20} className="animate-spin" /> : 
                     isGlobal ? <Globe size={20} /> : <ShieldCheck size={20} />}
                </div>
                <div>
                    <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">
                        {isGlobal ? 'AliExpress Search' : 'Eprolo Discovery'}
                    </h2>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">
                        Status: <span className={cn(loading ? "text-emerald-500" : "text-slate-400")}>
                            {loading ? 'Probing Suppliers...' : 'Active and Secure'}
                        </span>
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
                {/* 📊 RESULT COUNTER */}
                <div className="px-5 py-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
                    <Package size={14} className="text-slate-500" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                        {resultsCount} Results Found
                    </span>
                </div>

                {/* 🔌 CONNECTION TYPE */}
                <div className="flex items-center gap-3 text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] bg-slate-950/50 px-4 py-2 rounded-lg border border-white/5">
                    {isGlobal ? <Globe size={12} className="text-amber-500" /> : <ShieldCheck size={12} className="text-blue-500" />}
                    {isGlobal ? 'Global Scraper' : 'Direct API Bridge'}
                </div>
            </div>
        </div>
    );
};

export default SourcingStatusHeader;
