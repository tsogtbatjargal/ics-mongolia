# Session Log

Append-only. Newest entry at the top. Each entry: date, what got done, what's next.

---

## 2026-08-21 — Results/"Proof of work" section hidden (temporary), NOT YET committed

- User's reasoning: the company just started, `#results` is still 100% bracketed placeholder
  copy (`[Client name]`, `[X%]`, etc. — see Phase 3 in `PLAN.md`), and it reads as fake/dishonest
  to visitors right now. Wants it hidden until real case studies/testimonials exist, with an
  easy, safe way to bring it back later — not a deletion.
- Implementation is a reversible **content flag**, not a code/structural removal, so it fits
  the CMS-driven build without fighting `build.js`:
  - Added `results.enabled: false` as the first key under `results:` in both
    `content/en.yml` and `content/mn.yml`.
  - `build.js`: in the `results` block, added logic that sets the native HTML `hidden`
    attribute on `<section id="results">` and on the `<li>` wrapping the `href="#results"`
    nav link whenever `rs.enabled === false`. `hidden` is used (not a CSS class) because
    browsers strip it from layout *and* the accessibility tree for free, no `styles.css`
    change needed, and `script.js`'s `IntersectionObserver` scroll-spy and nav-link
    `querySelectorAll` calls already tolerate a hidden section/link with no errors (checked
    the relevant loops in `script.js`).
  - `.pages.yml`: added an `enabled` boolean field (`type: boolean`, `default: true`) to the
    `results_section` component, with a plain-language label/description, so this can be
    toggled from the Pages CMS UI directly — no YAML hand-editing required going forward.
  - **To bring it back later:** flip `results.enabled` to `true` (or check the box in the
    CMS) in *both* `content/en.yml` and `content/mn.yml`, run `npm run build`, verify, commit,
    push. One flag, no content lost — all the existing placeholder case studies/testimonials
    are still sitting in the YAML untouched, ready for real facts whenever those land (per
    Phase 3 in `PLAN.md`).
- Verified: `npm run build` clean (all 4 generated pages), `node --check script.js` OK,
  local-asset-reference checker clean, confirmed via local `python3 -m http.server 4173` that
  `hidden=""` is present on both the nav `<li>` and the `<section>` in the served `en/`
  and `mn/` HTML.
- **Not committed or pushed yet** — holding per the standing rule (see `HANDOFF.md`) of
  getting explicit confirmation before `git commit`/`git push` on this repo.
- **Next:** get user's go-ahead to commit + push (this deploys automatically via the GitHub
  Action). No other action needed — this is a complete, self-contained change.

## 2026-08-20 — Post-productionization cleanup (4 small fixes), committed + pushed

- After the Phase 3/4 productionization push, user asked "anything to improve or leftover
  things?" and authorized fixing four small items found during self-review:
  1. **Mobile nav breakpoint widened 900px → 1080px** (`styles.css`) — the nav grew to 7 items
     (added "Results") and risked wrapping/overflow before the hamburger kicked in at narrower
     viewports; no browser available in this environment to confirm the exact overflow point,
     so widened the breakpoint defensively.
  2. **Removed dead CSS** — `.contact-grid.single` rule in `styles.css`, orphaned once the
     contact form made `.contact-grid` always two-column.
  3. **ICS-FOD product page nav labels synced from CMS** — `buildProductPage()` in `build.js`
     now updates `.nav-links` `textContent` from `content/*.yml`'s `navigation` list (labels
     only, hrefs left alone since the product page intentionally uses cross-page absolute
     links like `/en/#overview` instead of the homepage's same-page anchors).
  4. **`og:image:width`/`og:image:height` added** to both product-page files — dimensions
     (764×489) read directly from the PNG's IHDR header via a small Node script (PIL wasn't
     available in this environment).
- Verified: `npm run build` clean, local-asset-reference checker clean, `node --check
  script.js` OK, JSON-LD valid on all 4 generated pages, local HTTP smoke test all 200.
