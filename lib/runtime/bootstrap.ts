import { wsHub } from '@/lib/realtime/wsHub';
import { cameraHealthService } from '@/lib/health/cameraHealthService';
import { go2rtcService } from '@/lib/stream/go2rtcService';
import { getDatabase } from '@/lib/db';
import { storagePurgeService } from '@/lib/services/storagePurgeService';

export function ensureRuntimeBootstrapped() {
  if (!(globalThis as any).__bootstrapped) {
    (globalThis as any).__bootstrapped = true;
    wsHub.ensureStarted();
    cameraHealthService.start();
    storagePurgeService.start();
  }
  
  // Selalu pastikan go2rtc berjalan (jika mati/ter-interrupt, langsung spawn lagi)
  go2rtcService.startServer();

  // Batasi sync ke go2rtc maksimal 1x per 30 detik agar tidak spam write yaml
  const now = Date.now();
  const lastSync: number = (globalThis as any).__lastGo2rtcSync || 0;
  if (now - lastSync > 30_000) {
    (globalThis as any).__lastGo2rtcSync = now;
    syncCamerasToGo2rtc();
  }
}

async function syncCamerasToGo2rtc() {
  try {
    const db = getDatabase();
    const cameras = db.prepare("SELECT * FROM cameras WHERE status = 'online'").all() as any[];
    // We await here during bootstrap to ensure go2rtc.yaml is written before server starts
    await go2rtcService.sync(cameras);
    await go2rtcService.startServer();
  } catch (err) {
    console.error('[bootstrap] go2rtc synchronization failed:', err);
  }
}
