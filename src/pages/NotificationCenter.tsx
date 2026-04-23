import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, Info, Search, Filter, Trash2, CheckSquare } from 'lucide-react';
import { useRealtime } from '@/src/lib/useRealtime';

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
  const [statusMessage, setStatusMessage] = useState('');

  const loadNotifications = async () => {
    const res = await fetch('/api/notifications', { cache: 'no-store' });
    const data = await res.json();
    setNotifications(data);
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();
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
      setStatusMessage('Semua notifikasi telah ditandai dibaca.');
    }
  };

  const handleClearAll = async () => {
    const res = await fetch('/api/notifications', { method: 'DELETE' });
    if (res.ok) {
      setNotifications([]);
      setStatusMessage('Semua notifikasi berhasil dihapus.');
    }
  };

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
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Notification Center</h1>
          <p className="text-sm text-gray-500">Monitor system alerts and activity logs</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={handleMarkAllAsRead} className="flex-1 md:flex-none px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2">
            <CheckSquare className="w-4 h-4" /> <span className="hidden sm:inline">Mark all as read</span><span className="sm:hidden">Read All</span>
          </button>
          <button onClick={handleClearAll} className="flex-1 md:flex-none px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 flex items-center justify-center gap-2">
            <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Clear all</span><span className="sm:hidden">Clear</span>
          </button>
        </div>
      </header>
      {statusMessage && <p className="mb-4 text-sm text-gray-600">{statusMessage}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search notifications..." 
                className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <select className="flex-1 md:w-40 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                <option>All Types</option>
                <option>Warnings</option>
                <option>Errors</option>
                <option>System</option>
              </select>
              <button className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
                <Filter className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div key={notif.id} className={`p-4 bg-white rounded-2xl border ${notif.is_read ? 'border-gray-100' : 'border-emerald-100 bg-emerald-50/30'} shadow-sm flex gap-4 group transition-all hover:shadow-md`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    notif.type === 'warning' ? 'bg-orange-50' : 
                    notif.type === 'error' ? 'bg-red-50' : 
                    notif.type === 'success' ? 'bg-emerald-50' : 'bg-blue-50'
                  }`}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-sm font-bold text-gray-900">{notif.title}</h3>
                      <span className="text-[10px] font-medium text-gray-400 uppercase">{new Date(notif.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{notif.message}</p>
                    <div className="mt-3 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-xs font-bold text-emerald-600 hover:underline">View Details</button>
                      <button className="text-xs font-bold text-gray-400 hover:text-gray-600">Dismiss</button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No new notifications</h3>
                <p className="text-gray-500 text-sm">We'll notify you when something happens</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Alerts</span>
                <span className="text-sm font-bold text-gray-900">1,284</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Unread Notifications</span>
                <span className="text-sm font-bold text-emerald-600">24</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Critical Errors</span>
                <span className="text-sm font-bold text-red-600">3</span>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-50">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Notification Types</h3>
              <div className="space-y-3">
                {[
                  { label: 'Offline Cameras', count: 10, color: 'bg-red-500' },
                  { label: 'Motion Alerts Today', count: 156, color: 'bg-orange-500' },
                  { label: 'System Alerts', count: 8, color: 'bg-blue-500' },
                ].map((type) => (
                  <div key={type.label} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${type.color}`}></div>
                    <span className="text-sm text-gray-600 flex-1">{type.label}</span>
                    <span className="text-sm font-bold text-gray-900">{type.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-emerald-600 p-6 rounded-3xl text-white shadow-lg shadow-emerald-100">
            <h3 className="text-lg font-bold mb-2">Automated Reports</h3>
            <p className="text-sm text-emerald-50 mb-6 leading-relaxed">Your daily summary report for Oct 26 is ready to review.</p>
            <button className="w-full py-2.5 bg-white text-emerald-600 text-sm font-bold rounded-xl hover:bg-emerald-50 transition-colors">
              View Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
