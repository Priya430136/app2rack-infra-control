const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const required = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required database environment variable(s): ${missing.join(', ')}`);
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 20,
  idleTimeoutMillis: 30000,
  // Generous enough to survive a Docker Postgres container that is still starting up.
  connectionTimeoutMillis: 10000,
});

// Test connection (does not crash the process on failure - just logs, so the
// server can still boot and retry on the next query once Postgres is reachable).
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

// A broken idle client should be dropped, not take the whole process down with it.
// The pool transparently opens a new connection on the next query.
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
