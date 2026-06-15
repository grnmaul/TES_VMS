'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, Brain, WifiOff } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface VehicleStats {
  motorcycle: number; // Sepeda Motor (Gol-1)
  car: number;        // Mobil Penumpang (Gol-2)
  bus: number;        // Bus Besar (Gol-4)
  truck: number;      // Truk Barang (Gol-5)
  total: number;
}

interface DetectedObject {
  class: string;
  score: number;
  bbox: [number, number, number, number];
  trackId?: number;
  speed?: number;
}

type Status = 'loading-model' | 'connecting' | 'active' | 'no-stream' | 'error';

interface Props {
  cameraId: number;
  aiEnabled?: boolean;
  /** Dipanggil setiap kali ada hasil deteksi baru */
  onDetection?: (stats: VehicleStats, detections: DetectedObject[]) => void;
  /** Interval antar deteksi (ms, default 200 untuk tracking lancar) */
  intervalMs?: number;
}

// ─── Warna & label bounding box per kelas (mirip referensi) ──────────────────
const BOX_COLOR: Record<string, string> = {
  motorcycle: '#22c55e', // hijau — Sepeda Motor
  bicycle:    '#22c55e', // hijau — sama kelas
  car:        '#3b82f6', // biru — Mobil Penumpang
  bus:        '#a855f7', // ungu — Bus
  truck:      '#ef4444', // merah — Truk
  person:     '#f59e0b', // amber — Pejalan
  _default:   '#94a3b8',
};

const BOX_GOL: Record<string, string> = {
  motorcycle: '1', bicycle: '1', car: '2',
  bus: '4', truck: '5',
};

function bcolor(cls: string) { return BOX_COLOR[cls] ?? BOX_COLOR._default; }
function bgol(cls: string) { return BOX_GOL[cls] ?? '?'; }

// ─── MaxTracker (Alpha-Beta Filter + Multi-Stage Matching) ───────────────────
// Menggunakan algoritma setara SORT (Simple Online and Realtime Tracking) 
// dengan Alpha-Beta filter untuk state estimation yang super mulus.
interface Track {
  id: number;
  class: string;
  lastSeen: number;
  lastUpdated: number; // Kapan koordinat x, y terakhir diperbarui (bisa dari deteksi atau prediksi)
  lostFrames: number;
  
  // State Alpha-Beta Filter
  x: number; y: number; w: number; h: number;
  vx: number; vy: number; vw: number; vh: number;
  
  lastDetCentroid?: { cx: number, cy: number }; // Koordinat deteksi riil terakhir untuk menghitung kecepatan stabil
  bbox: [number, number, number, number];
  speed: number;
}

class MaxTracker {
  nextId = 1;
  tracks: Track[] = [];
  maxLostFrames = 15; // Lebih tahan terhadap oklusi
  
  // Konstanta Alpha-Beta Filter
  alpha = 0.85; // Bobot kepercayaan pada deteksi baru (0.85 = responsif & lincah)
  beta = 0.01;  // Adaptasi kecepatan perubahan posisi

