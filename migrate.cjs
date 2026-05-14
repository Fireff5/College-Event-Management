require('dotenv').config({ path: require('path').join(__dirname, 'backend', '.env') });
const { Pool } = require('pg');
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'sports_meet',
    password: process.env.DB_PASSWORD || 'pamjap123@',
    port: process.env.DB_PORT || 5432,
});

async function migrate() {
    try {
        console.log('Testing DB Connection...');
        const res1 = await pool.query('SELECT NOW()');
        console.log('Connected:', res1.rows[0]);

        console.log('Checking uploads directory...');
        const fs = require('fs');
        const path = require('path');
        const uploadDir = path.join(__dirname, 'backend', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log('Created uploads directory.');
        } else {
            console.log('Uploads directory exists.');
        }

        console.log('Altering results table...');
        await pool.query('ALTER TABLE results ADD COLUMN IF NOT EXISTS document_url VARCHAR(255)');
        console.log('Successfully added document_url column.');

        console.log('Altering participants table...');
        await pool.query('ALTER TABLE participants ADD COLUMN IF NOT EXISTS institute VARCHAR(255)');
        console.log('Successfully added institute column.');

        process.exit(0);
    } catch (e) {
        console.error('Migration Error:', e);
        process.exit(1);
    }
}
migrate();
