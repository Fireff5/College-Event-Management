const router = require('express').Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendOtpEmail } = require('../mailer');


// ── helpers ──────────────────────────────────────────────────────────────────

const auth = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    next();
};

// Build a school's registeredEvents and studentsByEvent from DB
async function buildSchoolPayload(schoolRow) {
    const studRes = await db.query(
        'SELECT event_id, name FROM school_students WHERE school_id = $1 ORDER BY id ASC',
        [schoolRow.id]
    );
    const studentsByEvent = {};
    const registeredEvents = [];
    for (const row of studRes.rows) {
        const evId = row.event_id;
        if (!studentsByEvent[evId]) {
            studentsByEvent[evId] = [];
            registeredEvents.push(evId);
        }
        studentsByEvent[evId].push(row.name);
    }
    const studentNames = studRes.rows.map(r => r.name);
    return {
        id: schoolRow.id,
        name: schoolRow.name,
        email: schoolRow.email,
        phone: schoolRow.phone,
        address: schoolRow.address,
        username: schoolRow.username,
        createdAt: schoolRow.created_at,
        registeredEvents,
        studentsByEvent,
        studentNames,
    };
}

// ── OTP ──────────────────────────────────────────────────────────────────────

// POST /schools/send-otp
router.post('/send-otp', async (req, res) => {
    try {
        const { email, schoolName } = req.body;
        if (!email) return res.status(400).json({ msg: 'Email is required' });

        // Reject if already registered
        const existing = await db.query('SELECT id FROM schools WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json('A school with this email is already registered.');
        }

        // Generate 6-digit OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

        await db.query(
            `INSERT INTO school_otps (email, otp, expires_at)
             VALUES ($1, $2, $3)
             ON CONFLICT (email) DO UPDATE SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at`,
            [email, otp, expiresAt]
        );

        // Send OTP email via nodemailer (Gmail SMTP)
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('[OTP] EMAIL_USER or EMAIL_PASS not set in .env');
            return res.status(500).json({ msg: 'Email service is not configured on the server. Please contact the administrator.' });
        }

        try {
            await sendOtpEmail(email, schoolName || 'School', otp);
            console.log(`[OTP] Email sent successfully to ${email}`);
        } catch (mailErr) {
            console.error('[OTP] Failed to send email:', mailErr.message);
            return res.status(500).json({ msg: `Failed to send verification email: ${mailErr.message}` });
        }

        res.json({ msg: 'OTP sent' });
    } catch (err) {
        console.error('send-otp error:', err.message);
        res.status(500).json({ msg: 'Failed to send verification email. Please try again.' });
    }
});


// POST /schools/verify-otp
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const result = await db.query('SELECT * FROM school_otps WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json('No verification code found. Please request a new one.');
        }
        const record = result.rows[0];
        if (new Date() > new Date(record.expires_at)) {
            return res.status(400).json('Verification code has expired. Please request a new one.');
        }
        if (record.otp !== String(otp)) {
            return res.status(400).json('Invalid verification code. Please try again.');
        }
        res.json({ valid: true });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ── Registration & Login ──────────────────────────────────────────────────────

