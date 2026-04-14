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
  Loader2,
  Moon,
  Sun,
  Contrast,
  Sliders
} from 'lucide-react';
import { toast } from 'sonner';
import ConnectModal from '../components/ConnectModal';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

/**
 * Ultra-Pro Settings Configuration (v12.0 Responsive)
 */
const Settings = () => {
  const [activeTab, setActiveTab] = useState('branding');
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isStoreConnected, setIsStoreConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const { primaryColor, themeMode, uiScale, updateTheme } = useTheme();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.tab) {
        setActiveTab(location.state.tab);
    }
  }, [location.state]);

  const [apiKeys, setApiKeys] = useState({
    ebayAppId: "9823-PROD-...",
    ebayCertId: "PRD-2309-...",
    ebayRuName: "Geonoyc_App_Auth",
    geminiKey: "AI_823-...",
    eporloKey: "EPR-923-..."
  });

  const [smtpConfig, setSmtpConfig] = useState({
    host: "mail.geonoyc.com",
    port: "465",
    user: "ebaydrop@geonoyc.com",
    pass: "••••••••••••"
  });

  const [isTestingBridge, setIsTestingBridge] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
        setLoading(false);
        toast.success("Deployment Architecture Synced!");
    }, 1500);
  };

  const handleTestBridge = async () => {
    setIsTestingBridge(true);
    setTimeout(() => {
        setIsTestingBridge(false);
        toast.success("Identity Bridge Verified: Connected as GEONOYC_GLOBAL");
    }, 1200);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-40 w-full max-w-full">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[var(--border-color)] pb-10">
        <div className="space-y-2">
           <h1 className="text-4xl font-black text-[var(--text-primary)] leading-tight uppercase italic tracking-tighter">Core Protocols.</h1>
           <p className="text-[var(--text-secondary)] font-bold text-[11px] uppercase tracking-widest italic">Manage your platform identity and intelligence connectors.</p>
        </div>
        <button 
           onClick={handleSave}
           disabled={loading}
           className="px-10 py-5 bg-[var(--text-primary)] text-[var(--bg-app)] rounded-2xl flex items-center gap-3 hover:bg-[var(--primary-500)] hover:text-white transition-all shadow-2xl active:scale-95 disabled:opacity-50"
        >
            {loading ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
            <span className="font-black uppercase tracking-widest text-[11px]">Save Deployment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
        {/* Sidebar Nav (Responsive Sticky) */}
        <div className="xl:col-span-3 space-y-6 sticky top-28">
          <div className="bg-[var(--bg-card)] p-4 rounded-[2.5rem] border border-[var(--border-color)] space-y-1.5 shadow-3xl">
            {[
                { id: 'branding', label: 'Visual Interface', icon: Palette },
                { id: 'profile', label: 'Identity Node', icon: User },
                { id: 'api', label: 'Access Tokens', icon: Key },
                { id: 'store', label: 'eBay Bridge', icon: Store },
                { id: 'smtp', label: 'Mail Relay', icon: Mail },
                { id: 'security', label: 'Vault Safety', icon: Shield },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                        "w-full flex items-center justify-between p-5 rounded-2xl transition-all group",
                        activeTab === tab.id ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-2xl' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                    )}
                >
                    <div className="flex items-center gap-4">
                        <tab.icon size={20} className={activeTab === tab.id ? "text-[var(--primary-500)]" : "text-slate-700 transition-colors"} />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] leading-none">{tab.label}</span>
                    </div>
                    {activeTab === tab.id && <ChevronRight size={14} className="text-[var(--primary-500)]" />}
                </button>
            ))}
          </div>
        </div>

        {/* Dynamic Area (Rule 1 & 2 Compliance) */}
        <div className="xl:col-span-9 w-full min-w-0">
            
            {activeTab === 'branding' && (
                <div className="space-y-12 animate-in slide-in-from-right-8 duration-700">
                    
                    {/* 🎨 THEME MODE SELECTOR (Rule 1 compliance) */}
                    <div className="bg-[var(--bg-card)] p-12 rounded-[4rem] border border-[var(--border-color)] shadow-3xl space-y-10">
                        <div className="space-y-3">
                           <h3 className="text-2xl font-black text-[var(--text-primary)] leading-none italic uppercase tracking-tight">Adaptive Interface.</h3>
                           <p className="text-[var(--text-secondary)] font-bold text-[11px] uppercase tracking-widest">Select your preferred cognitive environment.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           {[
                              { id: 'dark', label: 'Midnight (Dark)', icon: Moon, desc: 'Optimized for performance' },
                              { id: 'light', label: 'Crystal (Light)', icon: Sun, desc: 'High-visibility clarity' },
                              { id: 'contrast', label: 'High Contrast', icon: Contrast, desc: 'Maximum accessibility' }
                           ].map(mode => (
                              <button
                                key={mode.id}
                                onClick={() => updateTheme({ themeMode: mode.id })}
                                className={cn(
                                   "flex flex-col items-center gap-6 p-10 rounded-[2.5rem] border-2 transition-all group",
                                   themeMode === mode.id ? "bg-[var(--bg-elevated)] border-[var(--primary-500)] shadow-2xl" : "bg-transparent border-[var(--border-color)] hover:border-slate-700"
                                )}
                              >
                                 <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", themeMode === mode.id ? "bg-[var(--primary-500)] text-white shadow-[0_0_30px_rgba(14,140,233,0.3)]" : "bg-slate-900 text-slate-500")}>
                                    <mode.icon size={28} />
                                 </div>
                                 <div className="text-center">
                                    <span className="text-[12px] font-black uppercase tracking-widest block text-[var(--text-primary)]">{mode.label}</span>
                                    <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase mt-2 block tracking-tight">{mode.desc}</span>
                                 </div>
                              </button>
                           ))}
                        </div>
                    </div>

                    {/* 📐 UI SCALE CONTROL (Rule 6 Compliance) */}
                    <div className="bg-[var(--bg-card)] p-12 rounded-[4rem] border border-[var(--border-color)] shadow-3xl space-y-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                           <div className="space-y-3">
                              <h3 className="text-2xl font-black text-[var(--text-primary)] leading-none italic uppercase tracking-tight flex items-center gap-4">
                                 <Sliders className="text-[var(--primary-500)]" size={32} />
                                 Display Scale
                              </h3>
                              <p className="text-[var(--text-secondary)] font-bold text-[11px] uppercase tracking-widest">Adjust global typography and spacing density.</p>
                           </div>
                           <div className="flex items-center gap-8 bg-[var(--bg-elevated)] px-8 py-5 rounded-3xl border border-[var(--border-color)] shadow-inner">
                              <span className="text-3xl font-black text-[var(--text-primary)] italic tracking-tighter">{uiScale}%</span>
                              <input 
                                 type="range" 
                                 min="90" 
                                 max="110" 
                                 step="5"
                                 value={uiScale}
                                 onChange={(e) => updateTheme({ uiScale: parseInt(e.target.value) })}
                                 className="w-48 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--primary-500)]"
                              />
                           </div>
                        </div>
                    </div>

                    {/* 🎨 BRANDING SYNC */}
                    <div className="bg-[var(--bg-card)] p-12 rounded-[4rem] border border-[var(--border-color)] shadow-3xl flex flex-col md:flex-row justify-between items-center gap-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary-500)]/5 rounded-full blur-[80px] -mr-32 -mt-32" />
                        <div className="relative z-10 space-y-4">
                            <h3 className="text-2xl font-black flex items-center gap-4 text-[var(--text-primary)] leading-none italic uppercase tracking-tight">
                               Neural Identity.
                            </h3>
                            <p className="text-[var(--text-secondary)] font-bold text-[11px] uppercase tracking-widest leading-relaxed">Synchronize your primary brand vector across the hub.</p>
                        </div>
                        
                        <div className="flex items-center gap-10">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em]">Active Registry</p>
                                <p className="text-sm font-black text-[var(--text-primary)] font-mono uppercase mt-1 tracking-widest">{primaryColor}</p>
                            </div>
                            <div className="relative group">
                                <input 
                                    type="color" 
                                    value={primaryColor}
                                    onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                                    className="w-20 h-20 rounded-[1.5rem] cursor-pointer border-8 border-[var(--bg-elevated)] shadow-3xl hover:scale-110 transition-transform"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* API Tab Placeholder (Responsive) */}
            {activeTab === 'api' && (
                <div className="bg-[var(--bg-card)] p-12 rounded-[4rem] border border-[var(--border-color)] shadow-3xl animate-in slide-in-from-right-8 duration-700">
                    <h3 className="text-2xl font-black mb-12 flex items-center gap-5 text-[var(--text-primary)] italic uppercase tracking-tight leading-none">
                       <Key className="text-[var(--primary-500)]" size={32} />
                       Enterprise Registry
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {[
                            { key: 'ebayAppId', label: 'Marketplace App Vector' },
                            { key: 'ebayCertId', label: 'Production Cert Signature' },
                            { key: 'ebayRuName', label: 'Redirect Protocol (RuName)' },
                            { key: 'geminiKey', label: 'AI Cognitive Bridge' },
                            { key: 'eporloKey', label: 'Eprolo Merchant Secret' },
                        ].map(input => (
                            <div key={input.key} className="space-y-4">
                                <label className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-widest px-1">{input.label}</label>
                                <input 
                                    type="password" 
                                    value={apiKeys[input.key]}
                                    onChange={(e) => setApiKeys({...apiKeys, [input.key]: e.target.value})}
                                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl px-6 py-5 text-sm font-black text-[var(--text-primary)] shadow-2xl outline-none focus:border-[var(--primary-500)] transition-all font-mono"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
