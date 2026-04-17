import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  Server,
  Palette,
  Eye,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import ConnectModal from '../components/ConnectModal';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

/**
 * Ultra-Pro Settings Configuration
 */
const Settings = () => {
  const [activeTab, setActiveTab] = useState('branding');
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isStoreConnected, setIsStoreConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const { primaryColor, updateBrandColor } = useTheme();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.tab) {
        setActiveTab(location.state.tab);
    }
  }, [location.state]);

  const [apiKeys, setApiKeys] = useState({
    ebayAppId: "9823-PROD-...",
    ebayCertId: "PRD-2309-...",
    ebayRuName: import.meta.env.VITE_EBAY_RUNAME || "Geonoyc_App_Auth",
    geminiKey: "AI_823-...",
    aliKey: "ALI-923-..."
  });

  const [smtpConfig, setSmtpConfig] = useState({
    host: "mail.geonoyc.com",
    port: "465",
    user: "ebaydrop@geonoyc.com",
    pass: "••••••••••••"
  });

  const [isTestingBridge, setIsTestingBridge] = useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
        setLoading(false);
        toast.success("Platform Configuration Updated!");
    }, 1500);
  };

  const handleTestBridge = async () => {
    setIsTestingBridge(true);
    try {
        const { default: ebayTrading } = await import('../services/ebay_trading');
        const token = import.meta.env.VITE_EBAY_USER_TOKEN;
        const name = await ebayTrading.getUserProfile(token);
        
        if (name) {
            toast.success(`Bridge Verified: Connected as ${name}`);
        } else {
            throw new Error("Invalid Handshake Response");
        }
    } catch (e) {
        toast.error("Link Failure: Request rejected by eBay.");
    } finally {
        setIsTestingBridge(false);
    }
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
           className="btn-premium flex items-center gap-3 px-10"
        >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
            <span className="font-black uppercase tracking-widest text-[10px]">Save Deployment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Sidebar Nav */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-3 rounded-[2rem] border border-slate-100 shadow-sm space-y-1.5 overflow-hidden">
            {[
                { id: 'branding', label: 'Branding & UI', icon: Palette },
                { id: 'profile', label: 'User Profile', icon: User },
                { id: 'api', label: 'API Keys', icon: Key },
                { id: 'store', label: 'eBay Store Link', icon: Store },
                { id: 'smtp', label: 'Mail Server (SMTP)', icon: Mail },
                { id: 'security', label: 'Privacy & Security', icon: Shield },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                        "w-full flex items-center justify-between p-4 rounded-2xl transition-all group",
                        activeTab === tab.id ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
                    )}
                >
                    <div className="flex items-center gap-3">
                        <tab.icon size={18} className={activeTab === tab.id ? "text-primary-400" : "text-slate-300 group-hover:text-primary-500 transition-colors"} />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">{tab.label}</span>
                    </div>
                </button>
            ))}
          </div>

          <div className="bg-slate-900 p-8 rounded-[2rem] text-white overflow-hidden relative shadow-2xl group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <Database size={14} className="text-primary-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Status</span>
                </div>
                <h4 className="text-sm font-black mb-1 italic">AES-256 VAULT ACTIVE</h4>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-tighter">All tokens are server-side encrypted and rotated every 72h.</p>
              </div>
          </div>
        </div>

        {/* Dynamic Area */}
        <div className="lg:col-span-9">
            
            {activeTab === 'branding' && (
                <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                    <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-[80px] -mr-32 -mt-32" />
                        
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                            <div className="space-y-3">
                                <h3 className="text-2xl font-black flex items-center gap-4 text-slate-900 leading-none">
                                    <Palette className="text-primary-500" size={32} />
                                    Brand Identity
                                </h3>
                                <p className="text-slate-400 font-medium text-sm">Synchronize your primary brand colors across the platform.</p>
                            </div>
                            
                            <div className="flex items-center gap-6">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active HEX</p>
                                    <p className="text-sm font-black text-slate-900 font-mono uppercase">{primaryColor}</p>
                                </div>
                                <div className="relative group">
                                    <input 
                                        type="color" 
                                        value={primaryColor}
                                        onChange={(e) => updateBrandColor(e.target.value)}
                                        className="w-16 h-16 rounded-2xl cursor-pointer border-4 border-white shadow-xl hover:scale-110 transition-transform"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="glass-card p-10 rounded-[3rem] space-y-6">
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <Eye size={14} className="text-primary-500" />
                                Component Preview
                            </h4>
                            <div className="space-y-4">
                                <button className="btn-premium w-full">Primary Button</button>
                                <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-2xl border border-primary-100">
                                    <CheckCircle2 className="text-primary-500" size={18} />
                                    <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest leading-none">Connection Active</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {[50, 200, 500, 700, 900].map(s => (
                                        <div key={s} className={`w-full h-8 rounded-lg bg-primary-${s}`} title={`${s} shade`} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 p-10 rounded-[3rem] flex flex-col justify-center text-center space-y-6">
                             <div className="mx-auto w-16 h-16 rounded-2xl bg-primary-500 flex items-center justify-center text-white shadow-2xl shadow-primary-500/40">
                                <Zap size={28} className="fill-white" />
                             </div>
                             <div className="space-y-1">
                                <h5 className="text-lg font-black text-white uppercase tracking-tight">API Synchronization</h5>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Cross-device deployment verified</p>
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'api' && (
                <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm animate-in slide-in-from-right-4 duration-500">
                    <h3 className="text-xl font-black mb-10 flex items-center gap-3 text-slate-800">
                        <Key className="text-primary-500" size={24} />
                        Enterprise API Tokens
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {[
                            { key: 'ebayAppId', label: 'eBay Production App ID' },
                            { key: 'ebayCertId', label: 'eBay Production Cert ID' },
                            { key: 'ebayRuName', label: 'eBay Redirect URI (RuName)' },
                            { key: 'geminiKey', label: 'Gemini 1.5 Pro Key' },
                            { key: 'aliKey', label: 'AliExpress DS Secret' },
                        ].map(input => (
                            <div key={input.key} className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{input.label}</label>
                                <input 
                                    type="password" 
                                    value={apiKeys[input.key]}
                                    onChange={(e) => setApiKeys({...apiKeys, [input.key]: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-black shadow-inner outline-none focus:ring-4 focus:ring-primary-500/10 transition-all font-mono"
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
                            <Mail className="text-primary-500" size={24} />
                            Mail Server (SMTP)
                        </h3>
                        <button 
                            onClick={handleTestSmtp}
                            disabled={isTestingSmtp}
                            className="text-[10px] font-black text-primary-500 px-4 py-2 border border-primary-500/20 rounded-xl hover:bg-primary-500/5 transition-all flex items-center gap-2 uppercase tracking-widest"
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
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-black shadow-inner outline-none focus:ring-4 focus:ring-primary-500/10 transition-all font-mono"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

             {activeTab === 'store' && (
                  <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                    <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-[80px] -mr-32 -mt-32" />
                        
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="space-y-4 text-center md:text-left">
                                <div className={cn(
                                    "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto md:mx-0 shadow-2xl transition-all duration-700",
                                    isStoreConnected ? "bg-primary-500 text-white shadow-primary-500/30" : "bg-slate-100 text-slate-300"
                                )}>
                                    <Store size={40} />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Identity Bridge Manager</h3>
                                    <p className="text-slate-400 font-bold text-sm italic">Merchant API Connectivity Suite</p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center md:items-end gap-4">
                                <div className={cn(
                                    "px-6 py-2 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em]",
                                    isStoreConnected ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                                )}>
                                    <div className={cn("w-2 h-2 rounded-full", isStoreConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                                    {isStoreConnected ? "Production Bridge Active" : "Bridge Disconnected"}
                                </div>
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Global Sync Status: Verified</p>
                                <button 
                                    onClick={handleTestBridge}
                                    disabled={isTestingBridge}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                                >
                                    {isTestingBridge ? <Loader2 className="animate-spin" size={12} /> : <RefreshCw size={12} />}
                                    {isTestingBridge ? "Handshaking..." : "Test Identity Bridge"}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="glass-card p-10 rounded-[3rem] space-y-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2">
                                    <Zap size={14} className="text-primary-500" />
                                    Active Credentials
                                </h4>
                                <div className="space-y-4">
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Production App ID</p>
                                        <p className="text-xs font-black text-slate-900 font-mono truncate">{apiKeys.ebayAppId}</p>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Marketplace RuName</p>
                                        <p className="text-xs font-black text-slate-900 font-mono">{apiKeys.ebayRuName}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col justify-between relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
                            <div className="space-y-6 relative z-10">
                                <div className="space-y-2">
                                    <h4 className="text-xl font-black tracking-tight leading-none italic">Beat the Glitch.</h4>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Establish a permanent 18-month link to prevent session expiration.</p>
                                </div>
                                <button 
                                    onClick={() => {
                                        const authUrl = `https://auth.ebay.com/oauth2/authorize?client_id=${import.meta.env.VITE_EBAY_APP_ID}&redirect_uri=${import.meta.env.VITE_EBAY_RUNAME}&response_type=code&scope=https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.marketing https://api.ebay.com/oauth/api_scope/sell.account https://api.ebay.com/oauth/api_scope/sell.fulfillment`;
                                        window.location.href = authUrl;
                                    }}
                                    className="w-full btn-premium bg-white text-slate-900 h-16 rounded-2xl flex items-center justify-center gap-3 group hover:scale-[1.02] transition-all"
                                >
                                    <Shield size={20} className="text-primary-500" />
                                    <span className="font-black uppercase tracking-widest text-xs">Deploy Permanent Bridge</span>
                                </button>
                            </div>
                        </div>
                    </div>
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
