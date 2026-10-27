CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY,
 issuer TEXT NOT NULL,
 identity_subject TEXT NOT NULL,
 email TEXT NOT NULL,
 display_name TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('admin','member')),
 status TEXT NOT NULL CHECK(status IN ('active','disabled')),
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL,
 UNIQUE(issuer, identity_subject)
);
CREATE TABLE IF NOT EXISTS sessions (
 verifier TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES users(id),
 created_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL,
 revoked_at INTEGER
);
CREATE TABLE IF NOT EXISTS login_flows (
 state_hash TEXT PRIMARY KEY,
 nonce TEXT NOT NULL,
 pkce_verifier TEXT NOT NULL,
 target TEXT NOT NULL,
 previous_session TEXT NOT NULL,
 expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS session_expiry ON sessions(expires_at);
