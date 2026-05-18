'use client';

import { useState, useEffect } from 'react';
import { Camera, Activity, AlertTriangle, CheckCircle2, MoreVertical, Search, Settings, Play, Brain, ChevronLeft, ChevronRight, Bell, MapPin, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRealtime } from '@/src/lib/useRealtime';

import CompactPagination from '@/src/components/CompactPagination';
import { Cpu, HardDrive, Zap, RefreshCw } from 'lucide-react';

interface CameraData {
  id: number;
  name: string;
  location: string;
  ip_address: string;
  status: 'online' | 'offline';
  ai_enabled?: number;
}

interface NotificationData {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_read: number;
  timestamp: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [cameras, setCameras] = useState<CameraData[]>([]);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination for Inventory
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [camRes, notifRes] = await Promise.all([
          fetch('/api/cameras', { cache: 'no-store' }),
          fetch('/api/notifications', { cache: 'no-store' })
        ]);
        setCameras(await camRes.json());
        setNotifications(await notifRes.json());
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useRealtime((event) => {
    if (event.type === 'camera:created') {
      const camera = event.payload as CameraData;
      setCameras((prev) => (prev.some((item) => item.id === camera.id) ? prev : [...prev, camera]));
    }
    if (event.type === 'camera:updated' || event.type === 'camera:health') {
      const camera = event.payload as CameraData;
      setCameras((prev) => prev.map((item) => (item.id === camera.id ? camera : item)));
    }
    if (event.type === 'camera:deleted') {
      const payload = event.payload as { id: number };
      setCameras((prev) => prev.filter((item) => item.id !== payload.id));
    }
    if (event.type === 'notification:new') {
      const notif = event.payload as NotificationData;
      setNotifications((prev) => [notif, ...prev]);
    }
  });

  const unreadAlerts = notifications.filter(n => n.is_read === 0).length;

