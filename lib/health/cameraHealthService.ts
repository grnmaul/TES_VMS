import net from 'net';
import { CameraRepository, CameraStatus } from '@/lib/repositories/cameraRepository';
import { wsHub } from '@/lib/realtime/wsHub';
import { rtspToHlsService } from '@/lib/stream/rtspToHlsService';

const HEALTH_INTERVAL_MS = 15000;
const HEALTH_TIMEOUT_MS = 2500;

function parseHostPort(ipAddress: string): { host: string; port: number } {
  const [host, portText] = ipAddress.split(':');
  const port = Number(portText || '554');
  return { host, port: Number.isFinite(port) ? port : 554 };
}

async function probeCamera(ipAddress: string): Promise<CameraStatus> {
  const { host, port } = parseHostPort(ipAddress);

  return await new Promise<CameraStatus>((resolve) => {
    const socket = net.createConnection({ host, port });
    let completed = false;
    const finish = (status: CameraStatus) => {
      if (completed) return;
      completed = true;
      try {
        socket.destroy();
      } catch (error) {
        console.error(`[v0] Error destroying socket for ${host}:${port}:`, error instanceof Error ? error.message : error);
      }
      resolve(status);
    };

    socket.setTimeout(HEALTH_TIMEOUT_MS);
    socket.on('connect', () => finish('online'));
    socket.on('timeout', () => finish('offline'));
    socket.on('error', (error) => {
      console.debug(`[v0] Camera probe error for ${host}:${port}:`, error.message);
      finish('offline');
    });
  });
}

class CameraHealthService {
  private readonly cameraRepository = new CameraRepository();
  private started = false;

  start() {
    if (this.started) return;
    this.started = true;
    this.runCycle();
    setInterval(() => this.runCycle(), HEALTH_INTERVAL_MS);
  }

  private async runCycle() {
    try {
      const cameras = this.cameraRepository.listAll();
      await Promise.all(
        cameras.map(async (camera) => {
          try {
            const realStatus = await probeCamera(camera.ip_address);
            if (realStatus !== camera.status) {
              const updated = this.cameraRepository.updateStatus(camera.id, realStatus);
              if (updated) {
                rtspToHlsService.sync(updated);
                wsHub.broadcast({ type: 'camera:health', payload: updated });
              }
              return;
            }
            rtspToHlsService.sync(camera);
          } catch (error) {
            console.error(`[v0] Error probing camera ${camera.id}:`, error instanceof Error ? error.message : error);
          }
        })
      );
    } catch (error) {
      console.error('[v0] Error in camera health check cycle:', error instanceof Error ? error.message : error);
    }
  }
}

export const cameraHealthService = new CameraHealthService();
