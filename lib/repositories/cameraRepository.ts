import { getDatabase } from '@/lib/db';

export type CameraStatus = 'online' | 'offline';

export interface CameraRecord {
  id: number;
  name: string;
  location: string;
  ip_address: string;
  stream_url: string | null;
  status: CameraStatus;
}

export interface CameraPayload {
  name: string;
  location: string;
  ip_address: string;
  stream_url: string | null;
  status: CameraStatus;
}

export class CameraRepository {
  listAll(): CameraRecord[] {
    const db = getDatabase();
    return db.prepare('SELECT * FROM cameras').all() as CameraRecord[];
  }

  create(payload: CameraPayload): CameraRecord {
    const db = getDatabase();
    const result = db
      .prepare(
        'INSERT INTO cameras (name, location, ip_address, stream_url, status) VALUES (?, ?, ?, ?, ?)'
      )
      .run(
        payload.name,
        payload.location,
        payload.ip_address,
        payload.stream_url,
        payload.status
      );

    return db
      .prepare('SELECT * FROM cameras WHERE id = ?')
      .get(result.lastInsertRowid) as CameraRecord;
  }

  update(id: number, payload: CameraPayload): CameraRecord | null {
    const db = getDatabase();
    const result = db
      .prepare(
        'UPDATE cameras SET name = ?, location = ?, ip_address = ?, stream_url = ?, status = ? WHERE id = ?'
      )
      .run(
        payload.name,
        payload.location,
        payload.ip_address,
        payload.stream_url,
        payload.status,
        id
      );

    if (result.changes === 0) {
      return null;
    }

    return db.prepare('SELECT * FROM cameras WHERE id = ?').get(id) as CameraRecord;
  }

  delete(id: number): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM cameras WHERE id = ?').run(id);
    return result.changes > 0;
  }
}
