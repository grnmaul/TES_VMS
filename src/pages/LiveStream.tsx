'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Camera as CameraIcon, MapPin, Menu, X, Brain, Activity, TrendingUp, BarChart3, Car, Bike, Truck, Bus as BusIcon, Flag } from 'lucide-react';
import { useRealtime } from '@/src/lib/useRealtime';
import YoloDetector, { VehicleStats } from '@/src/components/YoloDetector';
import ReportModal from '@/src/components/ReportModal';
import { useAuth } from '@/src/context/AuthContext';

interface CameraData {
  id: number; name: string; location: string; status: string; stream_url?: string;
}

const VEHICLE_CLASSES = [
  { key: 'motorcycle', label: 'Motor', color: '#10b981', gol: 'Gol-1', icon: Bike },
  { key: 'car',        label: 'Mobil', color: '#3b82f6', gol: 'Gol-2', icon: Car },
  { key: 'bus',        label: 'Bus',     color: '#8b5cf6', gol: 'Gol-4', icon: BusIcon },
  { key: 'truck',      label: 'Truk',   color: '#ef4444', gol: 'Gol-5', icon: Truck },
] as const;

function CircularGauge({ value, max = 100, color, label, sublabel }: {
  value: number; max?: number; color: string; label: string; sublabel: string;
}) {
  const r = 24; const circ = 2 * Math.PI * r;
  const dash = Math.min(value / Math.max(max, 1), 1) * circ;
  return (
    <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-[24px] border border-gray-100 dark:border-slate-800 shadow-sm transition-all hover:border-emerald-500/20">
      <div className="relative w-12 h-12 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="5"
            className="text-gray-100 dark:text-slate-800" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 0.5s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-black text-gray-900 dark:text-white">{value}</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-tight truncate leading-none mb-1">{label}</p>
        <p className="text-[9px] text-gray-400 dark:text-gray-500 font-mono font-bold uppercase tracking-wider">{sublabel}</p>
      </div>
    </div>
  );
}

