const { Pool } = require('pg');

// Trust auth is active now - no password needed
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    port: 5432,
});

async function run() {
    const client = await pool.connect();
    try {
        // 1. Reset password
        await client.query("ALTER USER postgres PASSWORD 'pamjap123@'");
        console.log('✅ Password reset to pamjap123@');

        // 2. Create database if missing
        const dbCheck = await client.query("SELECT 1 FROM pg_database WHERE datname='sports_meet'");
        if (dbCheck.rows.length === 0) {
            await client.query('CREATE DATABASE sports_meet');
            console.log('✅ Created database sports_meet');
        } else {
            console.log('ℹ️  Database sports_meet already exists');
        }
    } finally {
        client.release();
        await pool.end();
    }
}

run().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
