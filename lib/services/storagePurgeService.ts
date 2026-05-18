import fs from 'fs';
import path from 'path';
import { SettingsRepository } from '@/lib/repositories/settingsRepository';

const PURGE_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const RECORDINGS_DIR = path.join(process.cwd(), 'public', 'recordings');

class StoragePurgeService {
  private started = false;
  private settingsRepository = new SettingsRepository();

  start() {
    if (this.started) return;
    this.started = true;
    
    // Ensure recordings directory exists
    if (!fs.existsSync(RECORDINGS_DIR)) {
      fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
    }

    this.runCycle();
    setInterval(() => this.runCycle(), PURGE_INTERVAL_MS);
  }

  private async runCycle() {
    try {
      const settings = this.settingsRepository.getSettings();
      if (settings.auto_purge !== 1) {
        return; // Auto purge is disabled
      }

      const retentionDays = settings.retention_days || 30;
      const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);

      if (fs.existsSync(RECORDINGS_DIR)) {
        const files = await fs.promises.readdir(RECORDINGS_DIR);
        
        for (const file of files) {
          const filePath = path.join(RECORDINGS_DIR, file);
          const stats = await fs.promises.stat(filePath);

          if (stats.isFile() && stats.mtimeMs < cutoffTime) {
            await fs.promises.unlink(filePath);
            console.log(`[StoragePurge] Auto-purged old recording: ${file}`);
          }
        }
      }
    } catch (err) {
      console.error('[StoragePurge] Error during purge cycle:', err);
    }
  }
}

export const storagePurgeService = new StoragePurgeService();
