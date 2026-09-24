---
name: Publish schema partial failure
description: Failed publishes may leave production schema changes applied even when the new app build is not promoted.
---

When diagnosing a failed publish after database migration statements appear in build logs, inspect the production schema read-only before assuming the migration was rolled back.

**Why:** A failed publish was observed with a successful application build and image push, no error line after three migration statements, yet the production schema contained all three changes and the previous app continued serving. The exact failure cause was not exposed by available build or runtime logs.

**How to apply:** Check the live build and the pending schema diff; do not manually run production DDL or attribute the failure to a migration without an error. A retry may proceed without those schema changes pending.