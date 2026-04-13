import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Globe } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 md:p-20 font-outfit">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-12"
      >
        <header className="space-y-4 text-center">
            <div className="w-20 h-20 bg-primary-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-primary-500/30">
                <Shield size={40} className="text-primary-400" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight">Privacy Policy.</h1>
            <p className="text-slate-400 text-lg">Your data sovereignty is our architectural priority.</p>
        </header>

        <section className="glass-card p-10 md:p-16 rounded-[3rem] border-white/5 space-y-10 leading-relaxed text-slate-300">
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Lock size={24} className="text-primary-400" />
                    Data Collection
                </h2>
                <p>
                    We collect only the necessary marketplace data required to facilitate your dropshipping operations. This includes your eBay credentials, Eprolo API keys, and marketplace preference data.
                </p>
            </div>

            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Eye size={24} className="text-primary-400" />
                    How We Use Data
                </h2>
                <p>
                    Your data is used exclusively to orchestrate marketplace listings, sync inventory, and generate AI insights. We do not sell, trade, or expose your data to ternary nodes.
                </p>
            </div>

            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Globe size={24} className="text-primary-400" />
                    Public Assets
                </h2>
                <p>
                    Products published to eBay follow eBay's standard visibility protocols. Asset metadata is stored securely within the Geonoyc ecosystem.
                </p>
            </div>

            <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Last Synced: April 2026</p>
                <button 
                  onClick={() => window.history.back()}
                  className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-all"
                >
                  Return to Console
                </button>
            </div>
        </section>
      </motion.div>
    </div>
  );
};

export default PrivacyPolicy;
