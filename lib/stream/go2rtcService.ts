import { spawn, ChildProcess } from 'child_process';
import { ensureGo2rtc } from './go2rtcDownloader';
import { CameraRecord } from '@/lib/repositories/cameraRepository';
import http from 'http';
import os from 'os';

function getWebRtcCandidates(): string[] {
  const candidates = new Set<string>(['127.0.0.1', 'localhost']);
  try {
    const ifaces = os.networkInterfaces();
    for (const name of Object.keys(ifaces)) {
      for (const iface of ifaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) candidates.add(iface.address);
      }
    }
  } catch {}
  if (process.env.APP_URL) {
    try {
      const u = new URL(process.env.APP_URL);
      if (u.hostname && u.hostname !== 'localhost') candidates.add(u.hostname);
    } catch {}
  }
  return Array.from(candidates);
}

const GO2RTC_HOST = process.env.GO2RTC_HOST || '127.0.0.1';
const GO2RTC_PORT = parseInt(process.env.GO2RTC_PORT || '1984', 10);

// ─── State global agar survive hot-reload Next.js ────────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var __go2rtcProc: ChildProcess | null;
  var __go2rtcStarting: boolean;
}
globalThis.__go2rtcProc     = globalThis.__go2rtcProc     ?? null;
globalThis.__go2rtcStarting = globalThis.__go2rtcStarting ?? false;

/** Return true jika go2rtc API sudah merespons. */
function isAlive(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://${GO2RTC_HOST}:${GO2RTC_PORT}/api`, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => { req.destroy(); resolve(false); });
    req.end();
  });
}

class Go2rtcService {
  private get proc(): ChildProcess | null  { return globalThis.__go2rtcProc; }
  private set proc(v: ChildProcess | null) { globalThis.__go2rtcProc = v; }
  private get starting(): boolean  { return globalThis.__go2rtcStarting; }
  private set starting(v: boolean) { globalThis.__go2rtcStarting = v; }

  private isReady   = false;
  private isSyncing = false;

  async startServer() {
    // Guard 1 — referensi proses masih hidup
    if (this.starting) {
      console.log('[go2rtc] already starting, skip.');
      return;
    }
    // Guard 2 — port sudah merespons (proses mungkin di-spawn sebelumnya)
    if (await isAlive()) {
      console.log('[go2rtc] port already alive, skip spawn.');
      this.isReady = true;
      return;
    }
    // Guard 3 — child process masih jalan
    if (this.proc && this.proc.exitCode === null) {
      console.log('[go2rtc] child process still running, skip.');
      return;
    }

    this.starting = true;
    try {
      const exePath = await ensureGo2rtc();
      console.log(`[go2rtc] Starting: ${exePath}`);

      const child = spawn(exePath, [], { cwd: process.cwd(), stdio: 'pipe' });
      this.proc = child;

      child.stdout?.on('data', (d) => { const m = d.toString().trim(); if (m) console.log(`[go2rtc] ${m}`); });
      child.stderr?.on('data', (d) => { const m = d.toString().trim(); if (m) console.error(`[go2rtc] ${m}`); });

      // Saat proses exit: bersihkan referensi saja, TIDAK ada auto-restart.
      // Kalau go2rtc mati, biarkan mati. User bisa restart manual via tombol reload.
      child.on('exit', (code) => {
        console.log(`[go2rtc] exited with code ${code}. No auto-restart.`);
        if (this.proc === child) {
          this.proc     = null;
          this.isReady  = false;
        }
      });

      // Tunggu API merespons (max 15 detik)
      let ok = false;
      for (let i = 0; i < 15; i++) {
        if (await isAlive()) { ok = true; break; }
        await new Promise((r) => setTimeout(r, 1000));
      }

      if (ok) {
        this.isReady = true;
        console.log('[go2rtc] ready.');
      } else {
        console.error('[go2rtc] did not respond in 15s.');
      }
    } catch (e) {
      console.error('[go2rtc] failed to start:', e);
      this.proc    = null;
      this.isReady = false;
    } finally {
      this.starting = false;
    }
  }

