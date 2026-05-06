const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(process.cwd(), 'vms.db'));
const cameras = db.prepare('SELECT id, name, status, ai_enabled FROM cameras').all();
console.log(JSON.stringify(cameras, null, 2));