// POST /schools/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, address, username, password, events, studentsByEvent } = req.body;

        // Validate
        if (!name || !email || !username || !password) {
            return res.status(400).json({ msg: 'Required fields missing' });
        }
        const trimmedUsername = (username || '').trim();
        if (trimmedUsername.length < 4) {
            return res.status(400).json('Username must be at least 4 characters.');
        }
        if (!password || password.length < 6) {
            return res.status(400).json('Password must be at least 6 characters.');
        }

        const existEmail = await db.query('SELECT id FROM schools WHERE email = $1', [email]);
        if (existEmail.rows.length > 0) {
            return res.status(409).json('A school with this email is already registered.');
        }
        const existUser = await db.query('SELECT id FROM schools WHERE username = $1', [trimmedUsername]);
        if (existUser.rows.length > 0) {
            return res.status(409).json('This username is already taken. Please choose a different one.');
        }

        // Generate school ID
        const countRes = await db.query('SELECT COUNT(*) FROM schools');
        const count = parseInt(countRes.rows[0].count, 10);
        const newId = `SCH${String(count + 1).padStart(3, '0')}`;

        const passwordHash = await bcrypt.hash(password, 10);

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(
                `INSERT INTO schools (id, name, email, phone, address, username, password_hash)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [newId, name, email, phone || null, address || null, trimmedUsername, passwordHash]
            );

            // Insert school_students rows
            const parsedStudentsByEvent = (typeof studentsByEvent === 'string')
                ? JSON.parse(studentsByEvent)
                : (studentsByEvent || {});

            for (const [evId, names] of Object.entries(parsedStudentsByEvent)) {
                for (const studentName of (Array.isArray(names) ? names : [])) {
                    if (studentName && String(studentName).trim()) {
                        await client.query(
                            'INSERT INTO school_students (school_id, event_id, name) VALUES ($1, $2, $3)',
                            [newId, parseInt(evId, 10), String(studentName).trim()]
                        );
                    }
                }
            }

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

        const schoolRow = await db.query('SELECT * FROM schools WHERE id = $1', [newId]);
        const school = await buildSchoolPayload(schoolRow.rows[0]);

        res.status(201).json({ school });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST /schools/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await db.query('SELECT * FROM schools WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(401).json('Invalid school credentials.');
        }
        const school = result.rows[0];
        const valid = await bcrypt.compare(password, school.password_hash);
        if (!valid) {
            return res.status(401).json('Invalid school credentials.');
        }
        const token = jwt.sign(
            { id: school.id, username: school.username, role: 'school' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        const payload = await buildSchoolPayload(school);
        res.json({ token, school: payload });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ── Admin: list / update / delete schools ────────────────────────────────────

// GET /schools  (admin)
router.get('/', auth, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM schools ORDER BY created_at DESC');
        const schools = await Promise.all(result.rows.map(buildSchoolPayload));
        res.json(schools);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// PUT /schools/:id  (admin)
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address } = req.body;
        const updated = await db.query(
            'UPDATE schools SET name=$1, email=$2, phone=$3, address=$4 WHERE id=$5 RETURNING *',
            [name, email, phone, address, id]
        );
        if (updated.rows.length === 0) return res.status(404).json('School not found.');
        const school = await buildSchoolPayload(updated.rows[0]);
        res.json(school);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// DELETE /schools/:id  (admin)
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await db.query('DELETE FROM schools WHERE id=$1 RETURNING id', [id]);
        if (deleted.rows.length === 0) return res.status(404).json('School not found.');
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ── School sub-routes ─────────────────────────────────────────────────────────

// GET /schools/:id/events
router.get('/:id/events', auth, async (req, res) => {
    try {
        const { id } = req.params;
        // Events for events the school has students registered in
        const result = await db.query(
            `SELECT DISTINCT e.* FROM events e
             JOIN school_students ss ON ss.event_id = e.id
             WHERE ss.school_id = $1
             ORDER BY e.date ASC`,
            [id]
        );
        // If no students yet, return all events
        if (result.rows.length === 0) {
            const all = await db.query('SELECT * FROM events ORDER BY date ASC');
            return res.json(all.rows);
        }
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /schools/:id/students
router.get('/:id/students', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            `SELECT ss.id, ss.name, ss.event_id, e.name AS event_name
             FROM school_students ss
             JOIN events e ON ss.event_id = e.id
             WHERE ss.school_id = $1
             ORDER BY ss.id ASC`,
            [id]
        );
        const students = result.rows.map((r, idx) => ({
            id: `${id}_STU${idx + 1}`,
            name: r.name,
            events: [r.event_name],
            eventId: r.event_id,
        }));
        res.json(students);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /schools/:id/registrations
router.get('/:id/registrations', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            `SELECT ss.id, ss.name AS student_name, ss.event_id,
                    e.id AS event_id, e.name AS event_name, e.category, e.date, e.venue, e.max_participants
             FROM school_students ss
             JOIN events e ON ss.event_id = e.id
             WHERE ss.school_id = $1
             ORDER BY ss.id ASC`,
            [id]
        );
        const registrations = result.rows.map((r, idx) => ({
            id: `${id}_${idx}_${r.event_id}`,
            studentName: r.student_name,
            event: {
                id: r.event_id,
                name: r.event_name,
                category: r.category,
                date: r.date,
                venue: r.venue,
                max_participants: r.max_participants,
            },
        }));
        res.json(registrations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /schools/:id/messages
router.get('/:id/messages', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            'SELECT * FROM school_messages WHERE school_id = $1 ORDER BY sent_at DESC',
            [id]
        );
        res.json(result.rows.map(r => ({
            id: r.id,
            schoolId: r.school_id,
            subject: r.subject,
            body: r.body,
            sentAt: r.sent_at,
        })));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST /schools/:id/messages  (admin sends message to school)
router.post('/:id/messages', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { subject, body } = req.body;
        const result = await db.query(
            'INSERT INTO school_messages (school_id, subject, body) VALUES ($1, $2, $3) RETURNING *',
            [id, subject, body]
        );
        const r = result.rows[0];
        res.status(201).json({
            id: r.id,
            schoolId: r.school_id,
            subject: r.subject,
            body: r.body,
            sentAt: r.sent_at,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
