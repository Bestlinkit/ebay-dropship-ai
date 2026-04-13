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
    const notifications = []; // Live feed integration pending

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
                            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Notifications</h3>
                            {notifications.length > 0 && <button className="text-[9px] font-bold text-primary-500 hover:underline px-2 py-1 rounded-lg">Clear All</button>}
                        </div>
                        <div className="space-y-2 max-h-[350px] overflow-y-auto scrollbar-hide">
                            {notifications.length === 0 ? (
                                <div className="py-12 text-center space-y-3">
                                    <Bell className="mx-auto text-slate-100" size={32} />
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">No New Alerts</p>
                                </div>
                            ) : (
                                notifications.map((n) => (
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
                                ))
                            )}
                        </div>
                        {notifications.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-slate-50 text-center">
                                <button className="text-[9px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto">
                                    View Full Activity Log <ArrowRight size={12} />
                                </button>
                            </div>
                        )}
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

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: Package, label: 'Products', href: '/products' },
    { icon: Zap, label: 'Optimization', href: '/discovery' },
    { icon: ShoppingBag, label: 'Orders', href: '/orders' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-inter selection:bg-primary-100 selection:text-primary-900">
      
      {/* SaaS Sidebar (240px) */}
      <aside 
        className={cn(
          "fixed left-0 top-0 h-screen bg-white transition-all duration-500 z-[80] flex flex-col pt-4 border-r border-slate-100",
          collapsed ? "w-20" : "w-[240px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-20 px-6 flex items-center justify-between shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-950 rounded-xl flex items-center justify-center shadow-lg">
                <Zap size={16} className="text-primary-400 fill-primary-400" />
              </div>
              <span className="font-black text-lg tracking-tighter uppercase italic">DropAI</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-slate-950 rounded-xl flex items-center justify-center shadow-lg mx-auto">
                <Zap size={16} className="text-primary-400 fill-primary-400" />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 space-y-1 py-10">
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

        <div className="p-4 space-y-4 shrink-0">
           {!collapsed && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-black text-[10px]">
                    {user?.email?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase truncate">{user?.email?.split('@')[0]}</p>
                    <p className="text-[8px] text-emerald-500 font-black uppercase">Verified Node</p>
                </div>
              </div>
           )}
           <button 
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-rose-600 transition-all font-black uppercase text-[10px]",
              collapsed ? "justify-center" : ""
            )}
          >
            <LogOut size={16} />
            {!collapsed && <span>System Exit</span>}
          </button>
        </div>
      </aside>

      {/* Main Framework */}
      <main 
        className={cn(
          "flex-1 min-w-0 transition-all duration-500",
          collapsed ? "lg:ml-20" : "lg:ml-[240px]"
        )}
      >
        {/* SaaS Navbar */}
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40 bg-[#f8fafc]/80 backdrop-blur-md border-b border-slate-100">
            <div className="flex items-center gap-6">
               <button onClick={() => setMobileOpen(true)} className="lg:hidden text-slate-900"><Menu size={20} /></button>
               <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2 w-64 md:w-80 group transition-all focus-within:ring-2 focus-within:ring-slate-950/5">
                  <SearchIcon size={14} className="text-slate-400" />
                  <input type="text" placeholder="Global Search (⌘K)" className="bg-transparent border-none text-[11px] font-bold placeholder:text-slate-300 focus:outline-none w-full" />
               </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 text-[9px] font-black uppercase">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    eBay: Connected
                </div>
                <div className="relative">
                    <button onClick={() => setNotifOpen(!notifOpen)} className="text-slate-400 hover:text-slate-900 relative">
                        <Bell size={18} />
                        <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-primary-500 rounded-full border-2 border-[#f8fafc]" />
                    </button>
                    <NotificationDropdown isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center font-black text-[10px] cursor-pointer ring-4 ring-white shadow-sm">
                    {user?.email?.[0]?.toUpperCase()}
                </div>
            </div>
        </header>

        <div className="p-6 lg:p-10 max-w-[1700px] mx-auto min-h-[calc(100vh-5rem)]">
          {children}
        </div>
      </main>
    </div>
  );
};

        {/* Footer Info */}
        <footer className="px-12 py-8 bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-100/50">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">DropAI Business Suite v1.0</p>
            <div className="flex items-center gap-6">
                <Link to="/privacy" className="text-[9px] font-black text-slate-300 hover:text-primary-600 uppercase tracking-[0.2em] transition-colors">Privacy Policy</Link>
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
