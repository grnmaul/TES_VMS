'use client';

import { useState, useEffect } from 'react';
import { Camera, MapPin, Search, Grid, List, Play, Info, CloudSun, Brain, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useRealtime } from '@/src/lib/useRealtime';
import CompactPagination from '@/src/components/CompactPagination';

interface CameraData {
  id: number;
  name: string;
  location: string;
  status: 'online' | 'offline';
  ai_enabled?: number;
}

export default function UserDashboard() {
  const [cameras, setCameras] = useState<CameraData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentDate, setCurrentDate] = useState('');
  const [weather, setWeather] = useState({ temp: 32, desc: 'Cerah Berawan' });
  const [news, setNews] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    // Set dynamic date
    const date = new Intl.DateTimeFormat('id-ID', { 
      weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' 
    }).format(new Date());
    setCurrentDate(date);

    // Fetch real weather for Madiun
    fetch('https://api.open-meteo.com/v1/forecast?latitude=-7.6298&longitude=111.5239&current=temperature_2m,weather_code')
      .then(res => res.json())
      .then(data => {
        if (data && data.current) {
          const temp = Math.round(data.current.temperature_2m);
          const code = data.current.weather_code;
          let desc = 'Cerah Berawan';
          if (code === 0) desc = 'Cerah';
          else if (code >= 1 && code <= 3) desc = 'Berawan';
          else if (code >= 51 && code <= 67) desc = 'Hujan Ringan';
          else if (code >= 80 && code <= 99) desc = 'Hujan Deras';
          
          setWeather({ temp, desc });
        }
      })
      .catch(err => console.error('Error fetching weather:', err));

    // Fetch Madiun Traffic News - Improved query
    const targetUrl = 'https://news.google.com/rss/search?q=lalu+lintas+Madiun+terkini&hl=id&gl=ID&ceid=ID:id';
    fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(targetUrl)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.items) {
          setNews(data.items.slice(0, 3));
        }
      })
      .catch(err => console.error('Error fetching news:', err));

    fetch('/api/cameras')
      .then(res => res.json())
      .then(data => {
        setCameras(data);
        setLoading(false);
      });
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
  });

  // Filter Logic
  const filteredCameras = cameras.filter(camera => 
    camera.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    camera.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCameras.length / ITEMS_PER_PAGE);
  const paginatedCameras = filteredCameras.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset to first page when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Adjust page if cameras count changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredCameras.length, totalPages, currentPage]);

  const handleCallEmergency = () => {
    window.open('tel:112', '_self');
  };

  return (
    <div className="p-4 md:p-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Public Monitoring Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Welcome to VMS Kota Madiun. Monitor city traffic and public areas.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-3 md:p-4 rounded-2xl md:rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm w-full md:w-auto overflow-x-auto transition-colors">
          <div className="flex items-center gap-3 pr-4 border-r border-gray-100 dark:border-slate-800 shrink-0">
            <CloudSun className="w-6 h-6 text-orange-400" />
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{weather.temp}°C</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">{weather.desc}</p>
            </div>
          </div>
          <div className="pl-2 shrink-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white">Madiun, ID</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">{currentDate || 'Memuat...'}</p>
          </div>
        </div>
      </header>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              {searchQuery ? `Hasil Pencarian untuk "${searchQuery}"` : 'Available CCTV Streams'}
              <span className="text-[10px] bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-full text-gray-500 font-black ml-2">
                {filteredCameras.length}
              </span>
            </h2>
            <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl transition-colors">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className={`overflow-y-auto pr-2 custom-scrollbar ${viewMode === 'grid' ? "max-h-[700px]" : "max-h-[600px]"}`}>
            {filteredCameras.length === 0 ? (
              <div className="py-20 text-center">
                <Search className="w-12 h-12 text-gray-200 dark:text-slate-800 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-bold">Tidak ada CCTV ditemukan di lokasi tersebut.</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-6 pb-4" : "space-y-4 pb-4"}>
                {paginatedCameras.map((camera, i) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    key={camera.id}
                    className={`bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm group hover:shadow-md transition-all ${viewMode === 'list' ? 'flex items-center p-4 gap-4' : ''}`}
                  >
                    <div className={`${viewMode === 'grid' ? 'aspect-video w-full' : 'w-32 h-20'} bg-gray-900 relative flex-shrink-0 rounded-2xl overflow-hidden`}>
                      <div className="absolute inset-0 bg-slate-900 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                        <Camera className="w-10 h-10 text-emerald-500/30 opacity-80 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-purple-600/90 backdrop-blur-sm rounded-full">
                        <Brain className="w-2.5 h-2.5 text-white" />
                        <span className="text-[9px] font-bold text-white">AI</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      </div>
                      <Link 
                        href={`/live-stream/${camera.id}`}
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
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{camera.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {camera.location}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${camera.status === 'online' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                          {camera.status}
                        </span>
                      </div>
                      {viewMode === 'grid' && (
                        <Link 
                          href={`/live-stream/${camera.id}`}
                          className="mt-4 w-full py-2 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all flex items-center justify-center gap-2"
                        >
                          Buka Stream <Play className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          <div className="mt-8 flex items-center justify-center bg-white dark:bg-slate-900 p-4 rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
            <CompactPagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>

        {/* User Sidebar */}
        <div className="space-y-8">
          
          {/* Search Bar - Positioned at Top Right Column */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
             <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Cari lokasi CCTV..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 rounded-2xl text-sm outline-none transition-all text-gray-900 dark:text-white"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {news.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                Info Lalu Lintas Madiun
              </h3>
              <div className="space-y-6">
                {news.map((item, i) => {
                  const dateStr = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(item.pubDate));
                  return (
                    <a key={i} href={item.link} target="_blank" rel="noreferrer" className="block relative pl-6 border-l-2 border-emerald-100 dark:border-slate-700 hover:border-emerald-500 transition-colors">
                      <div className="absolute -left-[5px] top-0 w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">{item.title}</h4>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mb-2 uppercase tracking-wider">{dateStr} • {item.source || 'Berita'}</p>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-emerald-600 dark:bg-slate-900 p-8 rounded-[40px] border border-transparent dark:border-slate-800 text-white shadow-xl shadow-emerald-100 dark:shadow-none relative overflow-hidden transition-colors">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-4">Butuh Bantuan?</h3>
              <p className="text-sm text-emerald-50 dark:text-gray-400 mb-8 leading-relaxed">
                Jika Anda melihat kejadian darurat melalui CCTV, segera hubungi layanan darurat Kota Madiun.
              </p>
              <button 
                onClick={handleCallEmergency}
                className="w-full py-4 bg-white dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-500/30 transition-all shadow-lg dark:shadow-none border border-transparent dark:border-emerald-500/30"
              >
                Hubungi Call Center 112
              </button>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 dark:bg-emerald-500/10 rounded-full blur-2xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
