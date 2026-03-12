'use client';

import { useState, useEffect } from 'react';
import { Camera, MapPin, Search, Grid, List, Play, Info, CloudSun } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';

interface CameraData {
  id: number;
  name: string;
  location: string;
  status: 'online' | 'offline';
}

export default function UserDashboard() {
  const [cameras, setCameras] = useState<CameraData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  return (
    <div className="p-4 md:p-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Public Monitoring Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome to VMS Kota Madiun. Monitor city traffic and public areas.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-3 md:p-4 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm w-full md:w-auto overflow-x-auto">
          <div className="flex items-center gap-3 pr-4 border-r border-gray-100 shrink-0">
            <CloudSun className="w-6 h-6 text-orange-400" />
            <div>
              <p className="text-sm font-bold text-gray-900">32°C</p>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Cerah Berawan</p>
            </div>
          </div>
          <div className="pl-2 shrink-0">
            <p className="text-sm font-bold text-gray-900">Madiun, ID</p>
            <p className="text-[10px] text-gray-500 uppercase font-bold">Selasa, 3 Mar 2026</p>
          </div>
        </div>
      </header>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-500" />
              Available CCTV Streams
            </h2>
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-4"}>
            {cameras.map((camera, i) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                key={camera.id}
                className={`bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm group hover:shadow-md transition-all ${viewMode === 'list' ? 'flex items-center p-4 gap-4' : ''}`}
              >
                <div className={`${viewMode === 'grid' ? 'aspect-video w-full' : 'w-32 h-20'} bg-gray-900 relative flex-shrink-0 rounded-2xl overflow-hidden`}>
                  <img 
                    src={`https://picsum.photos/seed/user-cam-${camera.id}/600/400`} 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    alt={camera.name}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                  <Link 
                    href={`/stream/${camera.id}`}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 fill-current" />
                    </div>
                  </Link>
                </div>

                <div className={viewMode === 'grid' ? "p-6" : "flex-1"}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{camera.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {camera.location}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${camera.status === 'online' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {camera.status}
                    </span>
                  </div>
                  {viewMode === 'grid' && (
                    <Link 
                      href={`/stream/${camera.id}`}
                      className="mt-4 w-full py-2 bg-gray-50 text-gray-600 text-xs font-bold rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all flex items-center justify-center gap-2"
                    >
                      Buka Stream <Play className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* User Sidebar */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-500" />
              City Announcements
            </h3>
            <div className="space-y-6">
              {[
                { title: 'Perbaikan Jalan Pahlawan', date: '3 Mar 2026', desc: 'Akan dilakukan perbaikan jalan mulai pukul 22:00 WIB.' },
                { title: 'Event Madiun Night Run', date: '5 Mar 2026', desc: 'Beberapa ruas jalan akan ditutup sementara.' },
              ].map((news, i) => (
                <div key={i} className="relative pl-6 border-l-2 border-emerald-100">
                  <div className="absolute -left-[5px] top-0 w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">{news.title}</h4>
                  <p className="text-[10px] text-emerald-600 font-bold mb-2 uppercase tracking-wider">{news.date}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{news.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-emerald-600 p-8 rounded-[40px] text-white shadow-xl shadow-emerald-100 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-4">Butuh Bantuan?</h3>
              <p className="text-sm text-emerald-50 mb-8 leading-relaxed">
                Jika Anda melihat kejadian darurat melalui CCTV, segera hubungi layanan darurat Kota Madiun.
              </p>
              <button className="w-full py-4 bg-white text-emerald-600 font-bold rounded-2xl hover:bg-emerald-50 transition-all shadow-lg">
                Hubungi Call Center 112
              </button>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
