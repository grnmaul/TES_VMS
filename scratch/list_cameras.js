import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'vms.db');
const db = new Database(dbPath);

const cameras = db.prepare('SELECT id, name, stream_url FROM cameras').all();
console.log(JSON.stringify(cameras, null, 2));
db.close();
