# Thoughts and Feelings

A fast, minimal voice/text journal + todo app. Plain HTML/CSS/JS, no framework, no
build step. Runs on Cloudflare Pages with Pages Functions and D1.

**Live:** https://thoughts-and-feelings-3y9.pages.dev (behind Cloudflare Access,
restricted to dom.haughton@gmail.com)

## How it's built

- `index.html`, `style.css`, `app.js` — the entire client. One hash-routed
  single-page app (`#/journal`, `#/tasks`, `#/journal/:id`, etc). No client
  library, no web fonts, no CDN requests at runtime. Lucide icons are inlined
  as raw SVG path strings inside `app.js`. Total size is ~30KB.
- `functions/api/**` — Cloudflare Pages Functions implementing the REST API
  under `/api`, using the `DB` D1 binding.
- `schema.sql` — the two tables (`entries`, `tasks`).
- `_headers` — long cache lifetime for `style.css`/`app.js`; `index.html` is
  `no-cache` so app-shell updates always show up on next load without needing
  cache-busted filenames.
- `wrangler.toml` — Pages config with the D1 binding (`DB`).

## Design choices worth knowing about

- **Voice formatting** happens client-side after you stop recording: sentence
  starts and standalone "i" are capitalised, a period is appended if a segment
  has no terminal punctuation, and a 3+ second pause while speaking starts a
  new paragraph. Task text is always collapsed to a single line.
- **Sanitising**: a small built-in allowlist (`p br b strong i em ul li`)
  strips everything else (scripts, event handler attributes, links, images,
  etc) using an inert `<template>` element — no server-side sanitising, since
  there's no untrusted multi-user input here (the app sits behind Cloudflare
  Access for a single user).
- **Tasks are inline-editable**: each task row is a single-line `<input>`.
  Typing autosaves after a short debounce; pressing Backspace in an empty
  task row deletes it, matching the spec's "backspace on empty task deletes
  it."
- **Routing**: hash-based (`#/…`) so the browser's native back/forward and
  history both work for free, and every sub-screen's back button is just
  `history.back()`.
- **"Edit before saving" from voice review** swaps in the same editor
  used for manual entry, prefilled with the formatted transcript, without
  changing the URL hash — this is a deliberate shortcut for MVP speed; the
  minor side effect is that browser-back from that in-place editor skips
  past the voice screen. Not worth a bigger router for v1.
- No delete affordance for journal entries (not in the spec) — only edit.
- `compatibility_date` in `wrangler.toml` is pinned to a known-good date
  rather than "today" to avoid picking an untested runtime flag set.

## Local development

```bash
npm install -g wrangler   # or use npx wrangler ...
wrangler d1 execute DB --local --file=schema.sql
wrangler pages dev .
```

Note: Cloudflare's local D1 (via `workerd`) opens sqlite files with a path
length limit — if `wrangler d1 execute --local` fails with `SQLITE_CANTOPEN`,
your working directory path is too long (a Windows/`workerd` limitation, not
an app bug). Run it from a short path (e.g. `C:\dev\tnf`) instead.

## Deploying (after the one-time setup below)

Every future change: commit and push to `main`. Cloudflare Pages rebuilds
and redeploys automatically (no build step — it just serves the files).

```bash
git add -A
git commit -m "..."
git push
```

---

## Deployment status

Everything is set up and live:

- Repo pushed to `https://github.com/Domje/tnf` (`main`)
- D1 database `thoughts-and-feelings-db` created and schema applied
- Cloudflare Pages project `thoughts-and-feelings` created, connected to
  GitHub, `DB` bound for both production and preview
- Cloudflare Access application created for the production domain, allowing
  only `dom.haughton@gmail.com`
- First deployment succeeded; `/api/tasks` and `/api/entries` verified live

Nothing further is needed from you. Future changes: `git add -A && git commit
&& git push` — Cloudflare rebuilds and redeploys automatically.
