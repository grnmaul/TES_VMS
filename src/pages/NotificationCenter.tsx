import { useState, useEffect, useMemo } from 'react';
import { Bell, AlertTriangle, CheckCircle, Info, Search, Filter, Trash2, CheckSquare } from 'lucide-react';
import { useRealtime } from '@/src/lib/useRealtime';
import { useNotificationContext } from '@/src/context/NotificationContext';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'warning' | 'error' | 'success' | 'info';
  timestamp: string;
  is_read: number;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All Types');
  
  const [offset, setOffset] = useState(0);
  const limit = 20;
  const [hasMore, setHasMore] = useState(true);

  const { refreshUnreadCount, decrementUnreadCount, resetUnreadCount } = useNotificationContext();
  const router = useRouter();

  const loadNotifications = async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      const res = await fetch(`/api/notifications?limit=${limit}&offset=${currentOffset}`, { cache: 'no-store' });
      const data = await res.json();
      
      if (data.length < limit) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (reset) {
        setNotifications(data);
        setOffset(limit);
      } else {
        setNotifications(prev => [...prev, ...data]);
        setOffset(prev => prev + limit);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load notifications', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications(true);
  }, []);

  useRealtime((event) => {
    if (event.type === 'notification:new') {
      const notification = event.payload as Notification;
      setNotifications((prev) => [notification, ...prev]);
    }
  });

  const handleMarkAllAsRead = async () => {
    const res = await fetch('/api/notifications', { method: 'PUT' });
    if (res.ok) {
      setNotifications((prev) => prev.map((notif) => ({ ...notif, is_read: 1 })));
      resetUnreadCount();
      toast.success('Semua notifikasi telah ditandai dibaca.');
    }
  };

  const handleClearAll = async () => {
    const res = await fetch('/api/notifications', { method: 'DELETE' });
    if (res.ok) {
      setNotifications([]);
      resetUnreadCount();
      toast.success('Semua notifikasi berhasil dihapus.');
    }
  };

  const handleDismiss = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const notif = notifications.find(n => n.id === id);
    const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notif && notif.is_read === 0) {
        decrementUnreadCount();
      }
      toast.success('Notifikasi dihapus');
    }
  };

  const handleViewDetails = (notif: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    // Mark as read if unread
    if (notif.is_read === 0) {
      fetch(`/api/notifications/${notif.id}`, { method: 'PUT' }).then(res => {
        if(res.ok) {
          setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: 1 } : n));
          decrementUnreadCount();
        }
      });
    }
    
    // Simple navigation logic based on notification type/message
    toast('Membuka detail...', { icon: '🔍' });
    if (notif.title.toLowerCase().includes('camera')) {
      router.push('/cameras');
    } else {
      router.push('/dashboard');
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notif => {
      const matchesSearch = notif.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            notif.message.toLowerCase().includes(searchQuery.toLowerCase());
      
      const typeMap: Record<string, string[]> = {
        'Warnings': ['warning'],
        'Errors': ['error'],
        'System': ['info', 'success'],
        'All Types': ['warning', 'error', 'info', 'success']
      };
      
      const allowedTypes = typeMap[filterType] || typeMap['All Types'];
      const matchesFilter = allowedTypes.includes(notif.type);
      
      return matchesSearch && matchesFilter;
    });
  }, [notifications, searchQuery, filterType]);

  // Dynamic Summary calculations
  const totalAlerts = notifications.length;
  const unreadAlerts = notifications.filter(n => n.is_read === 0).length;
  const criticalErrors = notifications.filter(n => n.type === 'error').length;
  
  const offlineCamerasCount = notifications.filter(n => n.title.toLowerCase().includes('offline')).length;
  const motionAlertsCount = notifications.filter(n => n.title.toLowerCase().includes('motion')).length;
  const systemAlertsCount = notifications.filter(n => n.type === 'info' || n.type === 'success').length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="p-4 md:p-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Notification Center</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Monitor system alerts and activity logs</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={handleMarkAllAsRead} className="flex-1 md:flex-none px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors">
            <CheckSquare className="w-4 h-4" /> <span className="hidden sm:inline">Mark all as read</span><span className="sm:hidden">Read All</span>
          </button>
          <button onClick={handleClearAll} className="flex-1 md:flex-none px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center gap-2 transition-colors">
            <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Clear all</span><span className="sm:hidden">Clear</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center transition-colors">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input 
                type="text" 
                placeholder="Search notifications..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="flex-1 md:w-40 px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
              >
                <option>All Types</option>
                <option>Warnings</option>
                <option>Errors</option>
                <option>System</option>
              </select>
              <button className="p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {loading && notifications.length === 0 ? (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400">Loading...</div>
            ) : filteredNotifications.length > 0 ? (
              <>
                {filteredNotifications.map((notif) => (
                  <div key={notif.id} className={`p-4 bg-white dark:bg-slate-900 rounded-2xl border ${notif.is_read ? 'border-gray-100 dark:border-slate-800' : 'border-emerald-100 dark:border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-500/5'} shadow-sm flex gap-4 group transition-all hover:shadow-md`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      notif.type === 'warning' ? 'bg-orange-50 dark:bg-orange-500/10' : 
                      notif.type === 'error' ? 'bg-red-50 dark:bg-red-500/10' : 
                      notif.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-blue-50 dark:bg-blue-500/10'
                    }`}>
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{notif.title}</h3>
                        <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase">{new Date(notif.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{notif.message}</p>
                      <div className="mt-3 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => handleViewDetails(notif, e)} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">View Details</button>
                        <button onClick={(e) => handleDismiss(notif.id, e)} className="text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">Dismiss</button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {hasMore && !searchQuery && filterType === 'All Types' && (
                  <button 
                    onClick={() => loadNotifications(false)}
                    className="w-full py-3 mt-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Load More
                  </button>
                )}
              </>
            ) : (
              <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
                <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No notifications found</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">We'll notify you when something happens</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Alerts (Loaded)</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{totalAlerts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Unread Notifications</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{unreadAlerts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Critical Errors</span>
                <span className="text-sm font-bold text-red-600 dark:text-red-400">{criticalErrors}</span>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-50 dark:border-slate-800/50">
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Notification Types</h3>
              <div className="space-y-3">
                {[
                  { label: 'Offline Cameras', count: offlineCamerasCount, color: 'bg-red-500' },
                  { label: 'Motion Alerts', count: motionAlertsCount, color: 'bg-orange-500' },
                  { label: 'System Alerts', count: systemAlertsCount, color: 'bg-blue-500' },
                ].map((type) => (
                  <div key={type.label} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${type.color}`}></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">{type.label}</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{type.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-emerald-600 dark:bg-slate-900 p-6 rounded-3xl border border-transparent dark:border-slate-800 text-white shadow-lg shadow-emerald-100 dark:shadow-none transition-colors">
            <h3 className="text-lg font-bold mb-2">Automated Reports</h3>
            <p className="text-sm text-emerald-50 dark:text-gray-400 mb-6 leading-relaxed">Your daily summary report for {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} is ready to review.</p>
            <button className="w-full py-2.5 bg-white dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/30 border border-transparent dark:border-emerald-500/30 transition-colors">
              View Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
