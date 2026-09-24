---
name: Class checkout verification
description: Why real-browser origin checks and isolated data matter for class booking verification.
---

Exercise class mutations with the browser's real Origin and Host, not a test-rewritten Origin.

**Why:** An isolated production-server test initially needed an internal-origin workaround because Next's internal request URL used its bind address. That workaround hid genuine browser rejection until the real origin was tested.

**How to apply:** Run production-mode browser verification without header overrides; keep synthetic identity images and rosters in an isolated ephemeral database, not the site's development or production data.

Browser dependencies from bundled desktop applications must not override the runtime's core C/C++, GCC or OpenSSL libraries.

**Why:** Bundled browser libraries can satisfy Chromium's missing dependencies while breaking the newer Node runtime with incompatible ABI versions.

**How to apply:** Limit temporary browser-library search paths to missing browser dependencies rather than adding an entire bundled application's library directory.