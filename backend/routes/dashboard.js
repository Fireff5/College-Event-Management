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

router.get('/stats', auth, async (req, res) => {
    try {
        const partResult = await db.query('SELECT COUNT(*) FROM participants');
        const eventResult = await db.query('SELECT COUNT(*) FROM events');
        const resResult = await db.query('SELECT COUNT(*) FROM results WHERE position IS NOT NULL');

        res.json({
            totalParticipants: parseInt(partResult.rows[0].count, 10),
            totalEvents: parseInt(eventResult.rows[0].count, 10),
            totalResults: parseInt(resResult.rows[0].count, 10)
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
