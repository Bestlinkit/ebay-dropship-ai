import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  ShieldCheck, 
  ExternalLink, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  ArrowRight,
  Lock,
  X,
  Store
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * ConnectModal: Simulates the eBay OAuth 2.0 Authorization Flow.
 * Features professional "Verified Partner" branding.
 */
const ConnectModal = ({ isOpen, onClose, onConnected }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleStartOAuth = () => {
    setLoading(true);
    // Simulate redirect to eBay
    setTimeout(() => {
        setStep(2);
        setLoading(false);
    }, 2000);
  };

  const handleAuthorize = () => {
    setLoading(true);
    // Simulate callback and token exchange
    setTimeout(() => {
        setStep(3);
        setLoading(false);
        toast.success("eBay Store Connected Successfully!");
        if (onConnected) onConnected();
    }, 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-[3.5rem] shadow-3xl overflow-hidden border border-slate-100"
      >
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-primary transition-colors z-10">
            <X size={24} />
        </button>

        <div className="p-10 md:p-14">
            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div 
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="text-center space-y-8"
                    >
                        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto ring-8 ring-primary/5">
                            <Store className="text-primary" size={40} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight mb-3">Connect your Store</h2>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                Enable DropAI to manage your listings, automate offers, and optimize ad spend by linking your eBay business account.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                                <ShieldCheck className="text-emerald-500 shrink-0" size={24} />
                                <p className="text-xs font-bold text-slate-600">Secure AES-256 Encryption for all API tokens.</p>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                                <Lock className="text-primary shrink-0" size={24} />
                                <p className="text-xs font-bold text-slate-600">Restricted access: Only Listing & Marketing scopes.</p>
                            </div>
                        </div>

                        <button 
                            onClick={handleStartOAuth}
                            disabled={loading}
                            className="w-full btn-primary h-16 flex items-center justify-center gap-3 shadow-2xl shadow-primary/30"
                        >
                            {loading ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />}
                            <span className="font-black uppercase tracking-widest text-sm text-white">Authorize via eBay</span>
                        </button>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div 
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="text-center space-y-8"
                    >
                         <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto group">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.svg" className="w-12 h-12" alt="eBay" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight mb-3">Confirm Permission</h2>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                You are about to grant **DropAI V4.0** permission to access your eBay store data.
                            </p>
                        </div>
                        
                        <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 text-left space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Application</span>
                                <span className="text-xs font-black text-primary">DropAI Pro</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Store Region</span>
                                <span className="text-xs font-black text-slate-900">US Marketplace (ebay.com)</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Scopes</span>
                                <span className="text-xs font-black text-emerald-600 underline">View Full List</span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setStep(1)} className="flex-1 btn-secondary h-16 bg-slate-100 border-none hover:bg-slate-200 uppercase tracking-widest text-[10px] font-black">Cancel</button>
                            <button 
                                onClick={handleAuthorize}
                                disabled={loading}
                                className="flex-2 btn-primary h-16 px-10 flex items-center justify-center gap-3 shadow-2xl shadow-primary/30"
                            >
                                {loading ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}
                                <span className="font-black uppercase tracking-widest text-sm text-white">Agree & Link</span>
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div 
                        key="step3"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-10"
                    >
                        <div className="w-28 h-28 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30 animate-in zoom-in-75 duration-500">
                             <CheckCircle2 className="text-white" size={64} />
                        </div>
                        <div>
                             <h2 className="text-4xl font-black tracking-tighter mb-4 italic">Store Connected!</h2>
                             <p className="text-slate-500 font-medium text-lg">Your eBay environment is now linked to DropAI V4.0.</p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="w-full btn-primary h-16 flex items-center justify-center gap-4 group"
                        >
                            <span className="font-black uppercase tracking-widest text-sm text-white">Launch Dashboard</span>
                            <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Modal Footer Banner */}
        <div className="bg-slate-50 border-t border-slate-100 p-6 flex justify-center items-center gap-3">
             <ShieldCheck size={16} className="text-slate-300" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">A Secure Encryption Tunnel between DropAI & eBay</span>
        </div>
      </motion.div>
    </div>
  );
};

export default ConnectModal;
