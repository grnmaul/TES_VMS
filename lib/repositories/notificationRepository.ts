import { getDatabase } from '@/lib/db';

export type NotificationType = 'warning' | 'error' | 'success' | 'info';

export interface NotificationRecord {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  is_read: number;
}

export class NotificationRepository {
  listAll(): NotificationRecord[] {
    const db = getDatabase();
    return db
      .prepare('SELECT * FROM notifications ORDER BY timestamp DESC')
      .all() as NotificationRecord[];
  }

  create(title: string, message: string, type: NotificationType): NotificationRecord {
    const db = getDatabase();
    const result = db
      .prepare('INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)')
      .run(title, message, type);

    return db
      .prepare('SELECT * FROM notifications WHERE id = ?')
      .get(result.lastInsertRowid) as NotificationRecord;
  }

  markAllAsRead(): number {
    const db = getDatabase();
    const result = db.prepare('UPDATE notifications SET is_read = 1 WHERE is_read = 0').run();
    return result.changes;
  }

  clearAll(): number {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM notifications').run();
    return result.changes;
  }
}
