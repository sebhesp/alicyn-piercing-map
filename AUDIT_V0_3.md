# PierceMap V0.3 Readiness Audit

Audit date: 2026-05-17  
Repository: `sebhesp/alicyn-piercing-map`  
Target: Static Vanilla JS app deployed through GitHub Pages/custom domain  
Scope: readiness for V0.3 without rewriting the application.

---

## Executive summary

PierceMap is past a pure static prototype. The V0.2 audit described login/social/backend as “proximamente”, but the current code now includes a configured Supabase client, Google OAuth flow, profile sync, fallback persistence, intake/consent saving, favorites, design projects and community experience write paths. That means the main V0.3 risk is no longer UI coverage only; it is backend contract clarity, Supabase RLS correctness, OAuth redirect readiness, privacy boundaries and browser QA.

The app can remain static for V0.3, but only if Supabase is treated as the backend boundary and all public writes are protected by Row Level Security, validation constraints and moderation states.

No app rewrite is recommended before V0.3. The immediate work should be: document Supabase schema, verify RLS, harden OAuth redirects, fix duplicated/mock auth behavior, split the oversized inline CSS/HTML, and create repeatable browser tests for GitHub Pages, piercemap.com, iPhone Safari and iPad Safari.

---

## 1. Supabase auth/config safety

### Finding A — Supabase URL and anon/publishable key are committed in frontend code

**Severity:** Medium if RLS is correct; Critical if RLS is absent or permissive.

**File:** `supabase-client.js`  
**Affected lines:** approximately 20–21

```js
const SUPABASE_URL = "https://pejggyicajjfcvrtjraf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_dk1HLbLQSGejoXTX0ZgrTQ_GtmHFpQ-";
```

This is acceptable only if the key is truly the anon/publishable key and every table/storage bucket has correct RLS policies. It is not acceptable if any service role key, privileged key, permissive table policy, public storage bucket for unmoderated user uploads, or unrestricted insert/select/update/delete policy exists.

**Required V0.3 action:**

- Confirm the key is anon/publishable, never service role.
- Confirm RLS is enabled on every table touched by the frontend.
- Confirm storage buckets are either private or only expose moderated/public assets.
- Add a short `SUPABASE_SETUP.md` explaining expected env/config and why anon key exposure is safe under RLS.

---

### Finding B — OAuth redirect is computed from current path

**Severity:** Medium.

**File:** `supabase-client.js`  
**Affected lines:** approximately 22–27 and 233–247

```js
function getGoogleRedirectTo() {
  return window.location.origin + window.location.pathname;
}
```

This is flexible for GitHub Pages, localhost and custom domains, but it requires every possible origin/path combination to be configured in Supabase Redirect URLs. On GitHub Pages the path is likely `/alicyn-piercing-map/`; on production it may be `/`. Any mismatch will break OAuth after redirect.

**Required V0.3 action:**

- Add redirect URLs in Supabase for:
  - `https://sebhesp.github.io/alicyn-piercing-map/`
  - `https://piercemap.com/`
  - `https://www.piercemap.com/`
  - local development origin if used.
- Add a small OAuth smoke-test checklist to `SUPABASE_SETUP.md`.
- Consider normalizing trailing slash behavior.

---

### Finding C — Supabase CDN dependency can silently disable backend behavior

**Severity:** Medium.

**File:** `supabase-client.js`  
**Affected lines:** approximately 145–172 and 414–429

The Supabase SDK is loaded from jsDelivr at runtime. If the CDN is blocked, slow, or unavailable, the app falls back to local behavior. That is good for demo resilience, but bad if the user believes a consent/intake/community write was safely stored remotely.

**Required V0.3 action:**

- Make Supabase connection status visible in all write flows.
- For legal/privacy-adjacent flows like consent, do not silently present local fallback as equivalent to remote persistence.
- Add UI copy: “Guardado localmente en este dispositivo” vs “Sincronizado con PierceMap”.

---

## 2. Whether public anon key usage is safe assuming RLS

Public anon key usage is safe only under strict RLS and table constraints. V0.3 can proceed with a public key if all policies are aligned with the following model.

### Minimum RLS expectations

#### `profiles`

- `select`: user can select own profile. Optional public read only for safe public fields.
- `insert`: `auth.uid() = id`.
- `update`: `auth.uid() = id`.
- No client-side role escalation. The frontend currently writes `role: 'client'`; database should either default this or validate allowed values.

#### `inspo_items`

- Public `select` only for curated/approved items.
- Client insert/upsert should be blocked or restricted unless this is intentionally a client-curated cache.
- If users can suggest inspo, suggestions should go into a separate `inspo_submissions` table with `status = 'pending'`.

