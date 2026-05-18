'use client';

import { useState } from 'react';
import { X, Flag, Camera, AlertTriangle, CheckCircle2, Loader2, ChevronDown } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  cameraId: number;
  cameraName: string;
  token: string | null;
}

const CATEGORIES = [
  { value: 'camera_offline', label: 'Kamera Mati / Tidak Menampilkan Gambar', emoji: '📷' },
  { value: 'stream_error', label: 'Stream Error / Macet / Lag', emoji: '📡' },
  { value: 'feature_bug', label: 'Fitur Tidak Berfungsi', emoji: '⚙️' },
  { value: 'other', label: 'Masalah Lainnya', emoji: '💬' },
] as const;

type ReportState = 'idle' | 'loading' | 'success' | 'error';

export default function ReportModal({ isOpen, onClose, cameraId, cameraName, token }: ReportModalProps) {
  const [category, setCategory] = useState<string>('camera_offline');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'urgent'>('normal');
  const [state, setState] = useState<ReportState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleClose = () => {
    if (state === 'loading') return;
    setCategory('camera_offline');
    setDescription('');
    setUrgency('normal');
    setState('idle');
    setErrorMsg('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('Mohon isi deskripsi masalah terlebih dahulu.');
      return;
    }

    setState('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ camera_id: cameraId, camera_name: cameraName, category, description, urgency }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Gagal mengirim laporan');
      }

      setState('success');
      setTimeout(() => handleClose(), 2200);
    } catch (err: unknown) {
      setState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[36px] shadow-2xl border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500 rounded-2xl shadow-lg shadow-red-500/20">
              <Flag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white tracking-tight">Laporkan Masalah</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Camera className="w-3 h-3 text-gray-400" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate max-w-[220px]">{cameraName}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={state === 'loading'}
            className="p-2.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-2xl transition-all text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success State */}
        {state === 'success' ? (
          <div className="p-10 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <p className="text-base font-black text-gray-900 dark:text-white mb-1">Laporan Terkirim!</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tim admin akan segera menangani masalah ini.</p>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Category */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3 px-1">
                Jenis Masalah
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={state === 'loading'}
                  className="w-full appearance-none px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-red-400 transition-all pr-10 disabled:opacity-60"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.emoji} {c.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3 px-1">
                Tingkat Urgensi
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUrgency('normal')}
                  disabled={state === 'loading'}
                  className={`py-3 px-4 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all disabled:opacity-60 ${
                    urgency === 'normal'
                      ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-400 text-blue-600 dark:text-blue-400'
                      : 'bg-gray-50 dark:bg-slate-800 border-transparent text-gray-400 dark:text-gray-500 hover:border-gray-200 dark:hover:border-slate-700'
                  }`}
                >
                  🔵 Normal
                </button>
                <button
                  type="button"
                  onClick={() => setUrgency('urgent')}
                  disabled={state === 'loading'}
                  className={`py-3 px-4 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all disabled:opacity-60 ${
                    urgency === 'urgent'
                      ? 'bg-red-50 dark:bg-red-500/10 border-red-400 text-red-600 dark:text-red-400'
                      : 'bg-gray-50 dark:bg-slate-800 border-transparent text-gray-400 dark:text-gray-500 hover:border-gray-200 dark:hover:border-slate-700'
                  }`}
                >
                  🔴 Mendesak
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3 px-1">
                Keterangan Masalah <span className="text-red-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => { setDescription(e.target.value); if (errorMsg) setErrorMsg(''); }}
                disabled={state === 'loading'}
                placeholder="Deskripsikan masalah yang Anda temui secara singkat dan jelas..."
                rows={4}
                maxLength={500}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:ring-2 focus:ring-red-400 transition-all resize-none disabled:opacity-60"
              />
              <div className="flex justify-between items-center mt-1.5 px-1">
                {errorMsg ? (
                  <p className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {errorMsg}
                  </p>
                ) : <span />}
                <span className="text-[10px] text-gray-400 font-mono">{description.length}/500</span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={state === 'loading' || !description.trim()}
              className="w-full py-4 bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-red-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {state === 'loading' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
              ) : (
                <><Flag className="w-4 h-4" /> Kirim Laporan</>
              )}
            </button>

            {state === 'error' && (
              <p className="text-center text-xs text-red-500 font-bold animate-in fade-in">
                {errorMsg || 'Gagal mengirim laporan. Silakan coba lagi.'}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
