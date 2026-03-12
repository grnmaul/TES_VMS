'use client';

import { useState, useEffect } from 'react';
import { Camera, Activity, AlertTriangle, CheckCircle2, MoreVertical, Search, Filter, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { io, Socket } from 'socket.io-client';

interface CameraData {
  id: number;
  name: string;
  location: string;
  ip_address: string;
  status: 'online' | 'offline';
}

export default function Dashboard() {
  const [cameras, setCameras] = useState<CameraData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cameras')
      .then(res => res.json())
      .then(data => {
        setCameras(data);
        setLoading(false);
      });

    const socket: Socket = io();

    socket.on('camera:created', (newCamera: CameraData) => {
      setCameras(prev => [...prev, newCamera]);
    });

    socket.on('camera:updated', (updatedCamera: CameraData) => {
      setCameras(prev => prev.map(c => c.id === updatedCamera.id ? updatedCamera : c));
    });

    socket.on('camera:deleted', ({ id }: { id: number }) => {
      setCameras(prev => prev.filter(c => c.id !== id));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const stats = [
    { label: 'Total Cameras', value: cameras.length, icon: Camera, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Now', value: cameras.filter(c => c.status === 'online').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Offline', value: cameras.filter(c => c.status === 'offline').length, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Active Alerts', value: 3, icon: Activity, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="p-4 md:p-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">CCTV Monitoring System</h1>
          <p className="text-sm text-gray-500">Real-time surveillance overview for Kota Madiun</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search cameras..." 
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-full md:w-64"
            />
          </div>
          <button className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <Filter className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4"
          >
            <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Feeds Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              Live Monitoring Feed
            </h2>
            <button className="text-sm text-emerald-600 font-bold hover:underline">View All</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cameras.slice(0, 4).map((camera) => (
              <div key={camera.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm group">
                <div className="aspect-video bg-gray-900 relative">
                  {/* Placeholder for camera feed */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img 
                      src={`https://picsum.photos/seed/cam-${camera.id}/800/450`} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      alt={camera.name}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2 py-1 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold rounded-md flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                      LIVE
                    </span>
                    <span className="px-2 py-1 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold rounded-md">
                      CAM-0{camera.id}
                    </span>
                  </div>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{camera.name}</h3>
                    <p className="text-xs text-gray-500">{camera.location}</p>
                  </div>
                  <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">System Status</h2>
            <div className="space-y-4">
              {[
                { label: 'Main Server', status: 'Stable', color: 'text-emerald-500' },
                { label: 'Storage (82% Full)', status: 'Stable', color: 'text-emerald-500' },
                { label: 'Cloud Backup', status: 'Failed', color: 'text-red-500' },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className={`text-xs font-bold ${item.color}`}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Live Alerts</h2>
            <div className="space-y-4">
              {[
                { title: 'Motion Detected', time: '2 mins ago', loc: 'Jl. Lawu', type: 'warning' },
                { title: 'Signal Weak', time: '15 mins ago', loc: 'Jl. Sleko', type: 'error' },
              ].map((alert, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${alert.type === 'warning' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{alert.title}</h4>
                    <p className="text-xs text-gray-500">{alert.loc} • {alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 text-sm text-emerald-600 font-bold hover:underline">View All Notifications</button>
          </div>
        </div>
      </div>

      {/* Camera Inventory Table */}
      <div className="mt-8 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Manage Camera Inventory</h2>
          <button className="px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-colors">
            + Add New Camera
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] uppercase tracking-widest font-bold text-gray-400">
                <th className="px-6 py-4">Camera Name</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cameras.map((camera) => (
                <tr key={camera.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{camera.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">{camera.ip_address}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{camera.location}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${camera.status === 'online' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {camera.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <Settings className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <AlertTriangle className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
