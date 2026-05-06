/**
 * Run: node database/migrate.js
 * Creates all tables in the PostgreSQL database.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl) {
  try {
    const u = new URL(dbUrl);
    u.searchParams.delete('channel_binding');
    u.searchParams.delete('uselibpqcompat');
    dbUrl = u.toString();
  } catch (e) {
    console.error('Failed to parse DATABASE_URL:', e.message);
  }
}

const pool = new Pool(
  dbUrl
    ? {
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      }
);

async function migrate() {
  const client = await pool.connect();
  try {
    // Read schema (skip the CREATE DATABASE and \c lines — they don't work via node-postgres)
    let schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    schema = schema
      .split('\n')
      .filter(line => !line.startsWith('CREATE DATABASE') && !line.startsWith('\\c'))
      .join('\n');

    console.log('Running migrations...');
    await client.query(schema);
    console.log('✅ Schema applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
