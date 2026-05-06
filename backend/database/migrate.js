/**
 * Run: node database/migrate.js
 * Creates all tables in the PostgreSQL database.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const isNeon = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech');

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: isNeon ? { rejectUnauthorized: false } : false,
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
