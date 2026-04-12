import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  Package, 
  Video, 
  Settings, 
  LogOut, 
  BarChart3,
  Megaphone,
  Zap,
  Menu,
  X,
  Bell,
  Search as SearchIcon,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Clock,
  ChevronLeft,
  Shield,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarItem = ({ icon: Icon, label, href, active, collapsed, onClick }) => (
  <Link
    to={href}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative",
      active 
        ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20" 
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    )}
  >
    <Icon size={18} className={cn("transition-colors duration-300", active ? "text-primary-300" : "text-slate-400 group-hover:text-slate-600")} />
    {!collapsed && <span className="font-bold text-xs uppercase tracking-widest leading-none">{label}</span>}
    {active && (
        <motion.div 
            layoutId="active-pill"
            className="absolute -left-1 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary-400 rounded-r-full" 
        />
    )}
  </Link>
);

const NotificationDropdown = ({ isOpen, onClose }) => {
    const notifications = [
        { id: 1, type: 'success', title: 'Viral Trend Found', desc: '5 products in "Skincare" are gaining pulse.', time: '2m ago', icon: TrendingUp },
        { id: 2, type: 'alert', title: 'Price Match Alert', desc: 'New lowest price found on Eprolo.', time: '15m ago', icon: Zap },
        { id: 3, type: 'info', title: 'Video Ready', desc: 'Your TikTok ad for Serum 2.0 is ready.', time: '1h ago', icon: CheckCircle2 },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={onClose} />
                    <motion.div 
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-80 glass-card rounded-[2rem] p-4 z-50 overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-6 px-2">
                            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Neural Notifications</h3>
                            <button className="text-[9px] font-bold text-primary-500 hover:underline px-2 py-1 rounded-lg">Clear All</button>
                        </div>
                        <div className="space-y-2 max-h-[350px] overflow-y-auto scrollbar-hide">
                            {notifications.map((n) => (
                                <div key={n.id} className="p-4 bg-white/50 hover:bg-white transition-all rounded-2xl group cursor-pointer flex gap-4 border border-transparent hover:border-slate-100">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-all shrink-0">
                                        <n.icon size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-900 leading-tight mb-1 group-hover:text-primary-600 transition-colors truncate">{n.title}</p>
                                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed line-clamp-2">{n.desc}</p>
                                        <div className="flex items-center gap-1.5 mt-2.5 text-[9px] text-slate-400 font-black uppercase">
                                            <Clock size={10} /> {n.time}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-50 text-center">
                            <button className="text-[9px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto">
                                View Full Activity Log <ArrowRight size={12} />
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

const Layout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: Search, label: 'Market Discovery', href: '/discovery' },
    { icon: Package, label: 'inventory Hub', href: '/products' },
    { icon: Megaphone, label: 'Marketing Hub', href: '/marketing' },
    { icon: Video, label: 'Video Lab', href: '/video' },
    { icon: BarChart3, label: 'Performance', href: '/analytics' },
    { icon: Settings, label: 'System Config', href: '/settings' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-inter selection:bg-primary-100 selection:text-primary-900">
      
      {/* Sidebar Navigation */}
      <aside 
        className={cn(
          "fixed left-0 top-0 h-screen glass-card transition-all duration-500 z-[80] flex flex-col pt-4 border-r-0 rounded-r-[2rem] lg:rounded-none",
          collapsed ? "w-24" : "w-72",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-24 px-8 flex items-center justify-between shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 premium-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                <Zap size={20} className="fill-white" />
              </div>
              <span className="font-outfit font-black text-xl tracking-tight uppercase">DropAI</span>
            </div>
          )}
          {collapsed && (
            <div className="w-10 h-10 premium-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20 mx-auto">
                <Zap size={20} className="fill-white" />
            </div>
          )}
        </div>

        {/* Sidebar scrolling area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-6 space-y-1 py-8">
          <p className={cn("text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4 px-2", collapsed && "text-center")}>
            {collapsed ? 'Hub' : 'Platform Control'}
          </p>
          {menuItems.map((item) => (
            <SidebarItem
              key={item.href}
              {...item}
              active={location.pathname === item.href}
              collapsed={collapsed}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </div>

        <div className="p-6 space-y-4 shrink-0">
          <div className={cn(
            "p-5 rounded-[1.5rem] bg-slate-900 text-white shadow-2xl overflow-hidden relative group transition-all",
            collapsed ? "flex justify-center" : ""
          )}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary-400/20 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
            <div className="flex items-center gap-4 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                    <span className="font-bold text-sm tracking-widest">{user?.email?.[0]?.toUpperCase()}</span>
                </div>
                {!collapsed && (
                <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-tight truncate">{user?.email?.split('@')[0]}</p>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Verified Tier</p>
                    </div>
                </div>
                )}
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full px-5 py-3.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all font-bold uppercase tracking-widest text-[10px]",
              collapsed ? "justify-center" : ""
            )}
          >
            <LogOut size={16} />
            {!collapsed && <span>System Exit</span>}
          </button>
        </div>
      </aside>

      {/* Sidebar Toggle Overlay (Mobile) */}
      <AnimatePresence>
        {mobileOpen && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[70]"
                onClick={() => setMobileOpen(false)}
            />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main 
        className={cn(
          "flex-1 min-w-0 transition-all duration-500",
          collapsed ? "lg:ml-24" : "lg:ml-72",
          "ml-0"
        )}
      >
        {/* Transparent Header */}
        <header className="h-24 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-40 bg-slate-50/80 backdrop-blur-md">
            <div className="flex items-center gap-6">
               <button 
                  onClick={() => setMobileOpen(true)} 
                  className="lg:hidden p-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-900"
               >
                  <Menu size={20} />
               </button>
               <button 
                  onClick={() => setCollapsed(!collapsed)} 
                  className="hidden lg:flex p-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400 hover:text-slate-900 transition-all"
               >
                  <Layers size={18} />
               </button>
               <div className="hidden md:block">
                    <h2 className="text-xl font-outfit font-black uppercase tracking-tight text-slate-900">
                        {menuItems.find(m => m.href === location.pathname)?.label || 'System Core'}
                    </h2>
               </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden lg:flex items-center gap-3 bg-white/50 backdrop-blur-md border border-slate-100 rounded-2xl px-5 py-2.5 transition-all hover:bg-white hover:border-slate-300 group cursor-pointer">
                    <SearchIcon size={14} className="text-slate-400 group-hover:text-primary-600" />
                    <span className="text-[10px] font-black text-slate-400 group-hover:text-slate-900 uppercase tracking-widest">Global Scan (⌘K)</span>
                </div>
                
                <div className="relative">
                    <button 
                        onClick={() => setNotifOpen(!notifOpen)}
                        className={cn(
                            "p-3.5 rounded-2xl transition-all relative border border-transparent", 
                            notifOpen ? "bg-slate-900 text-white shadow-2xl" : "bg-white border-slate-100 text-slate-400 hover:text-slate-900"
                        )}
                    >
                        <Bell size={20} />
                        <div className="absolute top-3 right-3 w-2 h-2 bg-primary-400 rounded-full ring-4 ring-white" />
                    </button>
                    <NotificationDropdown isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
                </div>
            </div>
        </header>

        {/* Dynamic Page Container */}
        <div className="p-6 lg:p-12 max-w-[1800px] mx-auto min-h-[calc(100vh-6rem)]">
          {children}
        </div>

        {/* Footer Info */}
        <footer className="px-12 py-8 bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-100/50">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">DropAI Neural Interface v5.4r2</p>
            <div className="flex items-center gap-6">
                <Link to="/privacy-policy" className="text-[9px] font-black text-slate-300 hover:text-primary-600 uppercase tracking-[0.2em] transition-colors">Privacy Privacy</Link>
                <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">
                    <Shield size={10} /> Secure Protocol Active
                </div>
            </div>
        </footer>
      </main>
    </div>
  );
};

export default Layout;

export default Layout;
