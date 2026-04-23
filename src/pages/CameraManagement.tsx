'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Filter, MoreVertical, Edit2, Trash2, ExternalLink, Camera as CameraIcon, Globe, X } from 'lucide-react';
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

  return (
    <div className="p-4 md:p-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Camera Management</h1>
          <p className="text-sm text-gray-500">Configure and manage surveillance devices</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="w-full md:w-auto px-6 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New Camera
        </button>
      </header>

      <div className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {statusMessage && (
          <p className="px-4 md:px-6 pt-4 text-sm text-emerald-700">{statusMessage}</p>
        )}
        <div className="p-4 md:p-6 border-b border-gray-50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name, IP, or location..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2">
              <Filter className="w-4 h-4" /> Filter
            </button>
            <div className="flex-1 md:flex-none px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <span className="hidden sm:inline">{filteredCameras.filter(c => c.status === 'online').length} Devices Active</span>
              <span className="sm:hidden">{filteredCameras.filter(c => c.status === 'online').length} Active</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] uppercase tracking-widest font-bold text-gray-400">
                <th className="px-6 py-4">Camera Name</th>
                <th className="px-6 py-4 hidden sm:table-cell">Location</th>
                <th className="px-6 py-4 hidden md:table-cell">IP Address</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCameras.map((camera) => (
                <tr key={camera.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                        <CameraIcon className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-gray-900 block">{camera.name}</span>
                        <span className="text-[10px] text-gray-500 sm:hidden flex items-center gap-1">
                          <Globe className="w-3 h-3" /> {camera.location}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 hidden sm:table-cell">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Globe className="w-4 h-4" />
                      {camera.location}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-gray-500 font-mono hidden md:table-cell">{camera.ip_address}</td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      camera.status === 'online' 
                        ? 'bg-emerald-100 text-emerald-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${camera.status === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                      {camera.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => router.push(`/stream/${camera.id}`)}
                        className="p-2 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg text-gray-400 transition-all"
                        title="View Stream"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleOpenModal(camera)}
                        className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-gray-400 transition-all" 
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(camera.id)}
                        className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg text-gray-400 transition-all" 
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 md:p-6 border-t border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>Showing 1 to {filteredCameras.length} of {cameras.length} cameras</p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 bg-emerald-500 text-white rounded-lg">1</button>
            <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">{editingCamera ? 'Edit Camera' : 'Add New Camera'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Camera Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Jembatan Lawu"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Location</label>
                <input 
                  required
                  type="text" 
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Jl. Lawu"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">IP Address</label>
                <input 
                  required
                  type="text" 
                  value={formData.ip_address}
                  onChange={e => setFormData({...formData, ip_address: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  placeholder="e.g. 192.168.1.101"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">RTSP Stream URL</label>
                <input 
                  type="text" 
                  value={formData.stream_url}
                  onChange={e => setFormData({...formData, stream_url: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  placeholder="e.g. rtsp://192.168.1.101:554/live"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as 'online' | 'offline'})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-100">
                  {editingCamera ? 'Update Camera' : 'Add Camera'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