#### `inspo_favorites`

- `select/insert/delete`: own rows only using `auth.uid() = user_id`.

#### `design_projects`

- `select/insert/update/delete`: own rows only.
- Payload is user-generated and may contain personal preference data; do not make public.

#### `community_experiences`

- `insert`: authenticated users only; `user_id = auth.uid()`.
- Public `select`: only `status = 'approved'`.
- Own `select`: user can see own pending/rejected rows.
- Updates should be either blocked or own-only with moderation fields protected.

#### `intakes`

- Treat as sensitive.
- Do not allow public select.
- Insert may be anonymous only if the product intentionally allows pre-consultation anonymous intake. If anonymous insert is allowed, add anti-abuse measures and avoid exposing data.
- Authenticated select should be own row only, or studio-scoped with explicit membership table.

#### `consents`

- Treat as sensitive and potentially legal.
- No public select.
- Insert should require explicit acceptance and should not allow arbitrary user IDs.
- Signature image is currently not sent remotely, which is safer, but local signature data still exists in localStorage.

---

## 3. Missing Supabase table assumptions

### Finding D — Frontend assumes many possible table shapes

**Severity:** High for V0.3 backend reliability.

**File:** `supabase-client.js`  
**Affected lines:** approximately 177–760

The client writes to these tables:

- `profiles`
- `inspo_items`
- `inspo_favorites`
- `design_projects`
- `community_experiences`
- `intakes`
- `consents`

For several operations, it tries two alternative column schemas. Example: `inspo_favorites` tries `user_id/inspo_item_id/item_snapshot` and then `profile_id/item_id/payload`. This indicates the database contract is not finalized.

**Required V0.3 action:**

- Create `supabase/schema.sql` as the canonical schema.
- Create `supabase/policies.sql` as the canonical RLS policy set.
- Remove alternate write attempts after schema is finalized.
- Create `SUPABASE_SETUP.md` documenting required tables, columns, indexes and policies.

---

### Finding E — Comment references `supabase/intakes.sql`, but the file may not exist

**Severity:** Medium.

**File:** `supabase-client.js`  
**Affected lines:** approximately 466–467

```js
// Tables: intakes · consents (run supabase/intakes.sql in your Supabase SQL editor)
```

If this SQL file is absent, Codex or a developer cannot reproduce the backend.

**Required V0.3 action:**

- Add `supabase/intakes.sql` or replace with canonical `supabase/schema.sql`.
- Include constraints, indexes and RLS.

---

## 4. Broken UI flows

### Finding F — Community module still describes auth as mock while Supabase auth exists

**Severity:** High UX/product inconsistency.

**File:** `community.js`  
**Affected lines:** approximately 1–12 and 189–222

The file header says the module uses mock OAuth UX and production will connect to Supabase. Later, Google/Facebook login in this module shows “Login social próximamente”. But `supabase-client.js` already exposes `loginWithGoogle()` and `AlicynSupabase.signIn('google')`.

**Risk:** Users may see contradictory login behavior depending on which button/event path they trigger.

**Required V0.3 action:**

- Replace mock Google login path with `window.AlicynSupabase.signIn('google')`.
- Keep guest mode clearly separate from real auth.
- Update file comments so they reflect the actual architecture.

---

### Finding G — Write flows often fall back to localStorage without user-level confirmation

**Severity:** Medium/High depending on flow.

**Files:** `supabase-client.js`, `community.js`, `app.js`  
**Affected lines:** `supabase-client.js` approximately 104–141, 319–373, 466–760

Favorites and projects can fall back to localStorage. For normal UX this is acceptable. For intakes and consents this is sensitive because users/studios may believe records were formally stored.

**Required V0.3 action:**

- Add explicit sync status per record.
- Do not position local-only consent as production-ready.
- Add a visible warning if Supabase is unavailable during consent/intake save.

---

### Finding H — No automated browser flow tests

**Severity:** Medium.

The V0.2 audit only documents manual checks. V0.3 needs automated smoke tests for:

- Navigation tabs and bottom nav.
- Mapa → zone → drawer.
- Planner select/clear/export.
- Anatomy photo upload → add/move/delete point → summary/export.
- Inspo filter/favorite.
- Community login CTA behavior.
- Supabase unavailable fallback state.

**Required V0.3 action:**

- Add Playwright or at least a minimal static browser smoke test script.
- Add GitHub Actions workflow for static checks.

---

## 5. GitHub Pages/custom domain readiness

### Finding I — Root HTML references mixed asset paths

**Severity:** Medium.

**File:** `index.html`  
**Affected lines:** approximately 9–10

