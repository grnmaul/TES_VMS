import net from 'net';
import { CameraRepository, CameraStatus } from '@/lib/repositories/cameraRepository';
import { wsHub } from '@/lib/realtime/wsHub';
import { go2rtcService } from '@/lib/stream/go2rtcService';

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
      socket.destroy();
      resolve(status);
    };

    socket.setTimeout(HEALTH_TIMEOUT_MS);
    socket.on('connect', () => finish('online'));
    socket.on('timeout', () => finish('offline'));
    socket.on('error', () => finish('offline'));
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
    const cameras = this.cameraRepository.listAll();
    await Promise.all(
      cameras.map(async (camera) => {
        const realStatus = await probeCamera(camera.ip_address);
        if (realStatus !== camera.status) {
          const updated = this.cameraRepository.updateStatus(camera.id, realStatus);
          if (updated) {
            go2rtcService.sync(updated);
            wsHub.broadcast({ type: 'camera:health', payload: updated });
          }
          return;
        }
        go2rtcService.sync(camera);
      })
    );
  }
}

export const cameraHealthService = new CameraHealthService();
