import { AppError } from '@/lib/errors/appError';
import {
  SettingsRecord,
  SettingsRepository,
} from '@/lib/repositories/settingsRepository';

function asString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(`${field} is required`, 400);
  }
  return value.trim();
}

function asBooleanNumber(value: unknown, field: string): number {
  if (typeof value !== 'boolean') {
    throw new AppError(`${field} must be a boolean`, 400);
  }
  return value ? 1 : 0;
}

export class SettingsService {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  getSettings(): SettingsRecord {
    return this.settingsRepository.getSettings();
  }

  updateSettings(input: Record<string, unknown>): SettingsRecord {
    return this.settingsRepository.updateSettings({
      system_language: asString(input.system_language, 'System language'),
      time_zone: asString(input.time_zone, 'Time zone'),
      date_format: asString(input.date_format, 'Date format'),
      default_resolution: asString(input.default_resolution, 'Default resolution'),
      frame_rate: asString(input.frame_rate, 'Frame rate'),
      night_mode: asBooleanNumber(input.night_mode, 'Night mode'),
      motion_detection: asBooleanNumber(input.motion_detection, 'Motion detection'),
      static_ip: asString(input.static_ip, 'Static IP'),
      port: asString(input.port, 'Port'),
    });
  }
}

export const settingsService = new SettingsService(new SettingsRepository());