  async sync(input: CameraRecord | CameraRecord[]) {
    if (!this.isReady && !Array.isArray(input)) return;

    if (Array.isArray(input)) {
      if (this.isSyncing) return;
      this.isSyncing = true;
      try {
        const fs   = await import('fs/promises');
        const path = await import('path');

        let yaml = 'api:\n  listen: ":1984"\n\n';
        yaml    += 'rtsp:\n  listen: ":8554"\n\n';
        yaml    += 'webrtc:\n  listen: ":8555/tcp"\n  candidates:\n';
        for (const c of getWebRtcCandidates()) yaml += `    - ${c}\n`;
        yaml += '  ice_servers:\n    - urls:\n';
        yaml += '        - stun:stun.l.google.com:19302\n';
        yaml += '        - stun:stun1.l.google.com:19302\n';
        yaml += '        - stun:stun2.l.google.com:19302\n\n';
        yaml += 'stream:\n  origin_timeout: 60s\n\n';
        yaml += 'streams:\n';

        for (const cam of input) {
          if (cam.status === 'online' && cam.stream_url) {
            // Gunakan #input=rtsp/tcp (paksa transport TCP agar tidak terblokir firewall UDP),
            // #timeout=30 (timeout koneksi 30 detik), dan #backchannel=0 (matikan overhead backchannel audio)
            const url = `${cam.stream_url}#input=rtsp/tcp#timeout=30#backchannel=0`;
            yaml += `  camera-${cam.id}:\n    - ${url}\n`;
          }
        }

        await fs.writeFile(path.join(process.cwd(), 'go2rtc.yaml'), yaml);
        console.log(`[go2rtc] yaml written (${input.length} cameras).`);

        if (this.isReady) {
          console.log('[go2rtc] Config updated, restarting go2rtc to apply...');
          await this.restartApi();
        }
      } catch (e) {
        console.error('[go2rtc] sync failed:', e);
      } finally {
        this.isSyncing = false;
      }
    } else {
      if (input.status !== 'online' || !input.stream_url) return this.removeStream(input.id);
      return this.addStream(input.id, input.stream_url);
    }
  }

  async removeStream(id: number) {
    await new Promise<void>((resolve) => {
      const req = http.request({
        hostname: GO2RTC_HOST, port: GO2RTC_PORT,
        path: `/api/streams?src=camera-${id}`, method: 'DELETE',
      }, (res) => { res.on('data', () => {}); res.on('end', resolve); });
      req.on('error', () => resolve());
      req.end();
    });
  }

  private async addStream(id: number, url: string, retry = 3) {
    await new Promise<void>((resolve) => {
      const attempt = (left: number) => {
        const req = http.request({
          hostname: GO2RTC_HOST, port: GO2RTC_PORT,
          path: `/api/streams?name=camera-${id}&src=${encodeURIComponent(url)}`,
          method: 'PUT', timeout: 3000,
        }, (res) => {
          res.on('data', () => {});
          res.on('end', () => {
            if (res.statusCode === 200) console.log(`[go2rtc] registered camera-${id}`);
            resolve();
          });
        });
        req.on('error', async (e) => {
          if (left > 0) { await new Promise((r) => setTimeout(r, 1000)); attempt(left - 1); }
          else { console.error(`[go2rtc] add stream camera-${id} failed:`, e.message); resolve(); }
        });
        req.end();
      };
      attempt(retry);
    });
  }

  private async restartApi() {
    await new Promise<void>((resolve) => {
      const req = http.request({
        hostname: GO2RTC_HOST, port: GO2RTC_PORT,
        path: '/api/restart', method: 'POST',
      }, (res) => {
        res.on('data', () => {});
        res.on('end', () => {
          console.log('[go2rtc] Restart command executed.');
          resolve();
        });
      });
      req.on('error', (e) => {
        console.error('[go2rtc] Failed to restart go2rtc API:', e.message);
        resolve();
      });
      req.end();
    });
  }

  stop() {
    if (this.proc) { this.proc.kill(); this.proc = null; this.isReady = false; }
  }
}

export const go2rtcService = new Go2rtcService();
