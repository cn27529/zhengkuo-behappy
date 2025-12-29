-- 創建活動表
CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    item_type TEXT DEFAULT 'ceremony',
    participants INTEGER DEFAULT 0,
    date TEXT NOT NULL,
    state TEXT DEFAULT 'upcoming',
    icon TEXT DEFAULT '🕯️',
    description TEXT,
    location TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 創建索引
CREATE INDEX idx_activities_activity_id ON activities(activity_id);
CREATE INDEX idx_activities_state ON activities(state);
CREATE INDEX idx_activities_date ON activities(date);
CREATE INDEX idx_activities_item_type ON activities(item_type);