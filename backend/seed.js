/**
 * seed.js — populate sports_meet with sample data from the old mock store
 * Run once:  node seed.js
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'sports_meet',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function seed() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // ── Events ──────────────────────────────────────────────────────────
        const eventRows = [
            { name: '100m Sprint', category: 'Track', date: '2026-04-10', venue: 'Main Stadium', max_participants: 8 },
            { name: 'Long Jump', category: 'Field', date: '2026-04-11', venue: 'Field Arena', max_participants: 12 },
            { name: '4x100m Relay', category: 'Track', date: '2026-04-12', venue: 'Main Stadium', max_participants: 16 },
            { name: 'Paper Presentation', category: 'Field', date: '2026-04-15', venue: 'Seminar Hall', max_participants: 30 },
        ];

        const insertedEvents = [];
        for (const ev of eventRows) {
            const r = await client.query(
                `INSERT INTO events (name, category, date, venue, max_participants)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT DO NOTHING RETURNING id`,
                [ev.name, ev.category, ev.date, ev.venue, ev.max_participants]
            );
            if (r.rows.length > 0) {
                insertedEvents.push({ ...ev, id: r.rows[0].id });
                console.log(`  ✅ Event: ${ev.name} (id=${r.rows[0].id})`);
            } else {
                console.log(`  ⏭  Event already exists: ${ev.name}`);
            }
        }

        // ── Participants ─────────────────────────────────────────────────────
        const participants = [
            { id: 'SP1001', name: 'John Doe', email: 'john@example.com', phone: '1234567890', department: 'Computer Science', year: 3, institute: null },
            { id: 'SP1002', name: 'Jane Smith', email: 'jane@example.com', phone: '0987654321', department: 'Mechanical', year: 2, institute: null },
        ];

        for (const p of participants) {
            const r = await client.query(
                `INSERT INTO participants (id, name, email, phone, department, year, institute)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (id) DO NOTHING RETURNING id`,
                [p.id, p.name, p.email, p.phone, p.department, p.year, p.institute]
            );
            console.log(r.rows.length > 0 ? `  ✅ Participant: ${p.name}` : `  ⏭  Already exists: ${p.name}`);
        }

        // ── Results (only if the events were just inserted) ──────────────────
        // Event 1 → SP1001 placed 1st
        // Event 4 (Paper) → SP1002 registered (no position yet)
        const allEvents = await client.query('SELECT id, name FROM events ORDER BY id');
        const evByName = {};
        allEvents.rows.forEach(r => { evByName[r.name] = r.id; });

        const sprintId = evByName['100m Sprint'];
        const paperPresentationId = evByName['Paper Presentation'];

        if (sprintId) {
            const r = await client.query(
                `INSERT INTO results (event_id, participant_id, position, remarks)
                 VALUES ($1, 'SP1001', 1, 'New record!')
                 ON CONFLICT (event_id, participant_id) DO NOTHING RETURNING id`,
                [sprintId]
            );
            console.log(r.rows.length > 0 ? '  ✅ Result: SP1001 1st in 100m Sprint' : '  ⏭  Result already exists');
        }

        if (paperPresentationId) {
            const r = await client.query(
                `INSERT INTO results (event_id, participant_id)
                 VALUES ($1, 'SP1002')
                 ON CONFLICT (event_id, participant_id) DO NOTHING RETURNING id`,
                [paperPresentationId]
            );
            console.log(r.rows.length > 0 ? '  ✅ Result: SP1002 registered for Paper Presentation' : '  ⏭  Already exists');
        }

        await client.query('COMMIT');
        console.log('\n✅ Seed complete. Run "node server.js" and open the app.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Seed failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
