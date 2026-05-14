const router = require('express').Router();
const db = require('../db');

const auth = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    next();
};

// Map a DB row to the camelCase shape the frontend expects
function toFrontend(row) {
    return {
        id: row.id,
        schoolId: row.school_id,
        schoolName: row.school_name || '',
        studentName: row.student_name,
        eventId: row.event_id,
        eventName: row.event_name || '',
        position: row.position,
        remarks: row.remarks || '',
    };
}

// GET /school-results?eventId=  (all or filtered)
router.get('/', auth, async (req, res) => {
    try {
        const { eventId } = req.query;
        let queryStr = `
            SELECT sr.*, 
                   s.name AS school_name,
                   e.name AS event_name
            FROM school_results sr
            LEFT JOIN schools s ON sr.school_id = s.id
            LEFT JOIN events e ON sr.event_id = e.id
        `;
        const params = [];
        if (eventId) {
            queryStr += ' WHERE sr.event_id = $1';
            params.push(parseInt(eventId, 10));
        }
        queryStr += ' ORDER BY sr.id DESC';

        const result = await db.query(queryStr, params);
        res.json(result.rows.map(toFrontend));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST /school-results  (create or update)
// Frontend sends: { schoolId, schoolName, studentName, eventId, eventName, position, remarks }
router.post('/', auth, async (req, res) => {
    try {
        // Accept both camelCase (from frontend) and snake_case
        const school_id = req.body.school_id || req.body.schoolId;
        const event_id = req.body.event_id || req.body.eventId;
        const student_name = req.body.student_name || req.body.studentName;
        const { position, remarks } = req.body;

        if (!school_id || !event_id || !student_name) {
            return res.status(400).json({ msg: 'school_id, event_id and student_name are required' });
        }

        const result = await db.query(
            `INSERT INTO school_results (school_id, event_id, student_name, position, remarks)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (event_id, school_id, student_name)
             DO UPDATE SET position = EXCLUDED.position, remarks = EXCLUDED.remarks
             RETURNING *`,
            [school_id, parseInt(event_id, 10), student_name, position, remarks || null]
        );

        // Return with school/event names joined
        const row = result.rows[0];
        const schoolRes = await db.query('SELECT name FROM schools WHERE id=$1', [school_id]);
        const eventRes = await db.query('SELECT name FROM events WHERE id=$1', [parseInt(event_id, 10)]);
        row.school_name = schoolRes.rows[0]?.name || '';
        row.event_name = eventRes.rows[0]?.name || '';

        res.status(201).json(toFrontend(row));
    } catch (err) {
        console.error(err.message);
        if (err.constraint === 'school_results_event_id_position_key') {
            return res.status(400).json('This position is already awarded in this event.');
        }
        res.status(500).send('Server Error');
    }
});

// DELETE /school-results/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await db.query(
            'DELETE FROM school_results WHERE id = $1 RETURNING id',
            [id]
        );
        if (deleted.rows.length === 0) return res.status(404).json('Result not found');
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
