const router = require('express').Router();
const db = require('../db');

const auth = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    next();
};

// Get all events
router.get('/', auth, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM events ORDER BY date DESC, id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Create event
router.post('/', auth, async (req, res) => {
    try {
        const { name, category, date, venue, max_participants } = req.body;

        const newEvent = await db.query(
            'INSERT INTO events (name, category, date, venue, max_participants) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, category, date, venue, max_participants]
        );

        res.status(201).json(newEvent.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update event
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, date, venue, max_participants } = req.body;

        const updated = await db.query(
            'UPDATE events SET name = $1, category = $2, date = $3, venue = $4, max_participants = $5 WHERE id = $6 RETURNING *',
            [name, category, date, venue, max_participants, id]
        );

        if (updated.rows.length === 0) return res.status(404).json('Event not found');

        res.json(updated.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete event
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await db.query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);

        if (deleted.rows.length === 0) return res.status(404).json('Event not found');

        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
