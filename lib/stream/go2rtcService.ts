import { spawn, ChildProcess } from 'child_process';
import { ensureGo2rtc } from './go2rtcDownloader';
import { CameraRecord } from '@/lib/repositories/cameraRepository';
import http from 'http';
import path from 'path';

class Go2rtcService {
  private process: ChildProcess | null = null;
  private isReady = false;
  private isStarting = false;
  private isSyncing = false;

  async startServer() {
    if (this.process || this.isStarting) {
      return;
    }

    this.isStarting = true;

    try {
      // Clean up any stray go2rtc processes first
      this.stop();
      
      if (process.platform === 'win32') {
        try { spawn('taskkill', ['/F', '/IM', 'go2rtc.exe']); } catch(e) {}
      } else {
        try { spawn('pkill', ['-9', 'go2rtc']); } catch(e) {}
      }
      await new Promise(resolve => setTimeout(resolve, 1000));

      const exePath = await ensureGo2rtc();
      console.log(`[go2rtc] Starting server from: ${exePath}`);
      
      this.process = spawn(exePath, [], {
        cwd: process.cwd(),
        stdio: 'pipe'
      });

      this.process.stdout?.on('data', (data) => {
        const msg = data.toString().trim();
        if (msg) console.log(`[go2rtc] ${msg}`);
      });

      this.process.stderr?.on('data', (data) => {
        const msg = data.toString().trim();
        if (msg) console.error(`[go2rtc-err] ${msg}`);
      });

      this.process.on('exit', (code) => {
        this.process = null;
        this.isReady = false;
        console.log(`[go2rtc] Process exited with code ${code}`);
      });

      // Wait for server to initialize and respond to health check
      let attempts = 0;
      while (attempts < 10) {
        try {
          await new Promise((resolve, reject) => {
            const req = http.get('http://127.0.0.1:1984/api', (res) => {
              if (res.statusCode === 200) resolve(true);
              else reject();
            });
            req.on('error', reject);
            req.end();
          });
          console.log('[go2rtc] Server is now responding on API port');
          break;
        } catch (e) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      this.isReady = true;
      this.isStarting = false;
      console.log('[go2rtc] Server is now ready for streams');
    } catch (e) {
      console.error('[go2rtc] Critical failure starting server:', e);
      this.process = null;
      this.isReady = false;
      this.isStarting = false;
    }
  }

  async sync(input: CameraRecord | CameraRecord[]) {
    if (!this.isReady && !Array.isArray(input)) return;

    if (Array.isArray(input)) {
      // For bulk sync, we write directly to the yaml file before/during startup
      // But if server is already running, we use sequential API calls safely
      if (this.isSyncing) return;
      this.isSyncing = true;
      try {
        console.log(`[go2rtc] Syncing ${input.length} cameras...`);
        
        // Write to YAML file for persistence and stability
        const fs = await import('fs/promises');
        const path = await import('path');
        let yamlContent = 'streams:\n';
        
        for (const camera of input) {
          if (camera.status === 'online' && camera.stream_url) {
            yamlContent += `  camera-${camera.id}:\n    - ${camera.stream_url}\n`;
          }
        }
        
        await fs.writeFile(path.join(process.cwd(), 'go2rtc.yaml'), yamlContent);
        
        // If server is already running, we still need to notify it via API for immediate effect
        // but we do it slowly to avoid corruption since we already updated the file
        if (this.isReady) {
          for (const camera of input) {
            if (camera.status !== 'online' || !camera.stream_url) {
              await this.removeStream(camera.id);
            } else {
              await this.addStream(camera.id, camera.stream_url);
            }
          }
        }
        console.log('[go2rtc] Synchronization complete');
      } catch (err) {
        console.error('[go2rtc] Sync failed:', err);
      } finally {
        this.isSyncing = false;
      }
    } else {
      // Individual camera sync (always via API)
      if (input.status !== 'online' || !input.stream_url) {
        return this.removeStream(input.id);
      }
      return this.addStream(input.id, input.stream_url);
    }
  }

  async removeStream(cameraId: number) {
    return new Promise<void>((resolve) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port: 1984,
        path: `/api/streams?src=camera-${cameraId}`,
        method: 'DELETE'
      }, (res) => {
        res.on('data', () => {});
        res.on('end', () => resolve());
      });
      req.on('error', () => resolve());
      req.end();
    });
  }

  async addStream(cameraId: number, url: string, retryCount = 3) {
    return new Promise<void>((resolve) => {
      const tryAdd = (remaining: number) => {
        let body = '';
        const req = http.request({
          hostname: '127.0.0.1',
          port: 1984,
          path: `/api/streams?name=camera-${cameraId}&src=${encodeURIComponent(url)}`,
          method: 'PUT',
          timeout: 3000 // Reduce timeout to 3s
        }, (res) => {
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => {
            if (res.statusCode === 200) {
              console.log(`[go2rtc] Registered camera-${cameraId}`);
            } else {
              console.error(`[go2rtc] Failed to register camera-${cameraId}: HTTP ${res.statusCode} - ${body}`);
            }
            resolve();
          });
        });

        req.on('error', async (e) => {
          if (remaining > 0) {
            console.warn(`[go2rtc] Retry registering camera-${cameraId} (${remaining} left)...`);
            await new Promise(r => setTimeout(r, 1000));
            tryAdd(remaining - 1);
          } else {
            console.error(`[go2rtc] Connection error registering camera-${cameraId}:`, e.message);
            resolve();
          }
        });
        req.end();
      };

      tryAdd(retryCount);
    });
  }

  stop() {
    if (this.process) {
      this.process.kill();
      this.process = null;
      this.isReady = false;
    }
  }
}

export const go2rtcService = new Go2rtcService();
