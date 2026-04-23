import { getDatabase } from '@/lib/db';

export interface UserRecord {
  id: number;
  username: string;
  password: string;
  role: string;
  full_name: string | null;
}

export class AuthRepository {
  findByUsername(username: string): UserRecord | undefined {
    const db = getDatabase();
    return db
      .prepare('SELECT id, username, password, role, full_name FROM users WHERE username = ?')
      .get(username) as UserRecord | undefined;
  }

  createUser(username: string, hashedPassword: string, fullName: string): number {
    const db = getDatabase();
    const result = db
      .prepare('INSERT INTO users (username, password, full_name) VALUES (?, ?, ?)')
      .run(username, hashedPassword, fullName);

    return Number(result.lastInsertRowid);
  }
}