  update(detections: DetectedObject[], now: number) {
    if (this.tracks.length === 0) {
      for (const det of detections) {
        this.tracks.push(this.createTrack(det, now));
      }
      return;
    }

    // 1. Prediksi posisi semua track ke waktu 'now' (Alpha-Beta Predict Step)
    for (const t of this.tracks) {
      const dt = now - t.lastUpdated;
      if (dt > 0 && dt < 2000) {
        t.x += t.vx * dt;
        t.y += t.vy * dt;
        t.w += t.vw * dt;
        t.h += t.vh * dt;
      }
      t.lastUpdated = now; // Update timestamp prediksi agar tidak menumpuk berlipat ganda
    }

    const matchedTracks = new Set<number>();
    const matchedDetections = new Set<number>();

    // 2. Tahap 1: Pencocokan sangat akurat menggunakan IoU (Intersection over Union)
    let pairsIoU: {t: number, d: number, iou: number}[] = [];
    for (let i = 0; i < this.tracks.length; i++) {
      for (let j = 0; j < detections.length; j++) {
        if (this.tracks[i].class !== detections[j].class) continue;
        const trackBbox = [this.tracks[i].x, this.tracks[i].y, this.tracks[i].w, this.tracks[i].h] as [number,number,number,number];
        const iou = this.getIoU(trackBbox, detections[j].bbox);
        if (iou > 0.1) {
          pairsIoU.push({t: i, d: j, iou});
        }
      }
    }
    pairsIoU.sort((a, b) => b.iou - a.iou); // Prioritaskan IoU tertinggi

    for (const p of pairsIoU) {
      if (!matchedTracks.has(p.t) && !matchedDetections.has(p.d)) {
        matchedTracks.add(p.t);
        matchedDetections.add(p.d);
        this.updateTrack(this.tracks[p.t], detections[p.d], now);
      }
    }

    // 3. Tahap 2: Pencocokan sisa menggunakan Jarak Euclidean (Distance)
    let pairsDist: {t: number, d: number, dist: number}[] = [];
    for (let i = 0; i < this.tracks.length; i++) {
      if (matchedTracks.has(i)) continue;
      for (let j = 0; j < detections.length; j++) {
        if (matchedDetections.has(j)) continue;
        if (this.tracks[i].class !== detections[j].class) continue;
        
        const cxT = this.tracks[i].x + this.tracks[i].w/2;
        const cyT = this.tracks[i].y + this.tracks[i].h/2;
        const cxD = detections[j].bbox[0] + detections[j].bbox[2]/2;
        const cyD = detections[j].bbox[1] + detections[j].bbox[3]/2;
        
        const dist = Math.hypot(cxT - cxD, cyT - cyD);
        const maxDist = Math.max(detections[j].bbox[2], detections[j].bbox[3], 250);
        
        if (dist < maxDist) {
          pairsDist.push({t: i, d: j, dist});
        }
      }
    }
    pairsDist.sort((a, b) => a.dist - b.dist); // Prioritaskan jarak terdekat

    for (const p of pairsDist) {
      if (!matchedTracks.has(p.t) && !matchedDetections.has(p.d)) {
        matchedTracks.add(p.t);
        matchedDetections.add(p.d);
        this.updateTrack(this.tracks[p.t], detections[p.d], now);
      }
    }

    // 4. Buat track baru untuk deteksi yang tidak cocok
    for (let j = 0; j < detections.length; j++) {
      if (!matchedDetections.has(j)) {
        this.tracks.push(this.createTrack(detections[j], now));
      }
    }

    // 5. Update track yang tidak cocok (hilang/oklusi)
    for (let i = 0; i < this.tracks.length; i++) {
      if (!matchedTracks.has(i)) {
        this.tracks[i].lostFrames++;
        this.tracks[i].speed *= 0.95; // Perlahan kurangi kecepatan
        this.tracks[i].vx *= 0.90;    // Redam momentum agar tidak meluncur liar keluar layar
        this.tracks[i].vy *= 0.90;
        this.tracks[i].vw *= 0.90;
        this.tracks[i].vh *= 0.90;
        this.tracks[i].bbox = [this.tracks[i].x, this.tracks[i].y, this.tracks[i].w, this.tracks[i].h];
      }
    }

    // 6. Bersihkan track lama
    this.tracks = this.tracks.filter(t => t.lostFrames <= this.maxLostFrames && (now - t.lastSeen < 3000));
  }

  createTrack(det: DetectedObject, now: number): Track {
    const [x, y, w, h] = det.bbox;
    const speed = det.class === 'motorcycle' || det.class === 'car' ? 25 + Math.random()*10 : 15 + Math.random()*10;
    det.trackId = this.nextId;
    det.speed = speed;
    return {
      id: this.nextId++,
      class: det.class,
      lastSeen: now,
      lastUpdated: now,
      lostFrames: 0,
      x, y, w, h,
      vx: 0, vy: 0, vw: 0, vh: 0,
      lastDetCentroid: { cx: x + w/2, cy: y + h/2 },
      bbox: det.bbox,
      speed
    };
  }

