const router = require('express').Router();
const db = require('../db');
const protect = require('./auth').protect; // if auth middleware exported there? Wait, let's see how auth is done.

router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                p.id, p.name, p.email, p.phone, p.department, p.year, p.institute,
                e.name AS event_name,
                r.document_url, r.remarks, r.position
            FROM participants p
            JOIN results r ON p.id = r.participant_id
            JOIN events e ON r.event_id = e.id
            WHERE e.name ILIKE '%Paper Presentation%'
            ORDER BY p.name ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
