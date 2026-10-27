CREATE TABLE audit(id INTEGER PRIMARY KEY,at REAL,actor TEXT,site TEXT,
 form TEXT,action TEXT,target TEXT);
CREATE TABLE block_status(pin TEXT PRIMARY KEY,digest TEXT,state TEXT,version INTEGER);
CREATE TABLE capabilities(prk TEXT PRIMARY KEY,version INTEGER,ledger TEXT,
 overrides TEXT,m3 INTEGER,fbks TEXT,ledger_seq INTEGER);
CREATE TABLE control_meta(key TEXT PRIMARY KEY);
CREATE TABLE deployments(id TEXT PRIMARY KEY,version INTEGER,adapters TEXT);
CREATE TABLE drafts(site TEXT,form TEXT,version INTEGER,definition TEXT,author TEXT,
 PRIMARY KEY(site,form));
CREATE TABLE form_meta(site TEXT,form TEXT,title TEXT,cloned_from TEXT,PRIMARY KEY(site,form));
CREATE TABLE gate_intents(prk TEXT PRIMARY KEY);
CREATE TABLE gates(key TEXT PRIMARY KEY,blockers TEXT);
CREATE TABLE identity_types(site TEXT,form TEXT,identity TEXT,type TEXT,PRIMARY KEY(site,form,identity));
CREATE TABLE key_ledger(site TEXT,form TEXT,path TEXT,identity TEXT,PRIMARY KEY(site,form,path));
CREATE TABLE local_active (site_id TEXT NOT NULL, form_id TEXT NOT NULL, candidate_id TEXT NOT NULL REFERENCES local_releases(candidate_id), version INTEGER NOT NULL, PRIMARY KEY (site_id,form_id)) STRICT;
CREATE TABLE local_publication_audit (sequence INTEGER PRIMARY KEY, action TEXT NOT NULL, candidate_id TEXT NOT NULL, actor TEXT NOT NULL) STRICT;
CREATE TABLE local_releases (candidate_id TEXT PRIMARY KEY, site_id TEXT NOT NULL, form_id TEXT NOT NULL) STRICT;
CREATE TABLE managed_releases(id TEXT PRIMARY KEY,site TEXT,form TEXT,review TEXT,
 fbks TEXT,at REAL);
CREATE TABLE memberships(user TEXT,site TEXT,roles TEXT,PRIMARY KEY(user,site));
CREATE TABLE mock_effects(id TEXT PRIMARY KEY,submission TEXT UNIQUE,at REAL);
CREATE TABLE object_security(key TEXT PRIMARY KEY,version INTEGER,sources TEXT);
CREATE TABLE oidc_codes(id TEXT PRIMARY KEY,user TEXT,nonce TEXT,challenge TEXT,
 redirect TEXT,expires REAL);
CREATE TABLE oidc_states(id TEXT PRIMARY KEY,document TEXT,expires REAL);
CREATE TABLE oidc_tokens(session TEXT PRIMARY KEY,envelope TEXT);
CREATE TABLE operations(id TEXT PRIMARY KEY,review TEXT,site TEXT,form TEXT,
 state TEXT,version INTEGER,candidate TEXT,error TEXT,updated REAL,base INTEGER,platform TEXT);
CREATE TABLE outbox(id TEXT PRIMARY KEY,submission TEXT UNIQUE,state TEXT);
CREATE TABLE previews(token TEXT PRIMARY KEY,session TEXT,site TEXT,form TEXT,
 version INTEGER,candidate TEXT,expires REAL);
CREATE TABLE review_contracts(id TEXT PRIMARY KEY,document TEXT);
CREATE TABLE review_meta(id TEXT PRIMARY KEY,platform TEXT,stale_reason TEXT);
CREATE TABLE reviews(id TEXT PRIMARY KEY,site TEXT,form TEXT,version INTEGER,
 definition TEXT,digest TEXT,author TEXT,approver TEXT,state TEXT,base INTEGER);
CREATE TABLE schema_migrations (
  version TEXT PRIMARY KEY,
  sha256 TEXT NOT NULL,
  applied_at TEXT NOT NULL
) STRICT;
CREATE TABLE sessions(token TEXT PRIMARY KEY,user TEXT,csrf TEXT,
 created REAL,seen REAL);
CREATE TABLE submissions(id TEXT PRIMARY KEY,site TEXT,form TEXT,release TEXT,
 idem TEXT,hash TEXT,payload TEXT,receipt TEXT,UNIQUE(site,form,idem));
CREATE TABLE trusted_ledger(prk TEXT PRIMARY KEY,seq INTEGER,state TEXT,commit_id TEXT);
CREATE TABLE IF NOT EXISTS master_migrations(version INTEGER PRIMARY KEY, checksum TEXT NOT NULL, applied_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS master_memberships(user_id TEXT NOT NULL,site TEXT NOT NULL,capabilities TEXT NOT NULL,PRIMARY KEY(user_id,site));
CREATE UNIQUE INDEX IF NOT EXISTS one_active_publication ON operations(review) WHERE state IN ('BUILDING','VERIFYING','ACTIVATING');
