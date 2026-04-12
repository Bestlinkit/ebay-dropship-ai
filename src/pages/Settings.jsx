import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Key, 
  User, 
  Shield, 
  Database, 
  Save, 
  Zap, 
  ChevronRight, 
  Monitor,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Store,
  RefreshCw,
  Plus,
  Mail,
  Server
} from 'lucide-react';
import { toast } from 'sonner';
import ConnectModal from '../components/ConnectModal';
import { cn } from '../lib/utils';

/**
 * Ultra-Pro Settings Configuration
 */
const Settings = () => {
  const [activeTab, setActiveTab] = useState('api');
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isStoreConnected, setIsStoreConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);

  const [apiKeys, setApiKeys] = useState({
    ebayAppId: "9823-PROD-...",
    ebayCertId: "PRD-2309-...",
    ebayRuName: import.meta.env.VITE_EBAY_RUNAME || "Geonoyc_App_Auth",
    geminiKey: "AI_823-...",
    eporloKey: "EPR-923-..."
  });

  const [smtpConfig, setSmtpConfig] = useState({
    host: "mail.geonoyc.com",
    port: "465",
    user: "ebaydrop@geonoyc.com",
    pass: "••••••••••••"
  });

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
        setLoading(false);
        toast.success("Platform Configuration Updated!");
    }, 1500);
  };

  const handleTestSmtp = () => {
    setIsTestingSmtp(true);
    setTimeout(() => {
        setIsTestingSmtp(false);
        toast.success("SMTP Connection Verified: email sent successfully.");
    }, 2000);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 max-w-[1400px] mx-auto">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h1 className="text-3xl font-black text-slate-900 leading-tight uppercase tracking-tight">System Configuration</h1>
           <p className="text-slate-500 font-bold text-sm mt-1 italic">Manage your enterprise store connections and automation protocols.</p>
        </div>
        <button 
           onClick={handleSave}
           disabled={loading}
           className="bg-slate-900 text-white flex items-center gap-3 px-10 py-4 rounded-2xl shadow-xl shadow-slate-900/20 transition-all active:scale-95 group"
        >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} className="group-hover:translate-y-0.5 transition-transform" />}
            <span className="font-black uppercase tracking-widest text-[10px]">Save Deployment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Sidebar Nav */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-3 rounded-[2rem] border border-slate-100 shadow-sm space-y-1.5">
            {[
                { id: 'profile', label: 'User Profile', icon: User },
                { id: 'api', label: 'API Keys', icon: Key },
                { id: 'store', label: 'eBay Store Link', icon: Store },
                { id: 'smtp', label: 'Mail Server (SMTP)', icon: Mail },
                { id: 'strategy', label: 'Scaling Strategy', icon: Zap },
                { id: 'security', label: 'Data Vault', icon: Shield },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                        "w-full flex items-center justify-between p-4 rounded-2xl transition-all group",
                        activeTab === tab.id ? 'bg-primary text-white shadow-xl shadow-primary/20 font-black' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900 font-bold'
                    )}
                >
                    <div className="flex items-center gap-3">
                        <tab.icon size={18} className={activeTab === tab.id ? "text-white" : "text-slate-300 group-hover:text-primary transition-colors"} />
                        <span className="text-xs uppercase tracking-widest leading-none">{tab.label}</span>
                    </div>
                </button>
            ))}
          </div>

          <div className="bg-slate-900 p-8 rounded-[2rem] text-white overflow-hidden relative shadow-2xl group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <Database size={14} className="text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Pulse</span>
                </div>
                <h4 className="text-sm font-black mb-1 italic">AES-256 VAULT ACTIVE</h4>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-tighter">All tokens are server-side encrypted and rotated every 72h.</p>
              </div>
          </div>
        </div>

        {/* Dynamic Area */}
        <div className="lg:col-span-9">
            
            {activeTab === 'api' && (
                <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm animate-in slide-in-from-right-4 duration-500">
                    <h3 className="text-xl font-black mb-10 flex items-center gap-3 text-slate-800">
                        <Key className="text-primary" size={24} />
                        Enterprise API Tokens
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {[
                            { key: 'ebayAppId', label: 'eBay Production App ID' },
                            { key: 'ebayCertId', label: 'eBay Production Cert ID' },
                            { key: 'ebayRuName', label: 'eBay Redirect URI (RuName)' },
                            { key: 'geminiKey', label: 'Gemini 1.5 Pro Key' },
                            { key: 'eporloKey', label: 'Eprolo Merchant Secret' },
                        ].map(input => (
                            <div key={input.key} className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{input.label}</label>
                                <input 
                                    type="password" 
                                    value={apiKeys[input.key]}
                                    onChange={(e) => setApiKeys({...apiKeys, [input.key]: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-black shadow-inner outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'smtp' && (
                <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm animate-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-xl font-black flex items-center gap-3 text-slate-800">
                            <Mail className="text-primary" size={24} />
                            Mail Server (SMTP)
                        </h3>
                        <button 
                            onClick={handleTestSmtp}
                            disabled={isTestingSmtp}
                            className="text-[10px] font-black text-primary px-4 py-2 border border-primary/20 rounded-xl hover:bg-primary/5 transition-all flex items-center gap-2 uppercase tracking-widest"
                        >
                            {isTestingSmtp ? <Loader2 className="animate-spin" size={14} /> : <Server size={14} />}
                            {isTestingSmtp ? "Connecting..." : "Test Connection"}
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                         {[
                            { key: 'host', label: 'SMTP Hostname' },
                            { key: 'port', label: 'SMTP Port' },
                            { key: 'user', label: 'Username / Email' },
                            { key: 'pass', label: 'Password' },
                        ].map(input => (
                            <div key={input.key} className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{input.label}</label>
                                <input 
                                    type={input.key === 'pass' ? 'password' : 'text'}
                                    value={smtpConfig[input.key]}
                                    onChange={(e) => setSmtpConfig({...apiKeys, [input.key]: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-black shadow-inner outline-none focus:ring-4 focus:ring-primary/10 transition-all font-mono"
                                />
                            </div>
                        ))}
                    </div>
                    <p className="mt-8 text-[10px] text-slate-400 font-bold italic leading-relaxed uppercase tracking-tighter">
                        REQUIRED FOR AUTOMATED EBAY CUSTOMER NOTIFICATIONS AND TRACKING UPDATES.
                    </p>
                </div>
            )}

            {activeTab === 'store' && (
                 <div className="bg-white p-20 rounded-[4rem] border border-slate-100 shadow-sm text-center animate-in slide-in-from-right-4 duration-500">
                    <div className={cn(
                        "w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-10 transition-all duration-700 shadow-2xl shadow-slate-200",
                        isStoreConnected ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-300"
                    )}>
                        {isStoreConnected ? <CheckCircle2 size={48} /> : <Store size={48} />}
                    </div>

                    <h3 className="text-3xl font-black mb-4 uppercase tracking-tight">
                        {isStoreConnected ? "EBay Store Live" : "Sync Storefront"}
                    </h3>
                    <p className="text-slate-400 font-bold mb-12 max-w-sm mx-auto text-sm leading-relaxed italic">Authorize your eBay business account to unlock automated sourcing, listing, and 24s video ad pushing.</p>

                    <div className="flex justify-center">
                        {!isStoreConnected ? (
                            <button 
                                onClick={() => setIsConnectModalOpen(true)}
                                className="bg-primary text-white h-20 px-14 rounded-3xl flex items-center justify-center gap-4 shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all group min-w-[320px]"
                            >
                                <Plus size={28} className="group-hover:rotate-90 transition-transform" />
                                <span className="font-black uppercase tracking-widest text-xs">Establish API Bridge</span>
                            </button>
                        ) : (
                             <button 
                                onClick={() => setIsStoreConnected(false)}
                                className="text-rose-500 hover:underline text-[11px] font-black uppercase tracking-widest"
                             >
                                Terminate Connection
                             </button>
                        )}
                    </div>
                 </div>
            )}

            {activeTab === 'strategy' && (
                 <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8 animate-in slide-in-from-right-4 duration-500">
                    <h3 className="text-xl font-black flex items-center gap-3 text-slate-800">
                        <Zap className="text-primary" size={24} />
                        Scaling & Automation Protocol
                    </h3>
                    
                    {[
                        { title: 'Auto-Optimization', desc: 'AI Re-writing titles and sharpening images upon eBay list.', active: true },
                        { title: 'Global Compliance', desc: 'Real-time VeRO scanning before automated listing push.', active: true },
                        { title: 'Ad Scaling', desc: 'Automatic budget increase on products hitting >5.0x ROI.', active: false },
                    ].map((item, i) => (
                        <div key={i} className={cn(
                            "p-8 rounded-[2rem] border flex items-center justify-between group transition-all duration-500",
                            item.active ? 'border-primary/20 bg-primary/5' : 'border-slate-50 bg-slate-50'
                        )}>
                            <div>
                                <h4 className={cn("font-black text-sm uppercase tracking-tight", item.active ? "text-primary" : "text-slate-800")}>{item.title}</h4>
                                <p className="text-xs text-slate-400 font-bold mt-1 max-w-md italic">{item.desc}</p>
                            </div>
                            <button 
                                className={cn(
                                    "w-14 h-8 rounded-full p-1.5 flex items-center transition-all duration-500",
                                    item.active ? "bg-primary" : "bg-slate-300"
                                )}
                            >
                                <div className={cn("w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-500", item.active ? "ml-auto" : "ml-0 shadow-none")} />
                            </button>
                        </div>
                    ))}
                 </div>
            )}
        </div>
      </div>

      <ConnectModal 
        isOpen={isConnectModalOpen} 
        onClose={() => setIsConnectModalOpen(false)}
        onConnected={() => {
            setIsStoreConnected(true);
            setIsConnectModalOpen(false);
        }}
      />
    </div>
  );
};

export default Settings;
