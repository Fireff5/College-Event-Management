-- Initialize Tables

CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS participants (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(100),
    year INTEGER,
    institute VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    date DATE,
    venue VARCHAR(255),
    max_participants INTEGER
);

CREATE TABLE IF NOT EXISTS results (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    participant_id VARCHAR(50) REFERENCES participants(id) ON DELETE CASCADE,
    position INTEGER,
    remarks TEXT,
    document_url VARCHAR(255),
    UNIQUE(event_id, position),
    UNIQUE(event_id, participant_id)
);

-- Schools
CREATE TABLE IF NOT EXISTS schools (
    id           VARCHAR(20)  PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,
    email        VARCHAR(255) UNIQUE NOT NULL,
    phone        VARCHAR(20),
    address      TEXT,
    username     VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- Per-event student registrations for schools
CREATE TABLE IF NOT EXISTS school_students (
    id        SERIAL      PRIMARY KEY,
    school_id VARCHAR(20) REFERENCES schools(id) ON DELETE CASCADE,
    event_id  INTEGER     REFERENCES events(id)  ON DELETE CASCADE,
    name      VARCHAR(255) NOT NULL
);

-- School competition results
CREATE TABLE IF NOT EXISTS school_results (
    id           SERIAL       PRIMARY KEY,
    school_id    VARCHAR(20)  REFERENCES schools(id) ON DELETE CASCADE,
    event_id     INTEGER      REFERENCES events(id)  ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    position     INTEGER,
    remarks      TEXT,
    UNIQUE(event_id, position),
    UNIQUE(event_id, school_id, student_name)
);

-- OTP store for school email verification
CREATE TABLE IF NOT EXISTS school_otps (
    email      VARCHAR(255) PRIMARY KEY,
    otp        VARCHAR(10)  NOT NULL,
    expires_at TIMESTAMPTZ  NOT NULL
);

-- Admin → school messages
CREATE TABLE IF NOT EXISTS school_messages (
    id        SERIAL      PRIMARY KEY,
    school_id VARCHAR(20) REFERENCES schools(id) ON DELETE CASCADE,
    subject   VARCHAR(255),
    body      TEXT,
    sent_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Admin (Password: password)
INSERT INTO admins (username, password_hash)
VALUES ('admin', 'password')
ON CONFLICT (username) DO NOTHING;
