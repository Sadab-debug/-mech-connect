-- Mech Connect SQLite schema
-- Run in sqlite3: .read mistrivai_schema.sql

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    full_name TEXT,
    profile_pic TEXT DEFAULT '',
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    full_name TEXT,
    profile_pic TEXT DEFAULT '',
    role TEXT DEFAULT 'admin',
    permissions TEXT DEFAULT 'manage_users,view_reports',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mechanics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    workshop_name TEXT,
    age INTEGER,
    address TEXT,
    mobile TEXT,
    profile_pic TEXT DEFAULT '',
    role TEXT DEFAULT 'mechanic',
    expertise TEXT,
    experience_years INTEGER,
    hourly_rate REAL DEFAULT 0.0,
    working_hours TEXT,
    education TEXT,
    education_certificate TEXT,
    skill_certificates TEXT,
    nid_number TEXT,
    nid_photo TEXT,
    birth_certificate_number TEXT,
    birth_certificate_photo TEXT,
    work_history TEXT,
    is_active INTEGER DEFAULT 0,
    is_approved INTEGER DEFAULT 0,
    rating REAL DEFAULT 0.0,
    total_bookings INTEGER DEFAULT 0,
    total_income REAL DEFAULT 0.0,
    monthly_income REAL DEFAULT 0.0,
    average_income REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mechanic_proposals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mechanic_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    reviewed_by INTEGER,
    review_notes TEXT,
    FOREIGN KEY(mechanic_id) REFERENCES mechanics(id) ON DELETE CASCADE,
    FOREIGN KEY(reviewed_by) REFERENCES admins(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS mechanic_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mechanic_id INTEGER NOT NULL,
    proposal_id INTEGER NOT NULL,
    notification_type TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read INTEGER DEFAULT 0,
    FOREIGN KEY(mechanic_id) REFERENCES mechanics(id) ON DELETE CASCADE,
    FOREIGN KEY(proposal_id) REFERENCES mechanic_proposals(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    mechanic_id INTEGER NOT NULL,
    address TEXT NOT NULL,
    preferred_time DATETIME NOT NULL,
    problem_description TEXT NOT NULL,
    offer REAL NOT NULL,
    counter_offer REAL,
    counter_note TEXT,
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'requested',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(mechanic_id) REFERENCES mechanics(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read INTEGER DEFAULT 0
);

-- Triggers to keep updated_at current on row updates
CREATE TRIGGER IF NOT EXISTS users_updated_at_trigger
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS admins_updated_at_trigger
AFTER UPDATE ON admins
BEGIN
    UPDATE admins SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS mechanics_updated_at_trigger
AFTER UPDATE ON mechanics
BEGIN
    UPDATE mechanics SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS bookings_updated_at_trigger
AFTER UPDATE ON bookings
BEGIN
    UPDATE bookings SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