export default function LiveStream() {
  const params = useParams();
  const id = params?.id;
  const { token } = useAuth();
  const [cameras, setCameras] = useState<CameraData[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<CameraData | null>(null);
  const [isListOpen, setIsListOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiEnabled, setIsAiEnabled] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentStats, setCurrentStats] = useState<VehicleStats>({ motorcycle:0,car:0,bus:0,truck:0,total:0 });
  const [sessionCounts, setSessionCounts] = useState<VehicleStats>({ motorcycle:0,car:0,bus:0,truck:0,total:0 });
  const sessionRef = useRef<VehicleStats>({ motorcycle:0,car:0,bus:0,truck:0,total:0 });

  const handleDetection = useCallback((stats: VehicleStats) => {
    setCurrentStats(stats);
    setSessionCounts(prev => {
      const next: VehicleStats = {
        motorcycle: Math.max(prev.motorcycle, stats.motorcycle),
        car: Math.max(prev.car, stats.car),
        bus: Math.max(prev.bus, stats.bus),
        truck: Math.max(prev.truck, stats.truck),
        total: Math.max(prev.total, stats.total),
      };
      sessionRef.current = next;
      return next;
    });
  }, []);

  const reloadStream = () => {
    const curr = selectedCamera;
    setSelectedCamera(null);
    setTimeout(() => setSelectedCamera(curr), 100);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/cameras');
        const data = await res.json();
        setCameras(data);
        const sid = Array.isArray(id) ? id[0] : id;
        setSelectedCamera(data.find((c: CameraData) => c.id === parseInt(sid || '0')) || data[0] || null);
      } catch {} finally { setIsLoading(false); }
    })();
  }, [id]);

  useRealtime((event) => {
    if (event.type === 'camera:created') { const c = event.payload as CameraData; setCameras(p => p.some(x=>x.id===c.id)?p:[...p,c]); }
    if (event.type === 'camera:updated' || event.type === 'camera:health') { const c = event.payload as CameraData; setCameras(p=>p.map(x=>x.id===c.id?c:x)); setSelectedCamera(p=>p?.id===c.id?c:p); }
    if (event.type === 'camera:deleted') { const p = event.payload as {id:number}; setCameras(prev=>prev.filter(x=>x.id!==p.id)); setSelectedCamera(prev=>prev?.id===p.id?null:prev); }
  });

  useEffect(() => {
    const zero: VehicleStats = { motorcycle:0,car:0,bus:0,truck:0,total:0 };
    setCurrentStats(zero); setSessionCounts(zero); sessionRef.current = zero;
  }, [selectedCamera?.id]);

  const filteredCameras = cameras.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalVehicles = sessionCounts.motorcycle + sessionCounts.car + sessionCounts.bus + sessionCounts.truck;
  const maxCount = Math.max(totalVehicles, 1);

  const densityConfig = currentStats.total >= 10
    ? { label:'Sangat Padat', cls:'bg-red-500 text-white', icon: Activity }
    : currentStats.total >= 6
    ? { label:'Padat', cls:'bg-orange-500 text-white', icon: Activity }
    : currentStats.total >= 3
    ? { label:'Normal', cls:'bg-yellow-500 text-white', icon: Activity }
    : { label:'Lengang', cls:'bg-emerald-500 text-white', icon: Activity };

  return (
    <div className="h-screen bg-[#F8F9FA] dark:bg-slate-950 flex flex-col lg:flex-row overflow-hidden transition-colors">

      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-4 flex justify-between items-center sticky top-0 z-30 transition-colors">
        <Link href="/dashboard" className="text-gray-500 dark:text-gray-400"><ArrowLeft className="w-5 h-5" /></Link>
        <h2 className="text-sm font-bold truncate px-4 text-gray-900 dark:text-white">{selectedCamera?.name || 'Live Stream'}</h2>
        <button onClick={() => setIsListOpen(!isListOpen)} className="p-2 bg-gray-50 dark:bg-slate-800 rounded-lg text-gray-600 dark:text-gray-400">
          {isListOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Camera List Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-80 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 ${isListOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-100 dark:border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /><span className="text-sm font-bold">Kembali</span>
          </Link>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Daftar CCTV</h2>
            <button onClick={() => setIsListOpen(false)} className="lg:hidden p-2 text-gray-400"><X className="w-4 h-4" /></button>
          </div>
          <div className="relative">
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Cari lokasi..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-emerald-500 transition-colors" />
            <CameraIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {filteredCameras.map(camera => (
            <button key={camera.id} onClick={() => { setSelectedCamera(camera); setIsListOpen(false); }}
              className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all group ${selectedCamera?.id===camera.id ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${selectedCamera?.id===camera.id?'bg-white/20':'bg-gray-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700'}`}>
                <CameraIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-black truncate">{camera.name}</p>
                <p className={`text-[10px] truncate font-medium ${selectedCamera?.id===camera.id?'text-emerald-50':'text-gray-400'}`}>{camera.location}</p>
              </div>
              {camera.status==='online' && <div className={`w-2 h-2 rounded-full shrink-0 ${selectedCamera?.id===camera.id?'bg-white':'bg-emerald-500 animate-pulse'}`} />}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#F8F9FA] dark:bg-slate-950 custom-scrollbar">
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
          
          {/* Top Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-emerald-500 rounded-xl">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg md:text-xl font-black text-gray-900 dark:text-white tracking-tight">
                  Lalu Lintas Otomatis Terklasifikasi
                </h1>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <MapPin className="w-3 h-3 text-emerald-500" />
                {selectedCamera?.location || 'Lokasi tidak diketahui'}
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-700" />
                <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase text-[9px] tracking-widest">AI Monitoring Aktif</span>
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors text-right hidden md:block">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Terakhir diperbarui</p>
              <p className="text-xs font-black text-gray-900 dark:text-white">{new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})} WIB</p>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Video */}
            <div className="lg:col-span-8 xl:col-span-9">
              <div className="bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm transition-colors group">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                    <div>
                      <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{selectedCamera?.name || 'Menunggu...'}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">{new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${!isAiEnabled ? 'text-red-500' : 'text-gray-400'}`}>Off</span>
                      <button 
                        onClick={() => setIsAiEnabled(!isAiEnabled)}
                        className={`relative w-10 h-5 rounded-full transition-all duration-300 ${isAiEnabled ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-gray-200 dark:bg-slate-700'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${isAiEnabled ? 'left-5.5' : 'left-0.5'}`} />
                      </button>
                      <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${isAiEnabled ? 'text-emerald-500' : 'text-gray-400'}`}>On</span>
                    </div>

                    <button onClick={reloadStream} className="p-2.5 bg-gray-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all" title="Muat ulang stream">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setIsReportOpen(true)}
                      disabled={!selectedCamera}
                      className="flex items-center gap-1.5 px-3 py-2.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-500 rounded-xl text-red-500 dark:text-red-400 hover:text-white transition-all group disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Laporkan masalah pada kamera ini"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-wider hidden sm:block">Laporan</span>
                    </button>
                  </div>
                </div>
                <div className="aspect-video bg-slate-900 relative">
                  {selectedCamera && (
                    <YoloDetector
                      key={selectedCamera.id}
                      cameraId={selectedCamera.id}
                      aiEnabled={isAiEnabled}
                      onDetection={handleDetection}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Report Modal */}
            {selectedCamera && (
              <ReportModal
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                cameraId={selectedCamera.id}
                cameraName={selectedCamera.name}
                token={token}
              />
            )}

            {/* Right Column: Density & Classification */}
            <div className="lg:col-span-4 xl:col-span-3 space-y-4">
              <div className={`p-6 rounded-[28px] shadow-lg flex items-center gap-4 transition-all duration-500 ${densityConfig.cls}`}>
                <div className="p-3 bg-white/20 rounded-xl">
                  <densityConfig.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-80">Kepadatan Lalin</p>
                  <p className="text-base font-black leading-none mt-1">{densityConfig.label}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-gray-100 dark:border-slate-800 shadow-sm p-6 transition-colors">
                 <div className="flex items-center justify-between mb-6">
                   <h3 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tight">Klasifikasi Gol</h3>
                   <TrendingUp className="w-4 h-4 text-emerald-500" />
                 </div>
                 <div className="grid grid-cols-1 gap-3">
                   {VEHICLE_CLASSES.map(v => (
                     <CircularGauge key={v.key}
                       value={sessionCounts[v.key as keyof VehicleStats] as number}
                       max={Math.max(maxCount,20)} color={v.color} label={v.label} sublabel={v.gol} />
                   ))}
                 </div>
              </div>
            </div>
          </div>

          {/* TOTAL VOLUME - COMPACT VERSION */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-sm p-6 transition-colors">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" stroke="currentColor" className="text-gray-50 dark:text-slate-800"/>
                  <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" stroke="#10b981" strokeLinecap="round"
                    strokeDasharray={`${Math.min(totalVehicles/200,1)*264} 264`} style={{transition:'stroke-dasharray 0.8s ease'}}/>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-gray-900 dark:text-white leading-none">{totalVehicles}</span>
                  <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-1">Total</p>
                </div>
              </div>
              
              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {VEHICLE_CLASSES.map(v => {
                  const count = sessionCounts[v.key as keyof VehicleStats] as number;
                  return (
                    <div key={v.key} className="space-y-3">
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-gray-50 dark:bg-slate-800 rounded-lg">
                            <v.icon className="w-4 h-4 text-gray-500" />
                          </div>
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-tight">{v.label}</span>
                        </div>
                        <span className="text-lg font-black text-gray-900 dark:text-white">{count}</span>
                      </div>
                      <div className="h-2 bg-gray-50 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000" style={{width:`${Math.min((count/maxCount)*100,100)}%`,backgroundColor:v.color}} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
