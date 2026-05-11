import { getDatabase } from '@/lib/db';

export type NotificationType = 'warning' | 'error' | 'success' | 'info';

export interface NotificationRecord {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  target_role: string;
  timestamp: string;
  is_read: number;
}

export class NotificationRepository {
  listAll(limit?: number, offset?: number, role?: string): NotificationRecord[] {
    const db = getDatabase();
    
    let query = 'SELECT * FROM notifications';
    const params: any[] = [];

    if (role) {
      query += ' WHERE target_role = ? OR target_role = \'all\'';
      params.push(role);
    }

    query += ' ORDER BY timestamp DESC';

    if (limit !== undefined && offset !== undefined) {
      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }
    
    return db.prepare(query).all(...params) as NotificationRecord[];
  }

  create(title: string, message: string, type: NotificationType, targetRole: string = 'all'): NotificationRecord {
    const db = getDatabase();
    const result = db
      .prepare('INSERT INTO notifications (title, message, type, target_role) VALUES (?, ?, ?, ?)')
      .run(title, message, type, targetRole);

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

  deleteById(id: number): number {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM notifications WHERE id = ?').run(id);
    return result.changes;
  }

  markAsRead(id: number): number {
    const db = getDatabase();
    const result = db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
    return result.changes;
  }
}