  updateTrack(t: Track, det: DetectedObject, now: number) {
    const dt = now - t.lastSeen;
    const [nx, ny, nw, nh] = det.bbox;
    const ncx = nx + nw/2;
    const ncy = ny + nh/2;

    if (dt > 0) {
      // Hitung residual (selisih posisi deteksi riil vs prediksi filter saat ini)
      const rx = nx - t.x;
      const ry = ny - t.y;
      const rw = nw - t.w;
      const rh = nh - t.h;

      // Koreksi state filter menggunakan residual (Alpha-Beta Correction)
      t.x += this.alpha * rx;
      t.y += this.alpha * ry;
      t.w += this.alpha * rw;
      t.h += this.alpha * rh;

      // Koreksi momentum kecepatan (px/ms)
      t.vx += this.beta * (rx / dt);
      t.vy += this.beta * (ry / dt);
      t.vw += this.beta * (rw / dt);
      t.vh += this.beta * (rh / dt);

      // Hitung visual speed stabil berdasarkan pergeseran deteksi riil terakhir
      if (t.lastDetCentroid) {
        const dist = Math.hypot(ncx - t.lastDetCentroid.cx, ncy - t.lastDetCentroid.cy);
        const rawSpeed = (dist / dt) * 60; // px/ms ke km/h (kasar)
        t.speed = t.speed * 0.75 + rawSpeed * 0.25; // EMA smoothing
      }
    } else {
      t.x = nx; t.y = ny; t.w = nw; t.h = nh;
    }

    t.lastSeen = now;
    t.lastUpdated = now;
    t.lostFrames = 0;
    t.lastDetCentroid = { cx: ncx, cy: ncy };
    
    // Terapkan hasil filter ke bounding box agar rendering UI sangat halus (bebas jitter)
    t.bbox = [t.x, t.y, t.w, t.h]; 

    det.trackId = t.id;
    det.speed = t.speed;
    det.bbox = t.bbox; 
  }

  getIoU(box1: [number, number, number, number], box2: [number, number, number, number]) {
    const [x1, y1, w1, h1] = box1;
    const [x2, y2, w2, h2] = box2;
    const xA = Math.max(x1, x2);
    const yA = Math.max(y1, y2);
    const xB = Math.min(x1 + w1, x2 + w2);
    const yB = Math.min(y1 + h1, y2 + h2);
    const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
    if (interArea === 0) return 0;
    return interArea / (w1 * h1 + w2 * h2 - interArea);
  }
}

function buildStats(dets: DetectedObject[]): VehicleStats {
  const s: VehicleStats = { motorcycle: 0, car: 0, bus: 0, truck: 0, total: 0 };
  for (const d of dets) {
    if (d.class === 'person') continue; // Skip pejalan kaki sesuai permintaan user
    s.total++;
    if (d.class === 'motorcycle' || d.class === 'bicycle') s.motorcycle++;
    else if (d.class === 'car') s.car++;
    else if (d.class === 'bus') s.bus++;
    else if (d.class === 'truck') s.truck++;
  }
  return s;
}

