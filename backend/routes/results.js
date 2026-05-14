const router = require('express').Router();
const db = require('../db');

const auth = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    next();
};

const getEventAndParticipant = `
    SELECT r.*, 
        row_to_json(e.*) as event,
        row_to_json(p.*) as participant
    FROM results r
    LEFT JOIN events e ON r.event_id = e.id
    LEFT JOIN participants p ON r.participant_id = p.id
`;

// Get all results (only those with a position)
router.get('/', auth, async (req, res) => {
    try {
        const result = await db.query(`${getEventAndParticipant} WHERE r.position IS NOT NULL ORDER BY r.id DESC`);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get results by event ID
router.get('/event/:eventId', auth, async (req, res) => {
    try {
        const { eventId } = req.params;
        const result = await db.query(
            `${getEventAndParticipant} WHERE r.event_id = $1 AND r.position IS NOT NULL ORDER BY r.position ASC`,
            [eventId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Create or update result
router.post('/', auth, async (req, res) => {
    try {
        const { event_id, participant_id, position, remarks } = req.body;

        // Postgres will handle the UNIQUE checks based on the schema
        const newResult = await db.query(
            `INSERT INTO results (event_id, participant_id, position, remarks) 
             VALUES ($1, $2, $3, $4) 
             ON CONFLICT (event_id, participant_id) 
             DO UPDATE SET position = EXCLUDED.position, remarks = EXCLUDED.remarks 
             RETURNING *`,
            [event_id, participant_id, position, remarks]
        );

        res.status(201).json(newResult.rows[0]);
    } catch (err) {
        console.error(err.message);
        if (err.constraint === 'results_event_id_position_key') {
            return res.status(400).send('Position already filled for this event');
        }
        res.status(500).send('Server Error');
    }
});

// Delete result (actually only resets position and remarks, keeping registration)
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await db.query(
            'UPDATE results SET position = NULL, remarks = NULL WHERE id = $1 RETURNING *',
            [id]
        );

        if (deleted.rows.length === 0) return res.status(404).json('Result not found');

        res.json({ message: 'Result position removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
