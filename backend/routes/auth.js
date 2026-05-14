const router = require('express').Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find admin
        const result = await db.query('SELECT * FROM admins WHERE username = $1', [username]);

        if (result.rows.length === 0) {
            return res.status(401).json('Invalid credentials');
        }

        const admin = result.rows[0];

        // Direct comparison for mock (use bcrypt in production)
        if (password !== admin.password_hash) {
            return res.status(401).json('Invalid credentials');
        }

        // Generate Token
        const token = jwt.sign(
            { id: admin.id, username: admin.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