- Committed and pushed to `main` per user's "fix them and commit push."
- **Next:** Phase 3 content (real case-study facts, testimonial quotes) and the MN
  native-review pass remain the open items; Phase 4's only remaining item is the blog/news
  scope decision.

## 2026-08-20 — Phase 3/4 prototypes productionized (CMS-wired, not yet committed)

- After reviewing the four `/preview/` drafts live, user asked to wire all four into the real
  site properly — CMS-editable, not static drafts — rather than leave them in `/preview/`.
  Removed `/preview/` (superseded) and built each one for real:
  - **New `#results` homepage section** (between Approach and Team, new "Results" nav item):
    case-study cards + testimonial cards, still placeholder content but now driven by
    `results.case_studies` / `results.testimonials` in `content/en.yml` / `content/mn.yml`,
    editable via Pages CMS (`results_section` component added to `.pages.yml`).
  - **Dedicated ICS-FOD product page** at `/en/products/ics-fod/` + `/mn/products/ics-fod/` —
    new `buildProductPage()` function in `build.js`, driven by
    `ai_solutions.product.product_page` (hero copy, spec table, how-it-works steps, contact
    CTA — all CMS-editable via a new `product_page` component). Linked from a "Full
    specifications" button added to the homepage AI Solutions section. Added to `sitemap.xml`
    with hreflang alternates; not `noindex` since it's real content now.
  - **Contact form** — added beside "Direct contacts", CMS-editable labels/placeholders
    (`contact.form`). Before wiring this in, flagged a real risk to the user: the `/preview/`
    demo showed a fake "message sent" state with no backend, which on the live site would
    silently lose real leads. User chose the `mailto:` fallback over a real POST backend
    (which would've needed a new Worker script + email-sending method not yet set up) —
    ships today, same delivery reliability as the existing mailto links. Implemented as a
    guarded `.contact-form` submit handler in `script.js` that builds a `mailto:` link from
    the field values.
  - MN copy for all of the above is a machine translation, same caliber as existing MN
    content — queued behind the same native-speaker pass as the rest of Phase 3.
  - Extended `build.js`'s existing selector-based sync pattern rather than introducing a new
    templating approach, so the CMS/YAML/build.js contract described in the repo's `CLAUDE.md`
    still holds for every new field.
- Verified: `npm run build` clean (4 files: `en/index.html`, `mn/index.html`, both product
  pages), local-asset-reference checker extended to cover the two new product-page files
  (clean), `node --check script.js` OK, JSON-LD valid on all 4 pages, local HTTP smoke test
  (`/`, `/en/`, `/mn/`, both product pages, `robots.txt`, `sitemap.xml`, product image) all
  200.
- **Not yet committed or pushed** — this is a substantial change (new pages, new CMS schema,
  new nav item, new contact-form behavior) touching the live site; needs the user's explicit
  go-ahead before `git commit`/`push` per the standing ground rule.
- **Next:** get user confirmation to commit + push. After that, Phase 3 content
  (case-study facts, testimonial quotes) and the Phase 3 MN native-review pass are the
  remaining open items; Phase 4's only remaining item is the blog/news scope decision.

## 2026-08-20 — Phase 3/4 prototypes pushed to /preview/ for live review

- Built four draft prototypes for Phase 3/4 candidates, at the user's request, to look at
  before deciding what to build for real: a dedicated ICS-FOD product page (real specs,
  restructured into a spec table + "how it works" steps), a contact form UI (client-side demo
  only — no backend wired, that decision is still open), a testimonials section layout, and a
  case-study section layout. The latter two use only bracketed placeholder text
  (`[Client name]`, `[X%]`, etc.) — no fabricated names, quotes, or metrics, per the
  never-fabricate-facts rule in `HANDOFF.md`.
- Originally built inside `ics-mongolia-improvements/prototypes/` for a local-only look, but
  that folder is `.assetsignore`d — invisible even after a deploy. User asked to see them on
  the actual production site, so moved all four into a new **`/preview/` folder at the repo
  root** (not assetsignored), fixed relative asset paths accordingly, added
  `<meta name="robots" content="noindex, nofollow">` to each page, and added
  `Disallow: /preview/` to `robots.txt` so they stay unindexed and unlinked while still being
  publicly reachable by direct URL. Ran `npm run build` (no-op, content unchanged), the
  local-asset-reference checker (extended to also cover the new `/preview/` files — clean),
  and a local HTTP smoke test (all four + `robots.txt` returned 200).
- Committed (`41a5ec0`, plus an earlier `6d7316a` for the HANDOFF.md/PLAN.md/LOG.md updates
  from the Phase 2 session) and pushed to `origin/main` with explicit user confirmation. No
  push conflicts. Live at:
  - `https://icsmongolia.com/preview/ics-fod-product-page.html`
  - `https://icsmongolia.com/preview/contact-form.html`
  - `https://icsmongolia.com/preview/testimonials-section.html`
  - `https://icsmongolia.com/preview/case-study-section.html`
- **These are temporary and should be deleted once the user is done reviewing** — draft
  content shouldn't linger indefinitely on the live domain even if unlinked/noindexed. Flag
  this to the user in a future session if it's still sitting there.
- **Next:** get the user's reaction to each of the four (keep/change/drop), and ask again
  whether they have real testimonial quotes or case-study facts to replace the placeholders
  with — those two sections can't move forward without real input.

## 2026-08-20 — Phase 2 (Analytics) done via Cloudflare auto-inject

- User confirmed Cloudflare Web Analytics as the provider and enabled it directly in Badraa's
  Cloudflare dashboard (**Analytics & Logs → Web Analytics → Manage site**). Cloudflare offered
  automatic edge-side beacon injection (since `icsmongolia.com` is already a proxied zone
  there) instead of the manual-snippet route `PLAN.md` had originally planned — user clicked
  plain **Enable** (all visitors, no EU exclusion).
- Net result: no repo changes needed at all — no HTML edits, no rebuild, no deploy. The
  original manual-snippet checklist in `PLAN.md` is kept collapsed for reference in case
  auto-inject ever needs to be swapped for a version-controlled snippet later.
- Marked Phase 2 ✅ in `PLAN.md`, added a "Decisions made so far" entry.
- **Not yet verified:** actual traffic appearing in the Web Analytics dashboard — needs a real
  visit + a few minutes, then a dashboard check. Nothing to commit/push this session since no
  files in the deployed site changed (only this planning folder, which is `.assetsignore`d).
- **Next:** confirm traffic is showing up in the dashboard when convenient, then move to
  Phase 3/4 once you have real input (case study facts, testimonial quotes, ICS-FOD page
  scope, contact-form backend choice, or blog commitment).

## 2026-08-20 — MN overview text sync + Phase 2 prep

- Spotted that the concurrent CMS edit (see previous entry) reworded `content/en.yml`'s
  `overview.text` to a new "resource-limited environments" pitch but left
  `content/mn.yml`'s `overview.text` on the old wording — EN/MN had gone out of sync.
  Translated the new EN paragraph into Mongolian, updated `content/mn.yml`, rebuilt, verified
  (asset-ref checker, `node --check script.js`), committed (`85d2f52`), pushed. Flagged in
  `PLAN.md` that this is a machine-quality translation, same caliber as the rest of the
  existing MN copy — still needs the native-speaker pass already queued in Phase 3.
  Recorded as the first entry under `PLAN.md`'s "Decisions made so far".
- Checked tsogtb.com (a separate, unrelated personal-portfolio project/repo — not part of this
  plan) at the user's request; confirmed still live and correct from an earlier session, no
  action needed there.
- Fleshed out Phase 2 (Analytics) in `PLAN.md` into a ready-to-execute checklist for the
  Cloudflare Web Analytics path (dashboard steps → snippet → where it gets added → verification),
  plus a shorter note on what the GA4 path would look like instead. Still blocked on: you
  confirming the provider, and someone with Badraa's Cloudflare account access completing the
  dashboard signup step to hand back the beacon token.
- **Next:** once you confirm the analytics provider (or hand me the Cloudflare beacon
  token/GA4 measurement ID), Phase 2 is ready to execute in one pass. Otherwise, next candidate
  is a Phase 3/4 item once you have real input (case study facts, testimonial quotes, ICS-FOD
  page scope, contact-form backend choice, or blog commitment).

## 2026-08-20 — Phase 1 implementation

- Completed all of Phase 1 (Foundation): OG/Twitter meta tags, `robots.txt` + `sitemap.xml`,
  schema.org Organization JSON-LD, a real favicon set cropped from `images/ics-logo.png`
  (replacing the old one that mistakenly pointed at the ICS-FOD product logo), WebP versions of
  the two heaviest images wired in via `<picture>` with the original as fallback, a preload hint
  for the hero WebP, and an alt-text audit (already clean, no changes needed).
- New/changed files: `robots.txt`, `sitemap.xml`, `images/favicon-{32,192,512}.png`,
  `images/apple-touch-icon.png`, `images/control-room-mining-site.webp`,
  `images/ics-fod-product.webp`, plus head/body edits to `en/index.html`, `mn/index.html`,
  `index.html`. None of this touched `content/*.yml` or `build.js` — all additive/structural,
  confirmed to survive `npm run build` (build.js doesn't touch `<head>` or image wrappers).
- Used `sharp` for image work (cropping the favicon, WebP conversion) — installed with
  `--no-save` and removed afterward, so it's not a new project dependency.
- Verified: `npm run build` clean, local-asset-reference checker passes, JSON-LD is valid JSON
  on both pages, `script.js` syntax OK, local HTTP smoke test on `/`, `/en/`, `robots.txt`,
  `sitemap.xml`, and the new `.webp` files all returned 200.
- Committed (`c2fc054`) and pushed. `git push` was rejected first — 4 commits had landed on
  `origin/main` in the meantime via Pages CMS (real copy edits to `content/en.yml`/`mn.yml`:
  reworded `overview.text`, `hero.photo_label`/`photo_meta`, plus a Mongolian typo fix).
  Merged clean (no conflicts — their edits and mine didn't touch the same lines), then re-ran
  `npm run build` to sync the new CMS text into `en/index.html`/`mn/index.html` on top of the
  Phase 1 structural changes, verified again, and pushed as `b91ce4f`. Confirmed my hardcoded
  OG/Twitter description text still matches the actual `<title>`/`<meta description>` tags,
  since those aren't YAML-driven and weren't touched by the CMS edit.
- **Next:** Phase 2 (analytics — needs your confirmation on provider, default assumption is
  Cloudflare Web Analytics) or skip ahead to whichever Phase 3/4 item you have real input for.

## 2026-08-20 — Planning session

- Surveyed the current site (`content/en.yml`, `en/index.html` head, `images/`, git log) and
  confirmed: no analytics, no Open Graph/Twitter tags, no `robots.txt`/`sitemap.xml`, no
  schema.org markup, favicon points at the wrong logo, two uncompressed images
  (`ics-fod-product.png` 388 KB, `control-room-mining-site.jpg` 204 KB), no compression tooling
  installed (`cwebp`/`imagemagick`/`sharp` all absent).
- Wrote `PLAN.md` grouping improvements into 4 phases: Foundation (no decisions needed),
  Analytics (one provider decision), Content & credibility (blocked on real facts from the
  team — case studies, testimonials, MN translation pass), Structural (scope decisions: ICS-FOD
  dedicated page, contact form backend, blog).
- Added `ics-mongolia-improvements` to `.assetsignore` so this planning folder is git-tracked
  but never deployed as a public asset.
- **Next:** start Phase 1, in the order listed in `PLAN.md` (OG/Twitter meta tags first —
  smallest, highest-visibility win).
