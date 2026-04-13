import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Bell, Zap, Package, TrendingUp, Info } from 'lucide-react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('dropai_notifications');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  // Sync Unread Count & LocalStorage
  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
    localStorage.setItem('dropai_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Cross-Tab Synchronization
  useEffect(() => {
    const handleSync = (e) => {
        if (e.key === 'dropai_notifications') {
            setNotifications(JSON.parse(e.newValue));
        }
    };
    window.addEventListener('storage', handleSync);
    return () => window.removeEventListener('storage', handleSync);
  }, []);

  const addNotification = useCallback((notif) => {
    // Structural Enforcement: Severity determines Routing
    // LOW -> Feed only
    // MEDIUM -> Bell + Feed
    // HIGH -> Toast + Bell + Feed
    
    const newNotif = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      read: false,
      severity: notif.severity || 'LOW',
      title: notif.title,
      desc: notif.desc,
      snippet: notif.snippet, // TL;DR for Bell
      icon: notif.icon || 'Info',
      link: notif.link,
      productState: notif.productState || null,
      ...notif
    };

    setNotifications(prev => [newNotif, ...prev].slice(0, 50)); // Cap history at 50

    if (newNotif.severity === 'HIGH') {
        const ActionIcon = { Zap, Package, TrendingUp, Info }[newNotif.icon] || Zap;
        
        toast.custom((t) => (
          <div className="bg-slate-950 text-white p-5 rounded-[1.5rem] shadow-2xl border border-white/10 flex items-start gap-4 animate-in slide-in-from-right duration-300 min-w-[320px]">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shrink-0">
               <ActionIcon size={20} className="text-slate-950" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest">Winning Match Detected</p>
              <p className="text-sm font-bold leading-tight">{newNotif.title}</p>
              <div className="pt-3">
                 <button 
                  onClick={() => {
                    toast.dismiss(t);
                    markRead(newNotif.id);
                    navigate("/optimize/" + (newNotif.productState?.id || "new"), { state: { ebayProduct: newNotif.productState } });
                  }}
                  className="bg-white text-slate-950 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-primary-500 transition-all"
                 >
                    View Product Studio
                 </button>
              </div>
            </div>
            <button onClick={() => toast.dismiss(t)} className="text-white/20 hover:text-white transition-all"><Zap size={14}/></button>
          </div>
        ), { duration: 5000 });
    }
  }, [navigate]);

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
