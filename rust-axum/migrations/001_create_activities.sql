-- rust-axum/migrations/001_create_activities.sql
CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    item_type TEXT NOT NULL DEFAULT 'ceremony',
    participants INTEGER NOT NULL DEFAULT 0,
    date TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'upcoming',
    icon TEXT DEFAULT '🕯️',
    description TEXT,
    location TEXT,
    created_user TEXT,
    updated_user TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT
);

CREATE INDEX idx_activities_state ON activities(state);
CREATE INDEX idx_activities_date ON activities(date);
CREATE INDEX idx_activities_item_type ON activities(item_type);