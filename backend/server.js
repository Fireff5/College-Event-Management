const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

const db = require('./db');

const app = express();

const path = require('path');

// Run migration on startup – safely add document_url column if missing
db.query(`
    ALTER TABLE results ADD COLUMN IF NOT EXISTS document_url VARCHAR(255)
`).catch(err => console.error('Migration warning:', err.message));


// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/dashboard', require('./routes/dashboard'));
app.use('/api/v1/participants', require('./routes/participants'));
app.use('/api/v1/events', require('./routes/events'));
app.use('/api/v1/results', require('./routes/results'));
app.use('/api/v1/public', require('./routes/public'));
app.use('/api/v1/papers', require('./routes/papers'));
app.use('/api/v1/schools', require('./routes/schools'));
app.use('/api/v1/school-results', require('./routes/schoolResults'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
