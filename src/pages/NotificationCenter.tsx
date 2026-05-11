import { useState, useEffect, useMemo } from 'react';
import { Bell, AlertTriangle, CheckCircle, Info, Search, Filter, Trash2, CheckSquare, Activity, ArrowRight } from 'lucide-react';
import { useRealtime } from '@/src/lib/useRealtime';
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

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All Types');
  
  const [offset, setOffset] = useState(0);
  const limit = 20;
  const [hasMore, setHasMore] = useState(true);

  const { unreadCount, decrementUnreadCount, resetUnreadCount, setUnreadCount } = useNotificationContext();
  const { user, token } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'all' | 'alerts' | 'activity' | 'system'>('all');

  const loadNotifications = async (reset = false) => {
    if (!token) return;
    try {
      const currentOffset = reset ? 0 : offset;
      const res = await fetch(`/api/notifications?limit=${limit}&offset=${currentOffset}`, { 
        cache: 'no-store',
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
    if (token) {
      loadNotifications(true);
    }
  }, [token]);

  useRealtime((event) => {
    if (event.type === 'notification:new') {
      const notification = event.payload as Notification;
      // Filter by role if applicable
      if (notification.target_role === 'all' || notification.target_role === user?.role) {
        setNotifications((prev) => [notification, ...prev]);
      }
    }
  });

  const handleMarkAllAsRead = async () => {
    const res = await fetch('/api/notifications', { 
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      setNotifications((prev) => prev.map((notif) => ({ ...notif, is_read: 1 })));
      resetUnreadCount();
      toast.success('Semua dibaca');
    }
  };

  const handleClearAll = async () => {
    const res = await fetch('/api/notifications', { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      setNotifications([]);
      resetUnreadCount();
      toast.success('Dihapus semua');
    }
  };

  const handleDismiss = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await fetch(`/api/notifications/${id}`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const notif = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notif && notif.is_read === 0) decrementUnreadCount();
      toast.success('Notifikasi dihapus');
    }
  };

  const handleAction = (notif: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (notif.is_read === 0) {
      fetch(`/api/notifications/${notif.id}`, { 
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => {
        if(res.ok) {
          setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: 1 } : n));
          decrementUnreadCount();
        }
      });
    }
    
    if (notif.title.toLowerCase().includes('camera') || notif.title.toLowerCase().includes('offline')) {
      router.push('/cameras');
    } else {
      router.push('/dashboard');
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notif => {
      const matchesSearch = notif.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            notif.message.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesTab = true;
      if (activeTab === 'alerts') matchesTab = notif.type === 'error' || notif.type === 'warning';
      if (activeTab === 'activity') matchesTab = notif.title.toLowerCase().includes('motion') || notif.title.toLowerCase().includes('detected');
      if (activeTab === 'system') matchesTab = notif.type === 'info' || notif.title.toLowerCase().includes('system');
      
      return matchesSearch && matchesTab;
    });
  }, [notifications, searchQuery, activeTab]);

  const isAdmin = user?.role === 'admin';

  return (
    <div className="p-4 md:p-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Notification Center</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isAdmin ? 'Monitoring integritas sistem & log aktivitas' : 'Monitor aktivitas pemantauan area Anda'}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={handleMarkAllAsRead} className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 flex items-center gap-2 transition-all shadow-sm">
            <CheckSquare className="w-4 h-4" /> Tandai Semua Dibaca
          </button>
          <button onClick={handleClearAll} className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-2 transition-all shadow-sm">
            <Trash2 className="w-4 h-4" /> Bersihkan
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 bg-gray-100/50 dark:bg-slate-800/50 p-1 rounded-2xl w-full max-w-2xl">
        {(['all', 'alerts', 'activity', 'system'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
              activeTab === tab 
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-lg' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari notifikasi..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          {isAdmin ? (
            /* Admin Table View (High Density) */
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Judul</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pesan</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {filteredNotifications.map(notif => (
                    <tr 
                      key={notif.id} 
                      onClick={(e) => handleAction(notif, e)}
                      className={`group hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${!notif.is_read ? 'bg-emerald-50/20 dark:bg-emerald-500/5' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className={`w-2 h-2 rounded-full ${
                          notif.type === 'error' ? 'bg-red-500' :
                          notif.type === 'warning' ? 'bg-orange-500' :
                          notif.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}></div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-bold ${!notif.is_read ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                          {notif.title}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">{notif.message}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(notif.timestamp).toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredNotifications.length === 0 && (
                <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Kosong</div>
              )}
            </div>
          ) : (
            /* User Card View (Visual Focus) */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNotifications.map(notif => (
                <div 
                  key={notif.id}
                  onClick={(e) => handleAction(notif, e)}
                  className={`p-6 rounded-3xl border transition-all cursor-pointer group ${
                    notif.is_read 
                      ? 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800' 
                      : 'bg-white dark:bg-slate-900 border-emerald-500 shadow-xl shadow-emerald-500/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${
                      notif.type === 'error' ? 'bg-red-50 dark:bg-red-500/10 text-red-500' :
                      notif.type === 'warning' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-500' :
                      'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500'
                    }`}>
                      {notif.title.toLowerCase().includes('motion') ? <Activity className="w-6 h-6" /> : <Info className="w-6 h-6" />}
                    </div>
                    {!notif.is_read && <span className="px-2 py-1 bg-emerald-500 text-[8px] font-black text-white uppercase rounded-full">Baru</span>}
                  </div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 leading-tight">{notif.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">{notif.message}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(notif.timestamp).toLocaleDateString()}</span>
                    <button className="flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 hover:gap-2 transition-all">
                      Lihat Detail <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              {filteredNotifications.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-[40px] border border-dashed border-gray-200">
                   <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xs">Semua Terpantau Aman</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Analisis Notifikasi</h2>
            <div className="space-y-6">
              {[
                { label: 'Unread', val: notifications.filter(n => !n.is_read).length, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { label: 'Alerts', val: notifications.filter(n => n.type === 'error' || n.type === 'warning').length, color: 'text-red-500', bg: 'bg-red-500/10' },
                { label: 'Activity', val: notifications.filter(n => n.title.toLowerCase().includes('motion')).length, color: 'text-blue-500', bg: 'bg-blue-500/10' }
              ].map(stat => (
                <div key={stat.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-1 h-8 rounded-full ${stat.color.replace('text', 'bg')}`}></div>
                    <span className="text-sm font-bold text-gray-500">{stat.label}</span>
                  </div>
                  <span className={`text-xl font-black ${stat.color}`}>{stat.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