```html
<link rel="preload" href="assets/logo-alicyn.svg" as="image" type="image/svg+xml" />
<link rel="preload" href="body-map.png" as="image" type="image/png" />
```

If images are stored inconsistently between root and `assets/`, GitHub Pages may work in one environment and fail in another. V0.2 audit lists `assets/body-map.png`, but current preload points to `body-map.png` at root.

**Required V0.3 action:**

- Normalize asset locations.
- Prefer `assets/body-map.png` if assets are in `assets/`.
- Run a deployed asset smoke test on both GitHub Pages and piercemap.com.

---

### Finding J — No deployment documentation for custom domain

**Severity:** Medium.

No visible deploy checklist exists for DNS, CNAME, HTTPS, Supabase Site URL and Redirect URLs.

**Required V0.3 action:**

Create `DEPLOYMENT.md` with:

- GitHub Pages source branch/folder.
- `CNAME` requirement for `piercemap.com`.
- DNS records.
- HTTPS enforcement.
- Supabase redirect URLs.
- Cache invalidation/reload checklist.

---

## 6. Accessibility issues

### Finding K — Icon/touch controls need ARIA audit

**Severity:** Medium.

The README already flags incomplete `aria-label` validation as a pre-deploy checklist item. The codebase has many dynamic buttons generated through `innerHTML`, including zone buttons, drawer chips, bottom nav, icon buttons, modal controls and experience actions.

**Required V0.3 action:**

- Add `aria-label` to icon-only buttons.
- Ensure modals/drawers use `role="dialog"`, `aria-modal="true"`, labelled titles and focus trapping.
- Close modal/drawer with Escape.
- Return focus to the opening button.
- Ensure generated buttons have descriptive text for screen readers.

---

### Finding L — Focus states are inconsistent

**Severity:** Medium.

`language-switcher button:focus-visible` exists, but global `.btn`, dynamic `.zone-piercing-btn`, `.bottom-nav-btn`, `.exp-action`, `.state-chip`, `.ear-point` and drawer controls need consistent visible focus.

**Required V0.3 action:**

- Add global `:focus-visible` styles for all interactive elements.
- Test keyboard-only navigation.
- Avoid hover-only content revelation for critical information.

---

### Finding M — Dynamic modals likely do not lock background scroll or focus

**Severity:** Medium.

The drawer, login modal, add experience modal and summary modal use fixed overlays, but the audit did not find a central focus/scroll lock utility.

**Required V0.3 action:**

- Add utility functions: `openDialog`, `closeDialog`, `trapFocus`, `lockBodyScroll`.
- Apply across drawer, summary, login and add-experience modal.

---

## 7. Mobile Safari/iPad risks

### Finding N — `navigator.share`, clipboard and file APIs need Safari fallbacks

**Severity:** Medium.

The README says the app uses `Navigator.share`, `Navigator.clipboard`, FileReader, Canvas and Pointer Events. Safari support varies by context, HTTPS, permissions and user gesture. Clipboard can fail silently if not triggered by a direct user gesture.

**Required V0.3 action:**

- Wrap share/clipboard calls with explicit try/catch and user-visible fallback.
- For clipboard fallback, show manual text selection modal.
- Test on iPhone Safari and iPad Safari, not only Chrome DevTools.

---

### Finding O — Fixed bottom nav, modals and viewport units may conflict with Safari bars

**Severity:** Medium.

**File:** `index.html` CSS  
**Affected areas:** bottom nav, `100vh`, fixed overlays, `max-height: 90vh`, `env(safe-area-inset-bottom)`

The code already uses `viewport-fit=cover` and safe-area padding. Still, iOS Safari dynamic address bars can affect `100vh` layouts, fixed modals and bottom sheets.

**Required V0.3 action:**

- Test with real iPhone Safari, portrait and landscape.
- Consider `100dvh` fallback strategy for modals/stages.
- Verify bottom nav does not cover primary CTAs or form fields.

---

### Finding P — Large inline CSS/HTML increases parse and maintenance cost on mobile

**Severity:** Low/Medium.

`index.html` contains a very large inline CSS block and the full HTML shell. This works, but hurts maintainability and makes targeted diffs harder.

**Required V0.3 action:**

- Split CSS into `styles.css` before major UI work.
- Keep critical anti-FOUC boot script inline if needed.
- Optional: split feature markup later only if the static architecture remains manageable.

---

## 8. Files that should be split from `index.html`

Recommended split order:

1. `styles.css` — move the main CSS block out of `index.html`.
2. `styles.mobile.css` or mobile section inside `styles.css` — optional, only if CSS remains very large.
3. `supabase/schema.sql` — backend contract.
4. `supabase/policies.sql` — RLS policies.
5. `SUPABASE_SETUP.md` — auth, redirect URLs, table setup and safety model.
6. `DEPLOYMENT.md` — GitHub Pages/custom domain deployment.
7. `tests/smoke.spec.js` — Playwright smoke tests.

Do not split into a framework yet. Vanilla JS is still appropriate for V0.3.

---

## 9. Dead code, duplicated logic, undefined handlers

### Finding Q — Duplicate auth concepts

**Severity:** High.

`community.js` has local/mock auth state. `supabase-client.js` has real Supabase auth state. This creates two sources of truth:

- `state.user` in `community.js`
- `window.alicynAuth` / `window.AlicynSupabase` in `supabase-client.js`

**Required V0.3 action:**

- Define one auth source of truth: `window.AlicynSupabase`.
- Let community UI derive user from Supabase session when available.
- Keep guest/local mode as explicit fallback only.

---

### Finding R — Alternate Supabase schema attempts are technical debt

**Severity:** Medium.

`tryWrite()` receives multiple alternative insert/upsert shapes for the same operation. This is useful during migration but should not ship into V0.3 as the long-term state.

**Required V0.3 action:**

- Finalize schema.
- Remove alternate branches.
- Add explicit error messages when a backend contract fails.

---

### Finding S — README architecture is stale

**Severity:** Medium.

README still describes the app as running completely in the browser with no server, no login and no external data. Current code includes Supabase auth, profile sync and remote writes.

**Required V0.3 action:**

- Update README to say: static frontend + optional Supabase backend.
- Clarify demo/local fallback vs production mode.

---

## 10. Prioritized issue list

### P0 — Must fix before public V0.3

1. Verify Supabase anon key and RLS for all tables.
2. Create canonical `supabase/schema.sql` and `supabase/policies.sql`.
3. Resolve duplicate/mock auth vs real Supabase auth.
4. Make consent/intake storage status explicit.
5. Configure OAuth redirect URLs for GitHub Pages, piercemap.com and www.
6. Update README architecture to match current code.

### P1 — Should fix before wider testing

7. Create `SUPABASE_SETUP.md`.
8. Create `DEPLOYMENT.md`.
9. Normalize asset paths and confirm GitHub Pages/custom-domain loading.
10. Add Playwright smoke tests.
11. Add GitHub Actions workflow for syntax/static checks.
12. Add modal/drawer focus management and Escape close.
13. Add consistent focus-visible styles.

### P2 — Important but can follow V0.3 beta

14. Split `styles.css` from `index.html`.
15. Remove alternate Supabase schema write attempts.
16. Add manual clipboard/share fallback UI.
17. Add storage upload/moderation pipeline for community photos.
18. Add data retention/privacy policy copy.

---

## Recommended Codex follow-up tasks

### Task 1 — Supabase contract audit

```text
Inspect supabase-client.js and produce supabase/schema.sql + supabase/policies.sql for the tables currently used by the frontend: profiles, inspo_items, inspo_favorites, design_projects, community_experiences, intakes, consents. Use strict RLS. Do not modify app behavior yet.
```

### Task 2 — Auth source of truth

```text
Refactor community.js so Google auth calls window.AlicynSupabase.signIn('google') when available. Keep guest/local mode explicit. Remove contradictory “login social proximamente” behavior for Google. Do not change visual design.
```

### Task 3 — Setup docs

```text
Create SUPABASE_SETUP.md and DEPLOYMENT.md. Include GitHub Pages, piercemap.com, www.piercemap.com, Supabase Redirect URLs, CNAME, DNS/HTTPS checklist, anon key/RLS safety explanation and OAuth smoke tests.
```

### Task 4 — Browser smoke tests

```text
Add Playwright smoke tests for static PierceMap flows: initial load, navigation, zone drawer, planner selection, anatomy point workflow, inspo filter, community login CTA and Supabase unavailable fallback. Add GitHub Actions workflow to run syntax checks and smoke tests.
```

### Task 5 — Accessibility pass

```text
Audit and patch accessibility without visual redesign: aria labels, dialog roles, focus trap, Escape close, return focus, keyboard navigation and global focus-visible styles.
```

### Task 6 — CSS extraction

```text
Move the large inline CSS from index.html into styles.css while preserving the initial boot script and current visual design exactly. Update index.html references and verify GitHub Pages asset paths.
```

---

## Final recommendation

Proceed with V0.3 as a static app backed by Supabase, not as a full framework migration. The current architecture is still valid, but only if the backend contract becomes explicit and testable. The next concrete step should be the Supabase contract audit, because every auth/community/intake feature depends on RLS and schema correctness.
