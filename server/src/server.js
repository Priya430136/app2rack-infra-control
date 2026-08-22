const fs = require('fs');
const path = require('path');
const app = require('./app');
const { pool } = require('./database');

const PORT = process.env.PORT || 5000;

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'database', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`Applying migration: ${file}`);
    await pool.query(sql);
  }
}

async function start() {
  await runMigrations();
  const server = app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });

  process.on('unhandledRejection', (err) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
  });
}

start().catch((err) => {
  console.error('Server startup failed:', err.message);
  process.exit(1);
});
