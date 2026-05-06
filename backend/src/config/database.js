const { Pool } = require('pg');
require('dotenv').config();

let dbUrl = process.env.DATABASE_URL || '';

// Remove parameters not supported by pg (channel_binding, etc.)
if (dbUrl) {
  try {
    const u = new URL(dbUrl);
    u.searchParams.delete('channel_binding');
    u.searchParams.delete('uselibpqcompat');
    dbUrl = u.toString();
  } catch (e) {
    console.error('Failed to parse DATABASE_URL:', e.message);
  }
  console.log('DB host:', new URL(dbUrl).hostname);
}

const isNeon = dbUrl.includes('neon.tech');

const pool = new Pool(
  dbUrl
    ? {
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'osaid_barber',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
);

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('Query executed:', { text: text.substring(0, 80), duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
