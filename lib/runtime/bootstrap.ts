import { wsHub } from '@/lib/realtime/wsHub';
import { cameraHealthService } from '@/lib/health/cameraHealthService';

let bootstrapped = false;

export function ensureRuntimeBootstrapped() {
  if (bootstrapped) {
    return;
  }

  wsHub.ensureStarted();
  cameraHealthService.start();
  bootstrapped = true;
}