  const filteredCameras = cameras.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.ip_address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCameras.length / ITEMS_PER_PAGE);
  const paginatedCameras = filteredCameras.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const stats = [
    { label: 'Total Cameras', value: cameras.length, icon: Camera, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: 'Active Now', value: cameras.filter(c => c.status === 'online').length, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { label: 'Offline', value: cameras.filter(c => c.status === 'offline').length, icon: AlertTriangle, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10' },
    { label: 'Active Alerts', value: unreadAlerts, icon: Activity, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
    { label: 'AI YOLO Aktif', value: cameras.filter(c => c.ai_enabled).length, icon: Brain, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10' },
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'error': return <Activity className="w-5 h-5" />;
      case 'success': return <CheckCircle2 className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Admin Monitoring System</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Control center for Kota Madiun surveillance network</p>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
            <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">System Online</span>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors hover:shadow-md"
          >
            <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Feeds Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-3 uppercase tracking-widest">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
              Live Monitoring Feed
            </h2>
            <button 
              onClick={() => router.push('/live-stream')} 
              className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-500 hover:text-white transition-all border border-transparent hover:border-emerald-500"
            >
              View Full Feed
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cameras.slice(0, 4).map((camera) => (
              <div key={camera.id} className="bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm group transition-all hover:shadow-lg">
                <div className="aspect-video bg-slate-900 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="w-12 h-12 text-gray-800" />
                  </div>
                  <div className="absolute top-4 left-4 flex gap-2 z-10">
                    <span className="px-2.5 py-1 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold rounded-full flex items-center gap-1.5 border border-white/10">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                      LIVE
                    </span>
                    <span className="px-2.5 py-1 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold rounded-full border border-white/10">
                      CAM-{camera.id}
                    </span>
                  </div>
                  <Link 
                    href={`/live-stream/${camera.id}`}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 fill-current" />
                    </div>
                  </Link>
                </div>
                <div className="p-5 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white">{camera.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {camera.location}
                    </p>
                  </div>
                  <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Alerts Recommendations (Modern Alert Feed) */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-gray-100 dark:border-slate-800 shadow-sm transition-colors relative overflow-hidden">
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <Bell className="w-4 h-4 text-red-500" />
                Live Alert Feed
              </h2>
              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-full">
                {unreadAlerts} New
              </span>
            </div>
            
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
              <AnimatePresence>
                {notifications.slice(0, 10).map((alert) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={alert.id} 
                    className="group relative flex gap-4 p-4 rounded-3xl bg-gray-50 dark:bg-slate-800/30 border border-gray-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 transition-all hover:shadow-md cursor-pointer"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      alert.type === 'warning' ? 'bg-orange-500 text-white' : 
                      alert.type === 'error' ? 'bg-red-500 text-white' : 
                      alert.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'
                    }`}>
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-black text-gray-900 dark:text-white truncate pr-2">{alert.title}</h4>
                        <span className="text-[9px] text-gray-400 font-bold shrink-0">{new Date(alert.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">{alert.message}</p>
                    </div>
                    {alert.is_read === 0 && <div className="absolute top-3 right-3 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-gray-300">
                    <Bell className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No Alerts</p>
                </div>
              )}
            </div>
            
            <button onClick={() => router.push('/notifications')} className="w-full mt-8 py-4 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-500 hover:text-white transition-all border border-gray-200 dark:border-slate-800">
              View All Alerts
            </button>
          </div>


        </div>
      </div>

      {/* Camera Inventory Table (with Pagination & Scroll) */}
      <div className="mt-12 bg-white dark:bg-slate-900 rounded-[40px] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-lg">
        <div className="p-8 border-b border-gray-50 dark:border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl">
              <Settings className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Camera Inventory</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Manage and monitor all devices from one place</p>
            </div>
          </div>
          
          {/* SEARCH MOVED HERE */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name, location, or IP..." 
              value={searchQuery}
              onChange={(e) => {setSearchQuery(e.target.value); setCurrentPage(1);}}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-gray-900 dark:text-white"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[800px]">
            <table className="w-full text-left">
            <thead className="sticky top-0 bg-gray-50/90 dark:bg-slate-800/90 backdrop-blur-md z-20">
              <tr className="text-[10px] uppercase tracking-widest font-black text-gray-400 dark:text-gray-500">
                <th className="px-8 py-5">Camera Name</th>
                <th className="px-8 py-5">IP Address</th>
                <th className="px-8 py-5">Location</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">AI Detection</th>
                <th className="px-8 py-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
              {paginatedCameras.map((camera) => (
                <tr key={camera.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-6 text-sm font-black text-gray-900 dark:text-white">{camera.name}</td>
                  <td className="px-8 py-6 text-sm text-gray-500 dark:text-gray-400 font-mono">{camera.ip_address}</td>
                  <td className="px-8 py-6 text-sm text-gray-500 dark:text-gray-400 font-medium">{camera.location}</td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${camera.status === 'online' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                      {camera.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest ${
                      camera.ai_enabled 
                        ? 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200/50' 
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500'
                    }`}>
                      <Brain className={`w-3.5 h-3.5 ${camera.ai_enabled ? 'animate-pulse' : ''}`} />
                      {camera.ai_enabled ? 'AI ACTIVE' : 'AI INACTIVE'}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex gap-2">
                      <button onClick={() => router.push(`/live-stream/${camera.id}`)} className="p-2.5 bg-gray-50 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white rounded-xl transition-all" title="View Stream">
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                      <button onClick={() => router.push('/cameras')} className="p-2.5 bg-gray-50 dark:bg-slate-800 hover:bg-blue-500 hover:text-white rounded-xl transition-all" title="Manage Camera">
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {paginatedCameras.length === 0 && (
            <div className="py-20 text-center">
              <Search className="w-12 h-12 text-gray-200 dark:text-slate-800 mx-auto mb-4" />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No cameras found</p>
            </div>
          )}
        </div>

        {/* PAGINATION FOR INVENTORY */}
        <div className="p-8 bg-gray-50/50 dark:bg-slate-800/30 border-t border-gray-50 dark:border-slate-800/50 flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            Showing <span className="text-gray-900 dark:text-white">{paginatedCameras.length}</span> of <span className="text-gray-900 dark:text-white">{filteredCameras.length}</span> Devices
          </p>
          <CompactPagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}
