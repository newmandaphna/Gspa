---
name: Next.js preview hydration
description: Distinguishing Replit preview injection from application hydration bugs
---

Replit's preview can inject a script into the document head and add attributes to html/body before Next.js hydrates. If a hydration error points to a head stylesheet link competing with that script, keep font loading in CSS rather than a manual root-layout head link. Attribute-only mismatches caused by preview tooling or browser extensions can be suppressed at the html/body elements; do not suppress mismatches in application content.

**Why:** The imported Next.js site rendered correctly but preview injection reordered a manually declared font link and caused a full hydration failure. After moving font loading to CSS, only injected html/body attributes remained.

**How to apply:** When diagnosing preview-only hydration warnings, inspect the React mismatch diff and browser logs first. Fix actual content mismatches; handle only confirmed external injections with the limited approach above.