CREATE TABLE local_releases (candidate_id TEXT PRIMARY KEY, site_id TEXT NOT NULL, form_id TEXT NOT NULL) STRICT;
CREATE TABLE local_active (site_id TEXT NOT NULL, form_id TEXT NOT NULL, candidate_id TEXT NOT NULL REFERENCES local_releases(candidate_id), version INTEGER NOT NULL, PRIMARY KEY (site_id,form_id)) STRICT;
CREATE TABLE local_publication_audit (sequence INTEGER PRIMARY KEY, action TEXT NOT NULL, candidate_id TEXT NOT NULL, actor TEXT NOT NULL) STRICT;
