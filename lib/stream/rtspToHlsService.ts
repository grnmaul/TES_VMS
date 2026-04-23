import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import fs from 'fs';
import path from 'path';
import { CameraRecord, CameraRepository } from '@/lib/repositories/cameraRepository';
import { wsHub } from '@/lib/realtime/wsHub';

function isRtspUrl(value: string | null): value is string {
  return typeof value === 'string' && value.trim().toLowerCase().startsWith('rtsp://');
}

class RtspToHlsService {
  private readonly processes = new Map<number, ChildProcessWithoutNullStreams>();
  private readonly cameraRepository = new CameraRepository();

  sync(camera: CameraRecord) {
    if (camera.status !== 'online' || !isRtspUrl(camera.stream_url)) {
      this.stop(camera.id);
      if (camera.hls_url) {
        const updated = this.cameraRepository.updateHlsUrl(camera.id, null);
        if (updated) {
          wsHub.broadcast({ type: 'camera:updated', payload: updated });
        }
      }
      return;
    }

    this.start(camera);
  }

  stop(cameraId: number) {
    const current = this.processes.get(cameraId);
    if (current) {
      current.kill('SIGTERM');
      this.processes.delete(cameraId);
    }
  }

  private start(camera: CameraRecord) {
    if (this.processes.has(camera.id)) {
      return;
    }

    const outputDir = path.join(process.cwd(), 'public', 'hls', `camera-${camera.id}`);
    fs.mkdirSync(outputDir, { recursive: true });
    const playlistPath = path.join(outputDir, 'index.m3u8');

    const ffmpeg = spawn(
      'ffmpeg',
      [
        '-rtsp_transport',
        'tcp',
        '-i',
        camera.stream_url as string,
        '-fflags',
        'nobuffer',
        '-an',
        '-c:v',
        'libx264',
        '-preset',
        'ultrafast',
        '-tune',
        'zerolatency',
        '-f',
        'hls',
        '-hls_time',
        '2',
        '-hls_list_size',
        '6',
        '-hls_flags',
        'delete_segments+append_list',
        '-y',
        playlistPath,
      ],
      { stdio: 'ignore' }
    );

    this.processes.set(camera.id, ffmpeg);
    const hlsUrl = `/hls/camera-${camera.id}/index.m3u8`;
    const updated = this.cameraRepository.updateHlsUrl(camera.id, hlsUrl);
    if (updated) {
      wsHub.broadcast({ type: 'camera:updated', payload: updated });
    }

    ffmpeg.on('error', () => {
      this.processes.delete(camera.id);
      const fallback = this.cameraRepository.updateHlsUrl(camera.id, null);
      if (fallback) {
        wsHub.broadcast({ type: 'camera:updated', payload: fallback });
      }
    });

    ffmpeg.on('exit', () => {
      this.processes.delete(camera.id);
    });
  }
}

export const rtspToHlsService = new RtspToHlsService();
