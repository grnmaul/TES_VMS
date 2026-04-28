import { wsHub } from '@/lib/realtime/wsHub';
import { cameraHealthService } from '@/lib/health/cameraHealthService';
import { go2rtcService } from '@/lib/stream/go2rtcService';

export function ensureRuntimeBootstrapped() {
  if ((globalThis as any).__bootstrapped) {
    return;
  }

  (globalThis as any).__bootstrapped = true;

  wsHub.ensureStarted();
  go2rtcService.startServer();
  cameraHealthService.start();
}
