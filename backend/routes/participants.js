const router = require('express').Router();
const db = require('../db');

// Add super simple middleware to check for auth header
const auth = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    next();
};

// Get all participants
router.get('/', auth, async (req, res) => {
    try {
        const { q } = req.query;
        let queryStr = `
            SELECT p.*, COALESCE((
                SELECT json_agg(event_id) FROM results WHERE participant_id = p.id
            ), '[]'::json) AS registered_events 
            FROM participants p 
            ORDER BY p.id DESC
        `;
        let params = [];

        if (q) {
            queryStr = `
                SELECT p.*, COALESCE((
                    SELECT json_agg(event_id) FROM results WHERE participant_id = p.id
                ), '[]'::json) AS registered_events 
                FROM participants p 
                WHERE LOWER(p.name) LIKE $1 OR LOWER(p.id) LIKE $1 
                ORDER BY p.id DESC
            `;
            params = [`%${q.toLowerCase()}%`];
        }

        const result = await db.query(queryStr, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Create participant
router.post('/', auth, async (req, res) => {
    try {
        const { id, name, email, phone, department, year, institute, events } = req.body;

        await db.query('BEGIN');
        const newParticipant = await db.query(
            'INSERT INTO participants (id, name, email, phone, department, year, institute) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [id, name, email, phone, department, year, institute]
        );

        if (events && Array.isArray(events) && events.length > 0) {
            for (const evId of events) {
                await db.query(
                    'INSERT INTO results (event_id, participant_id) VALUES ($1, $2)',
                    [evId, id]
                );
            }
        }
        await db.query('COMMIT');

        const created = await db.query(
            `SELECT p.*, COALESCE((SELECT json_agg(event_id) FROM results WHERE participant_id = p.id), '[]'::json) AS registered_events FROM participants p WHERE p.id = $1`,
            [id]
        );

        res.status(201).json(created.rows[0]);
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update participant
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, department, year, institute, events } = req.body;

        await db.query('BEGIN');
        const updated = await db.query(
            'UPDATE participants SET name = $1, email = $2, phone = $3, department = $4, year = $5, institute = $6 WHERE id = $7 RETURNING *',
            [name, email, phone, department, year, institute, id]
        );

        if (updated.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json('Participant not found');
        }

        if (events && Array.isArray(events)) {
            await db.query('DELETE FROM results WHERE participant_id = $1 AND position IS NULL', [id]);

            for (const evId of events) {
                await db.query(
                    'INSERT INTO results (event_id, participant_id) VALUES ($1, $2) ON CONFLICT (event_id, participant_id) DO NOTHING',
                    [evId, id]
                );
            }
        }

        await db.query('COMMIT');

        const finalUpdated = await db.query(
            `SELECT p.*, COALESCE((SELECT json_agg(event_id) FROM results WHERE participant_id = p.id), '[]'::json) AS registered_events FROM participants p WHERE p.id = $1`,
            [id]
        );

        res.json(finalUpdated.rows[0]);
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete participant
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await db.query('DELETE FROM participants WHERE id = $1 RETURNING *', [id]);

        if (deleted.rows.length === 0) {
            return res.status(404).json('Participant not found');
        }

        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
