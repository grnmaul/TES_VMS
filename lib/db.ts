import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

let db: Database.Database | null = null;

function hasColumn(database: Database.Database, table: string, column: string): boolean {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all() as Array<{
    name: string;
  }>;
  return columns.some((item) => item.name === column);
}

export function getDatabase() {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'vms.db');
    db = new Database(dbPath);

    // Initialize Database
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'user',
        full_name TEXT
      );

      CREATE TABLE IF NOT EXISTS cameras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        location TEXT,
        ip_address TEXT,
        status TEXT DEFAULT 'online',
        stream_url TEXT,
        hls_url TEXT
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        message TEXT,
        type TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_read INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        system_language TEXT DEFAULT 'Bahasa Indonesia',
        time_zone TEXT DEFAULT '(UTC+07:00) Bangkok, Hanoi, Jakarta',
        date_format TEXT DEFAULT 'DD/MM/YYYY',
        default_resolution TEXT DEFAULT '1080p (1920 x 1080)',
        frame_rate TEXT DEFAULT '30 FPS',
        night_mode INTEGER DEFAULT 1,
        motion_detection INTEGER DEFAULT 1,
        static_ip TEXT DEFAULT '192.168.1.100',
        port TEXT DEFAULT '8080'
      );
    `);

    if (!hasColumn(db, 'cameras', 'hls_url')) {
      db.exec('ALTER TABLE cameras ADD COLUMN hls_url TEXT');
    }

    // Seed initial admin if not exists
    const adminExists = db
      .prepare('SELECT * FROM users WHERE username = ?')
      .get('admin');
    if (!adminExists) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      db.prepare(
        'INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)'
      ).run('admin', hashedPassword, 'admin', 'System Administrator');
    }

    // Seed initial user if not exists
    const userExists = db.prepare('SELECT * FROM users WHERE username = ?').get('user');
    if (!userExists) {
      const hashedPassword = bcrypt.hashSync('user123', 10);
      db.prepare(
        'INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)'
      ).run('user', hashedPassword, 'user', 'Regular User');
    }

    // Seed some cameras if empty
    const cameraCount = db.prepare('SELECT COUNT(*) as count FROM cameras').get() as {
      count: number;
    };
    if (cameraCount.count === 0) {
      // Empty logic: cameras should only be added manually via admin panel.
    }

    const settingsCount = db
      .prepare('SELECT COUNT(*) as count FROM system_settings')
      .get() as { count: number };
    if (settingsCount.count === 0) {
      db.prepare('INSERT INTO system_settings (id) VALUES (1)').run();
    }
  }

  return db;
}
