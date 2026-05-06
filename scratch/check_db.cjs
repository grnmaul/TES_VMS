const sqlite3 = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'vms.db');
const db = new sqlite3(dbPath);

const cameras = db.prepare("SELECT id, name, stream_url FROM cameras WHERE status = 'online'").all();

console.log('Online Cameras:');
cameras.forEach(c => {
  console.log(`ID: ${c.id} | Name: ${c.name} | URL: ${c.stream_url}`);
});
