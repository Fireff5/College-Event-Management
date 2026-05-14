const router = require('express').Router();
const db = require('../db');

const multer = require('multer');
const path = require('path');

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Get all events for public registration dropdown
router.get('/events', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM events ORDER BY date ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Register participant publicly
router.post('/register', upload.single('document'), async (req, res) => {
    try {
        let { id, name, email, phone, department, year, institute, events } = req.body;

        let parsedEvents = [];
        if (typeof events === 'string') {
            try {
                parsedEvents = JSON.parse(events);
            } catch (e) {
                parsedEvents = [parseInt(events)];
            }
        } else if (Array.isArray(events)) {
            parsedEvents = events;
        }

        if (!id || !name || !email) {
            return res.status(400).json({ msg: 'Please provide required fields (ID, Name, Email)' });
        }

        let documentUrl = null;
        if (req.file) {
            documentUrl = '/uploads/' + req.file.filename;
        }

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');
            const newParticipant = await client.query(
                `INSERT INTO participants (id, name, email, phone, department, year, institute) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7) 
                 ON CONFLICT (id) DO UPDATE SET 
                 name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone, 
                 department = EXCLUDED.department, year = EXCLUDED.year, institute = EXCLUDED.institute 
                 RETURNING *`,
                [id, name, email, phone, department, year, institute]
            );

            if (parsedEvents && Array.isArray(parsedEvents) && parsedEvents.length > 0) {
                const paperEventRes = await client.query("SELECT id FROM events WHERE name ILIKE '%Paper Presentation%'");
                const paperEventId = paperEventRes.rows.length > 0 ? paperEventRes.rows[0].id : null;

                for (const evId of parsedEvents) {
                    const urlToSave = (evId == paperEventId) ? documentUrl : null;

                    await client.query(
                        `INSERT INTO results (event_id, participant_id, document_url) 
                         VALUES ($1, $2, $3) 
                         ON CONFLICT (event_id, participant_id) 
                         DO UPDATE SET document_url = COALESCE(EXCLUDED.document_url, results.document_url)`,
                        [evId, id, urlToSave]
                    );
                }
            }
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

        const created = await db.query(
            `SELECT p.*, COALESCE((SELECT json_agg(event_id) FROM results WHERE participant_id = p.id), '[]'::json) AS registered_events FROM participants p WHERE p.id = $1`,
            [id]
        );

        res.status(201).json(created.rows[0]);
    } catch (err) {
        console.error(err.message);
        if (err.constraint === 'participants_pkey') {
            return res.status(400).json({ msg: 'Registration ID already exists' });
        }
        if (err.constraint === 'participants_email_key') {
            return res.status(400).json({ msg: 'Email is already registered' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
