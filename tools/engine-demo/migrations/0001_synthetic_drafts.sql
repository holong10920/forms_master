CREATE TABLE s1_synthetic_drafts (
    session_id TEXT PRIMARY KEY,
    form_id TEXT NOT NULL,
    site_id TEXT NOT NULL,
    release_id TEXT NOT NULL,
    revision TEXT NOT NULL,
    version INTEGER NOT NULL CHECK (version > 0),
    expires_at TEXT NOT NULL,
    document TEXT NOT NULL
) STRICT;
