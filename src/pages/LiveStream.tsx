'use client';

import { useState, useEffect, useRef, createElement } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Play, Maximize2, Share2, RefreshCw, Camera as CameraIcon, MapPin, Info, Menu, X } from 'lucide-react';
import { useRealtime } from '@/src/lib/useRealtime';

interface CameraData {
  id: number;
  name: string;
  location: string;
  status: string;
  stream_url?: string;
}

export default function LiveStream() {
  const params = useParams();
  const id = params?.id;
  const [cameras, setCameras] = useState<CameraData[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<CameraData | null>(null);
  const [isListOpen, setIsListOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [streamError, setStreamError] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);
  const [hostname, setHostname] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostname(window.location.hostname);
    }
  }, []);

  const reloadStream = () => {
    if (selectedCamera?.stream_url) {
      setStreamError(false);
      // Force re-render to reinitialize stream
      const currentCamera = selectedCamera;
      setSelectedCamera(null);
      setTimeout(() => setSelectedCamera(currentCamera), 100);
    }
  };

  useEffect(() => {
    const loadCameras = async () => {
      try {
        const res = await fetch('/api/cameras');
        if (!res.ok) throw new Error('Failed to fetch cameras');
        const data = await res.json();
        setCameras(data);
        
        if (id && data.length > 0) {
          const selectedId = Array.isArray(id) ? id[0] : id;
          const camera = data.find((c: any) => c.id === parseInt(selectedId));
          setSelectedCamera(camera || data[0]);
        } else if (data.length > 0) {
          setSelectedCamera(data[0]);
        }
      } catch (error) {
        console.error('Error loading cameras:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCameras();
  }, [id]);

  useRealtime((event) => {
    if (event.type === 'camera:created') {
      const camera = event.payload as CameraData;
      setCameras((prev) => (prev.some((item) => item.id === camera.id) ? prev : [...prev, camera]));
      if (!selectedCamera) {
        setSelectedCamera(camera);
      }
    }
    if (event.type === 'camera:updated' || event.type === 'camera:health') {
      const camera = event.payload as CameraData;
      setCameras((prev) => prev.map((item) => (item.id === camera.id ? camera : item)));
      setSelectedCamera((prev) => (prev && prev.id === camera.id ? camera : prev));
    }
    if (event.type === 'camera:deleted') {
      const payload = event.payload as { id: number };
      setCameras((prev) => prev.filter((item) => item.id !== payload.id));
      setSelectedCamera((prev) => (prev?.id === payload.id ? null : prev));
    }
  });

  useEffect(() => {
    if (!selectedCamera && cameras.length > 0) {
      setSelectedCamera(cameras[0]);
    }
  }, [cameras, selectedCamera]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col lg:flex-row">
      {/* Mobile Header for Stream */}
      <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-30">
        <Link href="/dashboard" className="text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-sm font-bold truncate px-4">{selectedCamera?.name || 'Live Stream'}</h2>
        <button 
          onClick={() => setIsListOpen(!isListOpen)}
          className="p-2 bg-gray-50 rounded-lg text-gray-600"
        >
          {isListOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Camera List Sidebar */}
      <div className={`
        fixed inset-0 z-40 lg:relative lg:z-0 lg:w-80 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300
        ${isListOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-gray-100">
          <div className="hidden lg:block">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-bold">Kembali ke Dashboard</span>
            </Link>
          </div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Daftar CCTV</h2>
            <button onClick={() => setIsListOpen(false)} className="lg:hidden p-2 text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Cari Lokasi..." 
              className="w-full pl-4 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cameras.map((camera) => (
            <button
              key={camera.id}
              onClick={() => {
                setSelectedCamera(camera);
                setIsListOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                selectedCamera?.id === camera.id 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' 
                  : 'hover:bg-gray-50 text-gray-600'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                selectedCamera?.id === camera.id ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                <CameraIcon className="w-5 h-5" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{camera.name}</p>
                <p className={`text-[10px] ${selectedCamera?.id === camera.id ? 'text-emerald-50' : 'text-gray-400'}`}>
                  {camera.location}
                </p>
              </div>
              {camera.status === 'online' && (
                <span className={`w-2 h-2 rounded-full ${selectedCamera?.id === camera.id ? 'bg-white' : 'bg-emerald-500'}`}></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content - Video Player */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <header className="hidden lg:flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Live Streaming CCTV Kota Madiun</h1>
              <p className="text-gray-500 flex items-center gap-2 mt-1">
                <MapPin className="w-4 h-4" /> {selectedCamera?.location}
              </p>
            </div>
            <div className="flex gap-3">
              <button className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <Share2 className="w-5 h-5 text-gray-500" />
              </button>
              <button className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <Maximize2 className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </header>

          <div className="bg-white rounded-2xl md:rounded-[32px] overflow-hidden shadow-xl border border-gray-100">
            <div className="aspect-video bg-gray-900 relative group">
              {selectedCamera?.stream_url && !streamError ? (
                <div className="w-full h-full relative" ref={videoRef}>
                  {hostname && (
                    <iframe
                      src={`http://${hostname}:1984/stream.html?src=camera-${selectedCamera.id}&mode=webrtc`}
                      className="w-full h-full border-0 absolute inset-0"
                      allow="autoplay; fullscreen; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <div className="text-center text-white">
                    <CameraIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-bold mb-2">
                      {streamError ? 'Stream Error' : 'Stream Tidak Tersedia'}
                    </h3>
                    <p className="text-gray-400 mb-4">
                      {streamError 
                        ? 'Gagal memuat stream. URL stream mungkin tidak valid atau tidak didukung.' 
                        : 'RTSP URL belum dikonfigurasi untuk kamera ini'
                      }
                    </p>
                    {streamError && (
                      <button 
                        onClick={reloadStream}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                      >
                        Coba Lagi
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Overlay Controls */}
              <div className="absolute top-4 left-4 md:top-6 md:left-6 flex flex-wrap gap-2 md:gap-3 pointer-events-none">
                <span className="px-2 md:px-3 py-1 md:py-1.5 bg-red-500 text-white text-[10px] md:text-xs font-bold rounded-full flex items-center gap-1 md:gap-2 shadow-lg">
                  <span className="w-1.5 md:w-2 h-1.5 md:h-2 bg-white rounded-full animate-pulse"></span>
                  LIVE
                </span>
              </div>

              <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 pointer-events-none">
                <button 
                  onClick={reloadStream}
                  className="pointer-events-auto px-3 md:px-4 py-1.5 md:py-2 bg-emerald-500 text-white text-[10px] md:text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg hover:bg-emerald-600 transition-colors"
                >
                  <RefreshCw className="w-3 md:w-4 h-3 md:h-4" /> <span className="hidden sm:inline">Reload Stream</span><span className="sm:hidden">Reload</span>
                </button>
              </div>
            </div>

            <div className="p-4 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-50 rounded-xl md:rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                  <Info className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-gray-900">{selectedCamera?.name}</h3>
                  <p className="text-xs md:text-sm text-gray-500">Kamera ini memantau area persimpangan utama untuk manajemen lalu lintas.</p>
                </div>
              </div>
              <div className="flex gap-4 w-full md:w-auto justify-between md:justify-end">
                <div className="text-center px-4 md:px-6">
                  <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-xs md:text-sm font-bold text-emerald-600">Terhubung</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
