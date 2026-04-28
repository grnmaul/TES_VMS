import { spawn, ChildProcess } from 'child_process';
import { ensureGo2rtc } from './go2rtcDownloader';
import { CameraRecord } from '@/lib/repositories/cameraRepository';
import http from 'http';
import path from 'path';

class Go2rtcService {
  private process: ChildProcess | null = null;
  private isReady = false;

  async startServer() {
    if (this.process) return;

    try {
      const exePath = await ensureGo2rtc();
      
      // Start go2rtc
      // By default it looks for go2rtc.yaml in the CWD, but it can run without it.
      // API runs on 1984 by default. WebRTC runs on 8555.
      this.process = spawn(exePath, [], {
        cwd: path.dirname(exePath),
        stdio: 'ignore'
      });

      this.process.on('exit', () => {
        this.process = null;
        this.isReady = false;
        console.log('[go2rtc] Process exited');
      });

      // Wait a bit for the server to start
      await new Promise(resolve => setTimeout(resolve, 2000));
      this.isReady = true;
      console.log('[go2rtc] Server running');
    } catch (e) {
      console.error('[go2rtc] Failed to start:', e);
    }
  }

  async sync(camera: CameraRecord) {
    if (!this.isReady) return;

    if (camera.status !== 'online' || !camera.stream_url) {
      await this.removeStream(camera.id);
      return;
    }

    await this.addStream(camera.id, camera.stream_url);
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
        res.on('end', resolve);
      });
      req.on('error', resolve); // ignore errors if it doesn't exist
      req.end();
    });
  }

  async addStream(cameraId: number, url: string) {
    return new Promise<void>((resolve) => {
      // Add or replace stream in go2rtc
      const req = http.request({
        hostname: '127.0.0.1',
        port: 1984,
        path: `/api/streams?name=camera-${cameraId}&src=${encodeURIComponent(url)}`,
        method: 'PUT'
      }, (res) => {
        res.on('data', () => {});
        res.on('end', resolve);
      });
      req.on('error', (e) => {
        console.error('[go2rtc] Error adding stream:', e);
        resolve();
      });
      req.end();
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
