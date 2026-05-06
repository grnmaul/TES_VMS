const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(process.cwd(), 'vms.db'));

// Set all existing cameras to have ai_enabled = 0
db.prepare('UPDATE cameras SET ai_enabled = 0').run();

const count = db.prepare('SELECT COUNT(*) as count FROM cameras WHERE ai_enabled = 1').get();
console.log('Cameras with AI enabled:', count.count);
