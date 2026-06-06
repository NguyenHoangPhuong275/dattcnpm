const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'src', 'database', 'dattcnpm954_db.db');
const db = new DatabaseSync(dbPath);

const sql = process.argv[2];
if (!sql) {
  console.error('Please provide SQL statements');
  process.exit(1);
}

try {
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(sql);
  console.log('SQL executed successfully.');
} catch (error) {
  console.error('Error executing SQL:', error);
  process.exit(1);
} finally {
  db.close();
}
