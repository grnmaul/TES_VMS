'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, Edit2, Trash2, ExternalLink, Camera as CameraIcon, Globe, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRealtime } from '@/src/lib/useRealtime';

interface CameraData {
  id: number;
  name: string;
  location: string;
  ip_address: string;
  stream_url?: string;
  status: 'online' | 'offline';
}

export default function CameraManagement() {
  const router = useRouter();
  const [cameras, setCameras] = useState<CameraData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<CameraData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    ip_address: '',
    stream_url: '',
    status: 'online' as 'online' | 'offline'
  });

  // Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    const loadCameras = async () => {
      const res = await fetch('/api/cameras', { cache: 'no-store' });
      const data = await res.json();
      setCameras(data);
      setLoading(false);
    };

    loadCameras();
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

  const handleOpenModal = (camera?: CameraData) => {
    if (camera) {
      setEditingCamera(camera);
      setFormData({
        name: camera.name,
        location: camera.location,
        ip_address: camera.ip_address,
        stream_url: camera.stream_url || '',
        status: camera.status
      });
    } else {
      setEditingCamera(null);
      setFormData({
        name: '',
        location: '',
        ip_address: '',
        stream_url: '',
        status: 'online'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingCamera ? `/api/cameras/${editingCamera.id}` : '/api/cameras';
    const method = editingCamera ? 'PUT' : 'POST';
    const body = formData;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      const fresh = await fetch('/api/cameras', { cache: 'no-store' });
      setCameras(await fresh.json());
      setStatusMessage(editingCamera ? 'Kamera berhasil diperbarui.' : 'Kamera berhasil ditambahkan.');
      setIsModalOpen(false);
    } else {
      const data = await res.json();
      setStatusMessage(data?.error || 'Gagal menyimpan data kamera.');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this camera?')) {
      const res = await fetch(`/api/cameras/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCameras((prev) => prev.filter((camera) => camera.id !== id));
        setStatusMessage('Kamera berhasil dihapus.');
      }
    }
  };

  const filteredCameras = cameras.filter((camera) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      camera.name.toLowerCase().includes(query) ||
      camera.ip_address.toLowerCase().includes(query) ||
      camera.location.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(filteredCameras.length / ITEMS_PER_PAGE);
  const paginatedCameras = filteredCameras.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">Camera Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Advanced control for your surveillance infrastructure</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="w-full md:w-auto px-8 py-4 bg-emerald-500 text-white text-sm font-black rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 dark:shadow-none flex items-center justify-center gap-3 active:scale-95"
        >
          <Plus className="w-5 h-5" /> ADD NEW CAMERA
        </button>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-lg">
        {statusMessage && (
          <div className="px-8 pt-6">
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-4 py-3 rounded-2xl flex items-center justify-between">
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                {statusMessage}
              </p>
              <button onClick={() => setStatusMessage('')} className="text-emerald-400 hover:text-emerald-600"><X className="w-4 h-4" /></button>
            </div>
          </div>
        )}
        
        <div className="p-6 md:p-8 border-b border-gray-50 dark:border-slate-800/50 flex flex-col md:flex-row gap-6 justify-between items-center">
          <div className="relative w-full md:w-[450px]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name, IP address, or location..." 
              value={searchQuery}
              onChange={(e) => {setSearchQuery(e.target.value); setCurrentPage(1);}}
              className="w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-3xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-gray-900 dark:text-white font-medium"
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            {/* Filter removed as requested by user (not useful) */}
            <div className="flex-1 md:flex-none px-6 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-3xl text-xs font-black text-gray-500 dark:text-gray-400 flex items-center justify-center gap-3 tracking-widest uppercase transition-colors">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              <span>{filteredCameras.filter(c => c.status === 'online').length} Devices Active</span>
            </div>
          </div>
        </div>

        {/* INTERNAL SCROLL ADDED */}
        <div className="overflow-y-auto max-h-[600px] custom-scrollbar">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-gray-50/90 dark:bg-slate-800/90 backdrop-blur-md z-20">
              <tr className="text-[10px] uppercase tracking-widest font-black text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-slate-800">
                <th className="px-8 py-6">Camera Details</th>
                <th className="px-8 py-6 hidden sm:table-cell">Location</th>
                <th className="px-8 py-6 hidden md:table-cell">Technical Info</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
              {paginatedCameras.map((camera) => (
                <tr key={camera.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-all group">
                  <td className="px-8 py-7">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <CameraIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                      </div>
                      <div>
                        <span className="text-sm font-black text-gray-900 dark:text-white block tracking-tight">{camera.name}</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 sm:hidden flex items-center gap-1 font-bold mt-0.5">
                          <Globe className="w-3 h-3" /> {camera.location}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-7 hidden sm:table-cell">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                      <Globe className="w-4 h-4 text-emerald-500" />
                      {camera.location}
                    </div>
                  </td>
                  <td className="px-8 py-7 hidden md:table-cell">
                    <div className="space-y-1">
                       <p className="text-xs font-black text-gray-900 dark:text-white font-mono">{camera.ip_address}</p>
                       <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">LAN Network</p>
                    </div>
                  </td>
                  <td className="px-8 py-7">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      camera.status === 'online' 
                        ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${camera.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                      {camera.status}
                    </span>
                  </td>
                  <td className="px-8 py-7">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => router.push(`/live-stream/${camera.id}`)}
                        className="p-3 hover:bg-emerald-500 hover:text-white rounded-2xl text-gray-400 dark:text-gray-500 transition-all hover:shadow-lg hover:shadow-emerald-500/20"
                        title="View Stream"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleOpenModal(camera)}
                        className="p-3 hover:bg-blue-500 hover:text-white rounded-2xl text-gray-400 dark:text-gray-500 transition-all hover:shadow-lg hover:shadow-blue-500/20" 
                        title="Edit"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(camera.id)}
                        className="p-3 hover:bg-red-500 hover:text-white rounded-2xl text-gray-400 dark:text-gray-500 transition-all hover:shadow-lg hover:shadow-red-500/20" 
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {paginatedCameras.length === 0 && (
            <div className="py-32 text-center">
              <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-gray-200 dark:text-slate-700" />
              </div>
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No devices found matching your search</p>
            </div>
          )}
        </div>

        {/* FUNCTIONAL PAGINATION ADDED */}
        <div className="p-8 bg-gray-50/50 dark:bg-slate-800/30 border-t border-gray-50 dark:border-slate-800/50 flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            Showing <span className="text-gray-900 dark:text-white">{paginatedCameras.length}</span> of <span className="text-gray-900 dark:text-white">{filteredCameras.length}</span> Cameras
          </p>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-3 border border-gray-200 dark:border-slate-700 rounded-2xl hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 transition-all shadow-sm group"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-emerald-500" />
            </button>
            <div className="flex items-center gap-2 px-4">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-11 h-11 rounded-2xl text-xs font-black transition-all ${currentPage === i + 1 ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 scale-110' : 'text-gray-400 hover:text-emerald-500 hover:bg-white dark:hover:bg-slate-800'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-3 border border-gray-200 dark:border-slate-700 rounded-2xl hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 transition-all shadow-sm group"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-emerald-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal - Redesigned */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/30">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{editingCamera ? 'Update Camera' : 'Add New Camera'}</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Configure device parameters</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all shadow-sm hover:text-red-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">Camera Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[20px] text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all"
                    placeholder="e.g. Jembatan Lawu" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">Location</label>
                  <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[20px] text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all"
                    placeholder="e.g. Jl. Lawu" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">IP Address</label>
                  <input required type="text" value={formData.ip_address} onChange={e => setFormData({...formData, ip_address: e.target.value})}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[20px] text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-gray-900 dark:text-white transition-all"
                    placeholder="e.g. 192.168.1.101" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as 'online' | 'offline'})}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[20px] text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all"
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">RTSP Stream URL</label>
                <input 
                  type="text" 
                  value={formData.stream_url} 
                  onChange={e => {
                    const newUrl = e.target.value;
                    const ipMatch = newUrl.match(/rtsp:\/\/(?:[^:@]+:[^:@]+@)?([^:\/\s]+)/);
                    const newIp = ipMatch ? ipMatch[1] : formData.ip_address;
                    setFormData({...formData, stream_url: newUrl, ip_address: newIp});
                  }}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[20px] text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-gray-900 dark:text-white transition-all"
                  placeholder="e.g. rtsp://user:pass@192.168.1.101:554/stream" />
              </div>
              <div className="pt-6">
                <button type="submit" className="w-full py-5 bg-emerald-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-95">
                  {editingCamera ? 'CONFIRM UPDATE' : 'CREATE CAMERA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
