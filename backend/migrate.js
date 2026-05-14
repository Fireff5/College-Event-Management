// migrate.js - run once to apply all missing schema changes
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'sports_meet',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function run() {
    const sql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
    // Split on semicolons to run statement-by-statement (ignore empty)
    const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
    const client = await pool.connect();
    try {
        for (const stmt of statements) {
            try {
                await client.query(stmt);
                console.log('OK:', stmt.slice(0, 60).replace(/\s+/g, ' '));
            } catch (e) {
                console.warn('WARN (skipping):', e.message, '\n  Statement:', stmt.slice(0, 80));
            }
        }
        console.log('\n✅ Schema migration complete.');
    } finally {
        client.release();
        await pool.end();
    }
}

run().catch(err => {
    console.error('Migration failed:', err.message);
    process.exit(1);
});
