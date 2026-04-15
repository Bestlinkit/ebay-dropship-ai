import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Critical System Failure:", error, errorInfo);
  }

  render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-white flex items-center justify-center p-6 font-inter selection:bg-rose-500/10">
                    <div className="max-w-md w-full bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-[0_32px_120px_rgba(0,0,0,0.08)] text-center space-y-8 animate-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-rose-50 rounded-[1.5rem] flex items-center justify-center mx-auto border border-rose-100 shadow-sm">
                            <AlertTriangle size={36} className="text-rose-500" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">System Fault.</h2>
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em]">System Desynchronization</p>
                        </div>
                        
                        {this.state.error && (
                            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                                <p className="text-[9px] font-black font-mono text-slate-400 break-all uppercase leading-relaxed text-left">
                                    {this.state.error.toString().slice(0, 150)}...
                                </p>
                            </div>
                        )}

                        <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-[280px] mx-auto">
                            The terminal encountered a critical system mismatch. This usually occurs during a session timeout or API link failure.
                        </p>
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <button 
                                onClick={() => window.location.reload()}
                                className="h-12 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
                            >
                                <RefreshCw size={14} /> Restart System
                            </button>
                            <button 
                                onClick={() => window.location.href = '/'}
                                className="h-12 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all border border-slate-100"
                            >
                                <Home size={14} /> Return Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

    return this.props.children;
  }
}

export default ErrorBoundary;
