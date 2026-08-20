const fs = require('fs');
const path = require('path');
const { pool } = require('./index');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function runMigrations() {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`Applying migration: ${file}`);
    await pool.query(sql);
  }

  console.log(`Done. Applied ${files.length} migration file(s).`);
  await pool.end();
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
