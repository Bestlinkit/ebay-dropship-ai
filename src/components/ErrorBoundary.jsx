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
    if (this.state) {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-outfit">
                    <div className="max-w-md w-full glass-card p-12 rounded-[3.5rem] border-rose-500/20 text-center space-y-8 animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-rose-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-rose-500/20">
                            <AlertTriangle size={48} className="text-rose-500" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">System Crash</h2>
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em]">Error Vector Detected</p>
                        </div>
                        
                        {this.state.error && (
                            <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-2xl">
                                <p className="text-[10px] font-mono text-rose-400 break-all">{this.state.error.toString()}</p>
                            </div>
                        )}

                        <p className="text-slate-400 text-sm font-medium leading-relaxed">
                            A critical runtime error has interrupted the terminal sequence. This is often caused by missing configuration or session instability.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => window.location.reload()}
                                className="h-14 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary-500 hover:text-white transition-all"
                            >
                                <RefreshCw size={14} /> Restart
                            </button>
                            <button 
                                onClick={() => window.location.href = '/'}
                                className="h-14 bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-700 transition-all border border-white/5"
                            >
                                <Home size={14} /> Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
