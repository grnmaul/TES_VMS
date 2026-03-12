import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

let db: Database.Database | null = null;

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
        stream_url TEXT
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        message TEXT,
        type TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_read INTEGER DEFAULT 0
      );
    `);

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
      const cameras = [
        {
          name: 'Jembatan Lawu',
          location: 'Jl. Lawu',
          ip_address: '192.168.1.101',
          status: 'online',
        },
        {
          name: 'Sleko Arah Tugu',
          location: 'Jl. Sleko',
          ip_address: '192.168.1.102',
          status: 'online',
        },
        {
          name: 'MT Haryono Sumber Karya',
          location: 'Jl. MT Haryono',
          ip_address: '192.168.1.103',
          status: 'offline',
        },
        {
          name: 'Penyebrangan Kasih Sayang PSC',
          location: 'Pahlawan Street Center',
          ip_address: '192.168.1.104',
          status: 'online',
        },
      ];
      const insert = db.prepare(
        'INSERT INTO cameras (name, location, ip_address, status) VALUES (?, ?, ?, ?)'
      );
      cameras.forEach((c) =>
        insert.run(c.name, c.location, c.ip_address, c.status)
      );
    }
  }

  return db;
}
