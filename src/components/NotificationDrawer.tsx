'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Bell, X, Search, Filter, Trash2, CheckSquare, 
  AlertTriangle, CheckCircle, Info, ExternalLink, 
  Camera, Activity, Settings, ShieldAlert 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotificationContext } from '@/src/context/NotificationContext';
import { useAuth } from '@/src/context/AuthContext';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'warning' | 'error' | 'success' | 'info';
  target_role: string;
  timestamp: string;
  is_read: number;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const { user, token } = useAuth();
  const router = useRouter();
  const { decrementUnreadCount, resetUnreadCount } = useNotificationContext();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'alerts' | 'activity' | 'system'>('all');

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/notifications?limit=50&offset=0', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, token]);

  const handleMarkAsRead = async (id: number) => {
    const res = await fetch(`/api/notifications/${id}`, { 
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      decrementUnreadCount();
    }
  };

  const handleMarkAllAsRead = async () => {
    const res = await fetch('/api/notifications', { 
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      resetUnreadCount();
      toast.success('Semua dibaca');
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await fetch(`/api/notifications/${id}`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const notif = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notif && notif.is_read === 0) decrementUnreadCount();
      toast.success('Dihapus');
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            n.message.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesTab = true;
      if (activeTab === 'alerts') matchesTab = n.type === 'error' || n.type === 'warning';
      if (activeTab === 'activity') matchesTab = n.title.toLowerCase().includes('motion') || n.title.toLowerCase().includes('detected');
      if (activeTab === 'system') matchesTab = n.type === 'info' || n.title.toLowerCase().includes('system');
      
      return matchesSearch && matchesTab;
    });
  }, [notifications, searchQuery, activeTab]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'error': return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const handleAction = (notif: Notification) => {
    if (notif.is_read === 0) handleMarkAsRead(notif.id);
    
    if (notif.title.toLowerCase().includes('offline')) {
      router.push('/cameras');
      onClose();
    } else if (notif.title.toLowerCase().includes('motion')) {
      router.push('/dashboard');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-[70] flex flex-col border-l border-gray-100 dark:border-slate-800"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <Bell className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Pusat Notifikasi</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pembaruan sistem & aktivitas</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button 
                  onClick={handleMarkAllAsRead}
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-[11px] font-bold text-gray-600 dark:text-gray-300 transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckSquare className="w-3.5 h-3.5" /> Tandai Dibaca
                </button>
                <button 
                  className="px-3 py-2 bg-gray-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                  title="Bersihkan Semua"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Search & Tabs */}
            <div className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Cari notifikasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div className="flex gap-1 bg-gray-100/50 dark:bg-slate-800/50 p-1 rounded-xl">
                {(['all', 'alerts', 'activity', 'system'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                      activeTab === tab 
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-gray-400 font-medium">Memuat data...</p>
                </div>
              ) : filteredNotifications.length > 0 ? (
                filteredNotifications.map((notif) => (
                  <motion.div 
                    layout
                    key={notif.id}
                    onClick={() => handleAction(notif)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer group relative ${
                      notif.is_read 
                        ? 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800' 
                        : 'bg-emerald-50/30 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        notif.type === 'error' ? 'bg-red-50 dark:bg-red-500/10' :
                        notif.type === 'warning' ? 'bg-orange-50 dark:bg-orange-500/10' :
                        notif.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-blue-50 dark:bg-blue-500/10'
                      }`}>
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{notif.title}</h4>
                          <span className="text-[9px] text-gray-400 shrink-0 font-medium">{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className={`text-xs leading-relaxed ${notif.is_read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300 font-medium'}`}>
                          {notif.message}
                        </p>
                        
                        {/* Actionable Buttons */}
                        <div className="mt-3 flex items-center gap-2">
                          {notif.title.toLowerCase().includes('offline') && (
                            <button className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-[9px] font-bold text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-1">
                              <Settings className="w-3 h-3" /> Cek Koneksi
                            </button>
                          )}
                          {notif.title.toLowerCase().includes('motion') && (
                            <button className="px-2.5 py-1 bg-emerald-500 text-white rounded-lg text-[9px] font-bold hover:bg-emerald-600 transition-colors flex items-center gap-1">
                              <Camera className="w-3 h-3" /> Live View
                            </button>
                          )}
                          <button 
                            onClick={(e) => handleDelete(notif.id, e)}
                            className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-md opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {!notif.is_read && (
                      <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-12 h-12 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                    <Info className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tidak ada notifikasi</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30">
              <button 
                onClick={() => { router.push('/notifications'); onClose(); }}
                className="w-full py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                Lihat Semua <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