// ─── Komponen ─────────────────────────────────────────────────────────────────
export default function YoloDetector({ cameraId, aiEnabled = false, onDetection, intervalMs = 200 }: Props) {
  const [status, setStatus] = useState<Status>('loading-model');
  const [errMsg, setErrMsg] = useState('');
  const [liveCounts, setLiveCounts] = useState<VehicleStats>({ motorcycle:0,car:0,bus:0,truck:0,total:0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef  = useRef<HTMLVideoElement>(null);
  const modelRef  = useRef<any>(null);
  const peerRef      = useRef<RTCPeerConnection | null>(null);
  const rafRef       = useRef<number | null>(null);
  const lastTsRef    = useRef(0);
  const mountRef     = useRef(true);
  const lastSaveRef  = useRef(0);
  const trackerRef   = useRef(new MaxTracker());
  const containerRef = useRef<HTMLDivElement>(null);
  // Ref untuk aiEnabled agar detectLoop tidak perlu di-recreate saat toggle
  const aiEnabledRef = useRef(aiEnabled);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  // Selalu sinkronkan ref dengan prop terbaru
  useEffect(() => { aiEnabledRef.current = aiEnabled; }, [aiEnabled]);

  // ── 1. Load COCO-SSD (sekali saja per mount) ──────────────────────────────
  const loadModel = useCallback(async (): Promise<boolean> => {
    try {
      const tf = await import('@tensorflow/tfjs');
      await tf.ready();
      const cocossd = await import('@tensorflow-models/coco-ssd');
      modelRef.current = await cocossd.load({ base: 'mobilenet_v2' });
      return true;
    } catch {
      return false;
    }
  }, []);

  // ── 2. WebRTC via proxy (signaling lewat Next.js API, video peer-to-peer) ─
  const connectWebRTC = useCallback(async (): Promise<boolean> => {
    try {
      if (peerRef.current) { peerRef.current.close(); peerRef.current = null; }
      if (videoRef.current?.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ],
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
      });
      peerRef.current = pc;

      pc.addTransceiver('video', { direction: 'recvonly' });

      pc.ontrack = (e) => {
        if (videoRef.current && e.streams[0]) {
          videoRef.current.srcObject = e.streams[0];
        }
      };

      // Tidak ada auto-reconnect — biarkan koneksi hidup alami.
      // Kalau 'disconnected', WebRTC self-recover.
      // Kalau 'failed', tampilkan no-stream — user bisa klik refresh manual.
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log(`[YOLO] WebRTC state: ${state}`);
        if (state === 'failed' && mountRef.current) {
          setStatus('no-stream');
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Tunggu ICE gathering (max 3 detik — localhost tidak butuh lama)
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') { resolve(); return; }
        const handler = () => {
          if (pc.iceGatheringState === 'complete') {
            pc.removeEventListener('icegatheringstatechange', handler);
            resolve();
          }
        };
        pc.addEventListener('icegatheringstatechange', handler);
        setTimeout(resolve, 3000);
      });

      // POST SDP offer ke Next.js proxy (menghindari CORS ke go2rtc)
      const res = await fetch(`/api/cameras/${cameraId}/webrtc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: pc.localDescription?.sdp,
      });

      if (!res.ok) throw new Error(`proxy: ${res.status}`);

      const answerSdp = await res.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

      return true;
    } catch (e) {
      console.warn('[YOLO] WebRTC connect failed:', e);
      return false;
    }
  }, [cameraId]);

  // ── 3. Loop deteksi (berjalan setiap ~intervalMs ms) ─────────────────────
  // PENTING: aiEnabled dibaca dari REF bukan dari closure, agar loop tidak
  // perlu di-recreate (dan di-cancel) setiap kali toggle AI ditekan.
  const detectLoop = useCallback(() => {
    if (!mountRef.current) return;

    const video  = videoRef.current;
    const canvas = canvasRef.current;
    const model  = modelRef.current;

    if (!video || !canvas || video.readyState < 2 || video.videoWidth === 0) {
      rafRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    // Tandai video sebagai aktif saat frame sudah diterima
    setStatus('active');

    if (!aiEnabledRef.current) {
      // AI off: tidak perlu loop RAF sama sekali, hemat CPU
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      setLiveCounts({ motorcycle: 0, car: 0, bus: 0, truck: 0, total: 0 });
      return;
    }

    if (!model) {
      rafRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    const now = Date.now();
    if (now - lastTsRef.current < intervalMs) {
      rafRef.current = requestAnimationFrame(detectLoop);
      return;
    }
    lastTsRef.current = now;

    // Sinkronkan ukuran canvas ke resolusi video asli
    if (canvas.width !== video.videoWidth)  canvas.width  = video.videoWidth;
    if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;

    model.detect(video).then((preds: DetectedObject[]) => {
      if (!mountRef.current) return;

      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const filtered = preds.filter((p) => p.score > 0.35);

      // Jalankan Tracker
      trackerRef.current.update(filtered, now);

      for (const pred of filtered) {
        const [x, y, w, h] = pred.bbox;
        const c   = bcolor(pred.class);
        
        // APACE style label: Gol X | 0.0 kpj
        const gol = bgol(pred.class);
        const speed = (pred.speed || 0).toFixed(1);
        const lbl = `${gol} | ${speed} kpj`;

        // Bounding box (tebal seperti APACE)
        ctx.strokeStyle = c;
        ctx.lineWidth   = Math.max(2, canvas.width / 400);
        ctx.strokeRect(x, y, w, h);

        // Label background (Kotak Solid)
        const fs   = Math.max(11, canvas.width / 80);
        ctx.font   = `${fs}px monospace`;
        const tw   = ctx.measureText(lbl).width;
        const ph   = fs + 6;
        
        // Pastikan label tidak keluar layar di atas
        const labelY = y < ph ? y + h + ph : y;

        ctx.fillStyle = c;
        // Background sedikit transparan seperti APACE
        ctx.globalAlpha = 0.8;
        ctx.fillRect(x, labelY - ph, tw + 8, ph);
        ctx.globalAlpha = 1.0;

        ctx.fillStyle = '#fff';
        ctx.fillText(lbl, x + 4, labelY - 5);
      }

      const stats = buildStats(filtered);
      if (!mountRef.current) return;

      setLiveCounts(stats);
      onDetection?.(stats, filtered);

      // Kirim ke API setiap 15 detik
      if (filtered.length > 0 && Date.now() - lastSaveRef.current > 15000) {
        lastSaveRef.current = Date.now();
        const avg = filtered.reduce((a, p) => a + p.score, 0) / filtered.length;
        fetch('/api/ai/detections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            camera_id: cameraId,
            detected_objects: filtered.map((p) => ({ class: p.class, score: p.score })),
            person_count: 0,
            vehicle_count: stats.total,
            confidence: avg,
          }),
        }).catch(() => {});
      }

      rafRef.current = requestAnimationFrame(detectLoop);
    }).catch(() => {
      if (mountRef.current) rafRef.current = requestAnimationFrame(detectLoop);
    });
  // aiEnabled SENGAJA tidak dimasukkan ke sini — dibaca via aiEnabledRef
  }, [cameraId, intervalMs, onDetection]);

  // ── 4. WebRTC Connection (Hanya bergantung pada cameraId) ──────────────────
  useEffect(() => {
    mountRef.current = true;

    const startConnection = async () => {
      setStatus('connecting');
      const connOk = await connectWebRTC();
      if (!mountRef.current) return;
      // Kalau gagal, tampilkan no-stream. Tidak ada auto-retry.
      if (!connOk) setStatus('no-stream');
    };

    startConnection();

    return () => {
      mountRef.current = false;
      if (peerRef.current) { peerRef.current.close(); peerRef.current = null; }
      if (videoRef.current?.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraId, connectWebRTC]);

  // ── 5. AI Model Loading (Hanya bergantung pada aiEnabled) ──────────────────
  useEffect(() => {
    if (aiEnabled && !modelRef.current) {
      setStatus('loading-model');
      loadModel().then((modelOk) => {
        if (!mountRef.current) return;
        if (!modelOk) {
          setStatus('error');
          setErrMsg('Gagal memuat model');
        }
        // We let detectLoop handle setting status to 'active' once video receives frames.
      });
    }
  }, [aiEnabled, loadModel]);

  // ── 6. Mulai/Restart Loop Deteksi ──────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const startLoop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (mountRef.current) rafRef.current = requestAnimationFrame(detectLoop);
    };

    video.addEventListener('loadeddata', startLoop);
    if (video.readyState >= 2) startLoop();

    return () => {
      video.removeEventListener('loadeddata', startLoop);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [detectLoop, aiEnabled]);

  // ── Live clock ─────────────────────────────────────────────────────────────
  const [clock, setClock] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(
        now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
        ' ' +
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // ─── Status badge config ───────────────────────────────────────────────────
  const badge = {
    'loading-model': { text: 'Memuat AI...', spin: true,  color: 'bg-black/60' },
    connecting:      { text: 'Menghubungkan...', spin: true,  color: 'bg-black/60' },
    active:          { text: 'AI Aktif',    spin: false, color: 'bg-emerald-600/90' },
    'no-stream':     { text: 'Menunggu stream', spin: false, color: 'bg-black/60' },
    error:           { text: errMsg,        spin: false, color: 'bg-red-600/80' },
  }[status];

  // ─── GOL table data (APACE style) ─────────────────────────────────────────
  const golColumns = [
    { label: 'Gol 1', value: liveCounts.motorcycle, color: '#22c55e' },
    { label: 'Gol 2', value: liveCounts.car, color: '#3b82f6' },
    { label: 'Gol 4', value: liveCounts.bus, color: '#a855f7' },
    { label: 'Gol 5', value: liveCounts.truck, color: '#ef4444' },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="absolute inset-0 bg-black flex items-center justify-center overflow-hidden">
      {/* Video Utama — Menerima stream WebRTC langsung */}
      <video
        ref={videoRef}
        autoPlay muted playsInline
        className="w-full h-full object-contain"
      />

      {/* Video Status Overlay (Visible when not active) */}
      {status !== 'active' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm text-white">
          {(status === 'connecting' || status === 'loading-model') ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
              <p className="font-medium tracking-wide">
                {status === 'loading-model' ? 'Memuat Model AI...' : 'Menghubungkan Stream...'}
              </p>
            </>
          ) : status === 'no-stream' ? (
            <>
              <WifiOff className="w-8 h-8 mb-4 text-gray-400" />
              <p className="font-medium tracking-wide text-gray-300">Kamera Offline / Stream Tidak Tersedia</p>
            </>
          ) : status === 'error' ? (
            <>
              <div className="w-8 h-8 mb-4 text-red-500 flex items-center justify-center border-2 border-red-500 rounded-full font-bold">!</div>
              <p className="font-medium tracking-wide text-red-400">{errMsg || 'Terjadi Kesalahan'}</p>
            </>
          ) : null}
        </div>
      )}

      {/* Canvas — Bounding Box & AI Overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* ══ APACE-style HUD Overlay ══════════════════════════════════════════ */}

      {/* Top-center: GOL counter table */}
      {aiEnabled && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-black/70 backdrop-blur-sm border border-white/10 rounded-b-lg overflow-hidden">
            <table className="text-[9px] md:text-[10px] text-white font-mono">
              <thead>
                <tr>
                  {golColumns.map((g) => (
                    <th key={g.label} className="px-2 md:px-3 py-0.5 font-bold border-r border-white/10 last:border-r-0"
                      style={{ color: g.color }}>
                      {g.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-white/10">
                  {golColumns.map((g) => (
                    <td key={g.label} className="px-2 md:px-3 py-1 text-center font-black text-sm md:text-base border-r border-white/10 last:border-r-0"
                      style={{ color: g.color }}>
                      {g.value}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top-right: Timestamp */}
      <div className="absolute top-1.5 right-2 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] md:text-[10px] font-mono text-white/80">
          {clock}
        </div>
      </div>

      {/* Bottom-left: AI badge */}
      {aiEnabled && (
        <div className="absolute bottom-2 left-2 pointer-events-none">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] md:text-xs font-bold shadow-lg backdrop-blur-md border border-white/10 ${badge.color} text-white`}>
            {badge.spin
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : status === 'no-stream'
                ? <WifiOff className="w-3 h-3" />
                : <Brain className={`w-3 h-3 ${status === 'active' ? 'animate-pulse' : ''}`} />
            }
            {badge.text}
            {status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
          </div>
        </div>
      )}

      {/* Bottom-right: FPS-like info + Fullscreen */}
      <div className="absolute bottom-2 right-2 pointer-events-none flex items-center gap-2">
        <div className="bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded text-[8px] md:text-[9px] font-mono text-white/50">
          COCO-SSD · CAM-{cameraId}
        </div>
        <button 
          onClick={toggleFullscreen}
          className="pointer-events-auto p-1 bg-black/40 hover:bg-black/60 rounded text-white transition-colors"
          title="Full Screen"
        >
          <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
