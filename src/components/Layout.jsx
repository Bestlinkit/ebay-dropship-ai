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
import { useNotifications } from '../context/NotificationContext';

const SidebarItem = ({ icon: Icon, label, href, active, collapsed, onClick }) => (
  <Link
    to={href}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative",
      active 
        ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-xl shadow-black/20" 
        : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
    )}
  >
    <Icon size={18} className={cn("transition-colors duration-300", active ? "text-[var(--primary-500)]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]")} />
    {!collapsed && <span className="font-bold text-[10px] uppercase tracking-widest leading-none">{label}</span>}
    {active && (
        <motion.div 
            layoutId="active-pill"
            className="absolute -left-1 top-1/2 -translate-y-1/2 h-6 w-1 bg-[var(--primary-500)] rounded-r-full" 
        />
    )}
  </Link>
);


const NotificationDropdown = ({ isOpen, onClose }) => {
    const { notifications, markRead, clearAll } = useNotifications();
    const navigate = useNavigate();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={onClose} />
                    <motion.div 
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-[90vw] max-w-sm bg-[var(--bg-card)] rounded-[2.5rem] p-6 z-50 shadow-3xl overflow-hidden border border-[var(--border-color)]"
                    >
                        <div className="flex items-center justify-between mb-8 px-2">
                            <h3 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">SaaS Market Hub</h3>
                            {notifications.length > 0 && <button onClick={clearAll} className="text-[9px] font-bold text-[var(--danger)] hover:underline px-2 py-1">Clear All</button>}
                        </div>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto scrollbar-hide">
                            {notifications.length === 0 ? (
                                <div className="py-20 text-center space-y-4">
                                    <Bell className="mx-auto text-[var(--border-color)]" size={48} />
                                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest leading-relaxed">No new alerts monitored</p>
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div 
                                        key={n.id} 
                                        onClick={() => {
                                            markRead(n.id);
                                            if (n.productState) {
                                                navigate("/optimize/" + (n.productState.id || "new"), { state: { ebayProduct: n.productState } });
                                                onClose();
                                            }
                                        }}
                                        className={cn(
                                            "p-5 transition-all rounded-[2rem] group cursor-pointer flex gap-4 border",
                                            n.read ? "bg-[var(--bg-app)] border-transparent opacity-60" : "bg-[var(--bg-elevated)] border-[var(--border-color)] shadow-sm"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all",
                                            n.read ? "bg-[var(--bg-app)] text-[var(--text-secondary)]" : "bg-black text-[var(--primary-500)] shadow-lg"
                                        )}>
                                            <Zap size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <p className="text-xs font-black text-[var(--text-primary)] leading-tight truncate">{n.title}</p>
                                                {!n.read && <div className="w-2 h-2 bg-[var(--primary-500)] rounded-full shrink-0 animate-pulse" />}
                                            </div>
                                            <p className="text-[10px] text-[var(--text-secondary)] font-bold leading-tight mb-3">{n.snippet}</p>
                                            <div className="flex items-center gap-2 text-[9px] text-[var(--text-secondary)] font-black uppercase">
                                                <Clock size={10} /> {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
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
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: Package, label: 'Products', href: '/products' },
    { icon: Zap, label: 'Market Research', href: '/discovery' },
    { icon: Video, label: 'Video Lab', href: '/video' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics' },
    { icon: Megaphone, label: 'Marketing', href: '/marketing' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  return (
    <div className="flex min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] font-inter overflow-x-hidden">
      
      {/* SaaS Sidebar (Rule 1 & 3 Compliance) */}
      <aside 
        className={cn(
          "fixed left-0 top-0 h-screen bg-[var(--bg-card)] transition-all duration-500 z-[80] flex flex-col pt-4 border-r border-[var(--border-color)] max-w-full",
          collapsed ? "w-20" : "w-[240px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-20 px-8 flex items-center justify-between shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center shadow-2xl border border-white/5">
                <Zap size={20} className="text-[var(--primary-500)] fill-[var(--primary-500)]" />
              </div>
              <span className="font-black text-xl tracking-tighter uppercase italic text-[var(--text-primary)]">DropAI</span>
            </div>
          )}
          {collapsed && (
            <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center shadow-2xl mx-auto border border-white/5">
                <Zap size={20} className="text-[var(--primary-500)] fill-[var(--primary-500)]" />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 space-y-1 py-12">
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

        <div className="p-6 space-y-6 shrink-0 border-t border-[var(--border-color)]">
           {!collapsed && (
              <div className="p-5 rounded-[2rem] bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-black border border-white/10 flex items-center justify-center font-black text-xs text-white">
                    {user?.email?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase truncate text-[var(--text-primary)]">{user?.email?.split('@')[0]}</p>
                    <p className="text-[9px] text-[var(--success)] font-black uppercase tracking-widest">Enterprise Link</p>
                </div>
              </div>
           )}
           <button 
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-4 w-full px-5 py-4 text-[var(--text-secondary)] hover:text-[var(--danger)] transition-all font-black uppercase text-[10px] tracking-widest",
              collapsed ? "justify-center" : ""
            )}
          >
            <LogOut size={18} />
            {!collapsed && <span>System Exit</span>}
          </button>
        </div>
      </aside>

      {/* Main Framework (Rule 2 Compliance) */}
      <main 
        className={cn(
          "flex-1 min-w-0 transition-all duration-500 flex flex-col max-w-full",
          collapsed ? "lg:ml-20" : "lg:ml-[240px]"
        )}
      >
        {/* SaaS Navbar (Rule 4 & 6 Compliance) */}
        <header className="h-20 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-40 bg-[var(--bg-app)]/80 backdrop-blur-xl border-b border-[var(--border-color)]">
            <div className="flex items-center gap-8">
               <button onClick={() => setMobileOpen(true)} className="lg:hidden text-[var(--text-primary)]"><Menu size={24} /></button>
               <div className="hidden md:flex items-center gap-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl px-5 py-3 w-80 group transition-all focus-within:ring-4 focus-within:ring-[var(--primary-500)]/10">
                  <SearchIcon size={16} className="text-[var(--text-secondary)]" />
                  <input type="text" placeholder="Intelligence Registry (⌘K)" className="bg-transparent border-none text-[12px] font-bold text-[var(--text-primary)] placeholder:text-slate-600 focus:outline-none w-full" />
               </div>
            </div>

            <div className="flex items-center gap-8">
                <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-[var(--success)]/10 text-[var(--success)] rounded-2xl border border-[var(--success)]/20 text-[10px] font-black uppercase tracking-widest">
                    <div className="w-2 h-2 bg-[var(--success)] rounded-full animate-pulse" />
                    Market Bridge: Active
                </div>
                 <div className="relative">
                    <button onClick={() => setNotifOpen(!notifOpen)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] relative p-2">
                        <Bell size={22} />
                        {unreadCount > 0 && (
                            <div className="absolute top-1 right-1 w-5 h-5 bg-[var(--primary-500)] rounded-full border-2 border-[var(--bg-app)] flex items-center justify-center text-[9px] font-black text-white animate-in zoom-in">
                                {unreadCount}
                            </div>
                        )}
                    </button>
                    <NotificationDropdown isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
                </div>
                <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center font-black text-xs cursor-pointer ring-2 ring-[var(--border-color)] shadow-2xl">
                    {user?.email?.[0]?.toUpperCase()}
                </div>
            </div>
        </header>

        {/* Universal Container (Rule 1 Compliance) */}
        <div className="flex-1 p-6 lg:p-12 w-full max-w-[var(--max-content-width)] mx-auto overflow-x-hidden">
          {children}
        </div>

        {/* Footer Info (Centralized Branding) */}
        <footer className="px-12 py-10 bg-[var(--bg-card)] flex flex-col md:flex-row items-center justify-between gap-6 border-t border-[var(--border-color)]">
            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.4em]">DropAI Intelligence Suite v12.0</p>
            <div className="flex items-center gap-10">
                <Link to="/privacy" className="text-[10px] font-black text-[var(--text-secondary)] hover:text-[var(--primary-500)] uppercase tracking-[0.2em] transition-colors">Privacy Protocol</Link>
                <div className="flex items-center gap-2.5 text-[10px] font-black text-[var(--success)] uppercase tracking-[0.3em]">
                    <Shield size={14} /> Neural Integrity Verified
                </div>
            </div>
        </footer>
      </main>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] lg:hidden"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
