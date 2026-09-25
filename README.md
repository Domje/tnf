# Thoughts and Feelings

A fast, minimal voice/text journal + todo app. Plain HTML/CSS/JS, no framework, no
build step. Runs on Cloudflare Pages with Pages Functions and D1.

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

## Setup steps still needed from you

I don't have authenticated access to Cloudflare or GitHub from this session
(no `wrangler login`, no `gh`, no API token), so I could not run the
account-level steps. Everything else (all app code, schema, config) is done
and pushed to `main` — see below. Do these in order:

1. **Push access** — confirm the repo push in this session actually reached
   `https://github.com/Domje/tnf.git` (see note at the end of this session's
   summary). If it didn't, push manually from this folder:
   ```bash
   git push -u origin main
   ```

2. **Create the D1 database and apply the schema:**
   ```bash
   npx wrangler login
   npx wrangler d1 create thoughts-and-feelings-db
   ```
   Copy the `database_id` it prints into `wrangler.toml` (replace
   `REPLACE_WITH_DATABASE_ID`), then apply the schema to the **remote** database:
   ```bash
   npx wrangler d1 execute DB --remote --file=schema.sql
   ```
   Commit and push the updated `wrangler.toml`.

3. **Create the Cloudflare Pages project** connected to GitHub:
   - Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git
   - Select the `Domje/tnf` repository (authorise Cloudflare's GitHub App if
     prompted)
   - Production branch: `main`
   - Build command: none / empty
   - Build output directory: `/` (matches `pages_build_output_dir = "."`)
   - After creation, go to the project's **Settings → Functions → D1 database
     bindings** and bind variable name `DB` to the `thoughts-and-feelings-db`
     database you created in step 2.

4. **Create the Cloudflare Access application:**
   - Zero Trust dashboard → Access → Applications → Add an application →
     Self-hosted
   - Domain: the project's `*.pages.dev` domain (shown on the Pages project
     page after first deploy)
   - Policy: Allow, Include → Emails → `dom.haughton@gmail.com` only

5. **Trigger a deployment** (Pages project page → Deployments → retry/deploy,
   or just push a commit) and confirm:
   - the site loads at the `pages.dev` URL (behind Access login)
   - `/api/tasks` and `/api/entries` return `[]` (or your data) rather than an
     error

Once steps 2–4 are done, everything after that is just `git push`.
