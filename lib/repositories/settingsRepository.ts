import { getDatabase } from '@/lib/db';

export interface SettingsRecord {
  system_language: string;
  time_zone: string;
  date_format: string;
  default_resolution: string;
  frame_rate: string;
  night_mode: number;
  motion_detection: number;
  static_ip: string;
  port: string;
  email_alerts: number;
  push_notifications: number;
  alert_sensitivity: string;
}

export class SettingsRepository {
  getSettings(): SettingsRecord {
    const db = getDatabase();
    return db
      .prepare(
        `SELECT
          system_language,
          time_zone,
          date_format,
          default_resolution,
          frame_rate,
          night_mode,
          motion_detection,
          static_ip,
          port,
          email_alerts,
          push_notifications,
          alert_sensitivity
        FROM system_settings WHERE id = 1`
      )
      .get() as SettingsRecord;
  }

  updateSettings(payload: SettingsRecord): SettingsRecord {
    const db = getDatabase();
    db.prepare(
      `UPDATE system_settings
       SET system_language = ?,
           time_zone = ?,
           date_format = ?,
           default_resolution = ?,
           frame_rate = ?,
           night_mode = ?,
           motion_detection = ?,
           static_ip = ?,
           port = ?,
           email_alerts = ?,
           push_notifications = ?,
           alert_sensitivity = ?
       WHERE id = 1`
    ).run(
      payload.system_language,
      payload.time_zone,
      payload.date_format,
      payload.default_resolution,
      payload.frame_rate,
      payload.night_mode,
      payload.motion_detection,
      payload.static_ip,
      payload.port,
      payload.email_alerts,
      payload.push_notifications,
      payload.alert_sensitivity
    );

    return this.getSettings();
  }
}
