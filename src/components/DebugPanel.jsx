import React, { useState, useEffect } from 'react';
import { Terminal, Bug, ChevronUp, ChevronDown, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import sourcingService from '../services/sourcing';
import { cn } from '../lib/utils';

/**
 * Deterministic Debug Panel (v1.0)
 * Session-based diagnostic tool for API transparency.
 */
const DebugPanel = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [logs, setLogs] = useState([]);
    
    // Polling logs since they aren't reactive
    useEffect(() => {
        const interval = setInterval(() => {
            setLogs([...sourcingService.getLogs()].reverse());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 z-[9999] p-3 bg-slate-950 text-emerald-500 rounded-full shadow-2xl border border-emerald-500/20 flex items-center gap-2 hover:bg-emerald-500 hover:text-white transition-all group"
            >
                <Bug size={18} className="group-hover:rotate-12 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest px-2 group-hover:block hidden">Debug Active</span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-[#0A0F1E] border-t border-white/5 h-80 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 bg-slate-950 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-indigo-500">
                        <Terminal size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">CJ PROTOCOL v2.0 Diagnostics</span>
                    </div>
                    <div className="h-4 w-[1px] bg-white/10" />
                    <span className={`text-[9px] font-black uppercase tracking-widest underline decoration-indigo-500/30 ${sourcingService.CONFIG.CJ_ACCOUNT_ID === 'UNLINKED' ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
                        Active CJID: {sourcingService.CONFIG.CJ_ACCOUNT_ID}
                        {sourcingService.CONFIG.CJ_ACCOUNT_ID === 'UNLINKED' && " [ACTION: RUN NPM BUILD]"}
                    </span>
                    <div className="h-4 w-[1px] bg-white/10" />
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                        BRIDGE: {import.meta.env.VITE_BACKEND_URL || 'PROXY_LOCAL'}
                    </span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                    <ChevronDown size={20} />
                </button>
            </div>

            {/* Log Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono selection:bg-emerald-500/20">
                {logs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-700 text-[10px] uppercase tracking-[0.2em]">
                        Waiting for API execution...
                    </div>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className="p-4 bg-slate-900/50 border border-white/5 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                                <span className={cn(
                                    "text-[9px] font-black uppercase px-2 py-0.5 rounded",
                                    log.type === 'REQUEST' ? "bg-indigo-500/20 text-indigo-400" :
                                    log.type === 'RESPONSE' ? "bg-emerald-500/20 text-emerald-400" :
                                    "bg-rose-500/20 text-rose-400"
                                )}>
                                    {log.type}
                                </span>
                                <span className="text-[8px] text-slate-600 italic">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            </div>
                            
                            <div className="text-[11px] text-slate-400 bg-slate-950/80 p-3 rounded-lg overflow-x-auto border border-white/5">
                                <pre>
                                    {(() => {
                                        const content = log.payload || log.data || log.raw || log;
                                        if (typeof content === 'string' && content.includes('<!doctype')) {
                                            return "[CRITICAL: BRIDGE OFFLINE / SPA FALLBACK] - Received website HTML instead of API JSON. Ensure Node server is running on port 3001.";
                                        }
                                        return JSON.stringify(content, null, 2);
                                    })()}
                                </pre>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DebugPanel;
