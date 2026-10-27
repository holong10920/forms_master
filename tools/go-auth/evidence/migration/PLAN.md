# Unified Workspace migration

M1: mount the existing DOM editor as a React-owned Studio subtree (no editor iframe), add Workspace routes/dirty guards and bind it exclusively to Go session/CSRF/site capabilities.
M2: snapshot P0 SQLite into a separate data root; keep release IDs, blobs and immutable bytes; port business contracts and evaluator to Go; invoke the retained TS compiler through a bounded stdin adapter. Preserve distinct review author/approver identities and fail-closed policy gates.
M3: one launcher, Go public/preview handlers and mock worker; differential fixtures, regression tests and browser proof; retain old runtime/data as rollback. No Python business API or worker in the final startup. Compiler semantic cross-check must also use Go during cutover, with Python as test-only oracle.

Current snapshot audit: 55 drafts, 54 reviews, 67 local releases, 53 managed releases, 25 active pointers, 58 submissions and 470 audit rows. Full source schema/counts are in source-schema.json. Existing source data will not be opened for Go writes. T12/K13 stays VERIFICATION_PENDING.

Permission mapping: application roles stay ADMIN/MEMBER. Explicit site memberships grant capabilities; synthetic-admin has management capabilities on PC/Sports only, synthetic-member has PC form:read only. A separate synthetic-approver ADMIN identity has review/read only on PC/Sports, retaining the existing four-eyes approval constraint. No membership means deny, including other-site IDs. Legacy editor/reviewer/publisher/viewer UI affordances are projections of these capabilities, never authority.
