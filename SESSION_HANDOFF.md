# Destiny Lines — Session Handoff

Last updated: 2026-07-11. Written so a new Claude Code session (or you) can pick up
instantly without re-reading the whole chat history.

## TL;DR

The app went from a UI shell with a fully faked palm reader and fake paywall to a
real, working product with a live backend. **Code is done and pushed to `main`
(commit `00ffc89`).** Backend is deployed and smoke-tested end-to-end. What's left
is entirely account/console setup only you can do — see `SUBMISSION_CHECKLIST.md`
for the itemized list. This file explains *how we got here* and *why things are
where they are*, so nothing gets re-litigated or re-discovered from scratch.

## What this app is

Destiny Lines: an Expo Router (SDK 54) app that takes a photo of your palm,
sends it to OpenAI vision via a Supabase edge function, and returns an
AI-generated "palm reading" (life/head/heart/fate lines, etc.) for entertainment
purposes. Free tier (3 lifetime readings) → paid Standard/Premium monthly
subscriptions via RevenueCat.

## Timeline of this work

1. **Audit.** Found the app was a template ("Natively") with a completely fake
   core: the home screen returned a hardcoded mock reading regardless of the
   photo; a real `analyze-palm` OpenAI edge function existed but was never
   called; the paywall's "Subscribe" button just showed a "Coming Soon" alert
   with a "🧪 Enter Testing Mode" bypass; auth was unreachable in the normal
   nav flow so nothing ever persisted; no iOS camera/photo permission strings
   (guaranteed crash + rejection); Delete Account / Privacy / Terms were all
   "coming soon" stubs; app was still branded `com.anonymous.Natively`.

2. **User decisions locked in (asked once, don't re-ask):**
   - Payments: RevenueCat (not raw StoreKit)
   - Free experience: a few free trial readings, then paywall (landed on 3)
   - App name: "Destiny Lines"
   - Bundle ID: **placeholder** `com.destinylines.app` — user's Apple Developer
     account isn't set up yet. Swap this the moment a real App ID exists.
   - Legal pages: Claude-drafted privacy policy + terms, hosted via GitHub
     Pages from `docs/`

3. **Big implementation pass** (commit `8a9a8ed`, "Make app production-ready
   for App Store submission" — 46 files changed):
   - Wired real palm analysis end-to-end; removed all mock/testing-mode code
   - Rewrote `analyze-palm` edge function to authenticate the caller and
     derive tier + quota **server-side** (client is never trusted for this)
   - Added `supabase/migrations/20260706000000_init_destiny_lines.sql`:
     `readings`, `usage_stats`, `subscriptions` tables, RLS policies, a
     `get_reading_quota` / `consume_reading` RPC pair that's the single
     source of truth for free/standard/premium limits
   - Added `delete-account` edge function (Apple requires in-app account
     deletion) and `sync-subscription` edge function (verifies RevenueCat
     entitlements server-side, mirrors into `subscriptions` — clients can't
     write that table directly)
   - Rewrote the paywall to use real RevenueCat offerings/purchase/restore
   - Fixed the nav flow: intro → onboarding (disclaimer + ToS agree, with
     real links) → auth → tabs; session-aware root redirect
   - Wrote `docs/privacy.html` + `docs/terms.html`, wired links into
     onboarding/paywall/profile
   - Added camera/photo-library permission strings via the `expo-image-picker`
     config plugin in `app.json`
   - Generated a placeholder icon/splash/adaptive-icon (neon palm-lines motif)
     with a Python/Pillow script — **fine for testing, swap before real
     submission if you want a designed icon**
   - Removed dead template code: `chat_history.json` (an accidentally
     committed 224KB AI-builder transcript), unused modal/formsheet screens,
     duplicate Supabase client, unused stores/hooks/contexts, unused deps
     (`react-native-vision-camera`, `react-native-maps`, `react-native-webview`,
     `react-router-dom`, `difflib`, `eas`, `@bacons/apple-targets`)
   - Fixed pre-existing TS errors unrelated to this work (FloatingTabBar,
     IconSymbol type mismatches) so `tsc --noEmit` is clean
   - Verified: `tsc` clean, `eslint` clean, `expo export --platform ios
     --clear` bundles through Hermes with no errors

4. **GitHub Pages enabled** by the user (dashboard, Settings → Pages →
   `main` / `/docs`). Verified live:
   - https://meeglosh.github.io/destiny-lines-app/privacy.html
   - https://meeglosh.github.io/destiny-lines-app/terms.html

5. **Supabase backend migration** (commit `a8ee578`, then `8125cab` for
   `.gitignore` cleanup). This took two attempts:
   - First created a project called `destiny-lines` (ref
     `loqgjjhhqivkoligpzyz`) under the Supabase account/org that owns the
     user's `wovenmusic-app` project, because the CLI was logged into that
     account and the original app's project (`hbozjbhfpxsiazkbdkqr`) wasn't
     visible to it.
   - User then created their own new project in the browser
     (`zbgjgfvssyfkxnfkpyfd`, "Destiny Lines AI") under a **different**
     Supabase account (the one that also owns the original builder-era
     project, now renamed "Destiny Lines AI (OLD)"). Had the user run
     `supabase login` in their own terminal to authenticate the CLI as that
     account, then re-linked and re-migrated everything there.
   - **Current source of truth: project `zbgjgfvssyfkxnfkpyfd`.** Migration
     applied, all three edge functions deployed. `lib/supabase.ts` and
     `supabase/config.toml` point at it.
   - **Cleanup not yet done:** the redundant `loqgjjhhqivkoligpzyz` project
     (under the *other* account) and the old `hbozjbhfpxsiazkbdkqr` project
     should both be deleted to avoid future confusion. A generated DB
     password for the redundant project is sitting in
     `~/.destiny-lines-db-password` on this machine — delete it once that
     project is gone.

6. **OpenAI key set, full smoke test run** (commit `00ffc89`). Wrote a bash
   smoke-test script (not committed — it's throwaway, lived in a job scratch
   dir) that: created a confirmed test user via the admin API, signed in,
   checked quota (3/3 free), called `analyze-palm` with a real downloaded
   palm photo, checked quota decremented (3→2), confirmed the reading
   persisted in `readings` (RLS-scoped), deleted the account via
   `delete-account`, confirmed sign-in fails afterward.
   - **First run failed**: the model rejected a genuine photo of two open
     palms as "not a clear photo of a human palm." This was a real bug that
     would have frustrated real users, not a test artifact.
   - **Fixed**: loosened the rejection instruction in the `analyze-palm`
     system prompt to only reject when *no* palm is visible at all (not for
     imperfect angle/lighting/cropping). Redeployed. Re-ran the full test —
     everything passed, including that a genuinely non-palm image still gets
     rejected correctly.

## Current repo state

- Branch `main`, HEAD `00ffc89`, working tree clean, fully pushed to
  `github.com/meeglosh/destiny-lines-app`.
- `SUBMISSION_CHECKLIST.md` is the authoritative itemized to-do list for
  everything that still needs a human (Apple Developer enrollment,
  RevenueCat + App Store Connect product setup, EAS build, final QA pass).
  **Read that file next** — this handoff doc explains context, that one
  tells you what to click next.

## Things a new session should know without re-deriving

- **Don't re-ask about payments/free-tier/name/legal-hosting decisions** —
  they're locked in above.
- **Don't be surprised by two abandoned Supabase projects** in the account
  list — they're cleanup debt, not active infrastructure. The live one is
  `zbgjgfvssyfkxnfkpyfd`.
- **The bundle ID `com.destinylines.app` is a placeholder.** The instant the
  user has a real Apple Developer App ID, update `app.json`
  (`ios.bundleIdentifier`, `android.package`) before any EAS build.
- **RevenueCat API keys in `app.json` → `extra` are still placeholder
  strings** (`REVENUECAT_IOS_API_KEY_PLACEHOLDER` etc.) — the paywall code
  checks for this and gracefully disables purchasing rather than crashing,
  so the app is safe to run in a simulator right now, but subscriptions
  won't actually work until real keys are in.
- **Native module added (`react-native-purchases`) means Expo Go no longer
  works** — must use `npx expo run:ios` (or `run:android`) for a dev build,
  or EAS build for TestFlight.
- User was about to test in the iOS Simulator when this session ended (asked
  "how can I test this in a simulator" and got instructions to run
  `npx expo run:ios`; camera doesn't work in simulator, use Upload Photo with
  a dragged-in image instead). That's a good next step after restart.
- One outstanding hygiene item from the original audit, still unresolved:
  the git remote URL has a GitHub personal access token embedded in it
  (`git remote -v`). Should be rotated and switched to SSH — see
  `SUBMISSION_CHECKLIST.md` section 7.

## Suggested next steps, in order

1. Restart, then `cd ~/destiny-lines-app && npx expo run:ios` to see the real
   app running against the real backend in a simulator.
2. Apple Developer enrollment → get real bundle ID → update `app.json`.
3. RevenueCat account + App Store Connect subscription products →
   real API keys into `app.json` extra + `REVENUECAT_SECRET_KEY` Supabase
   secret.
4. Clean up the two abandoned Supabase projects.
5. Rotate the leaked GitHub PAT / switch remote to SSH.
6. EAS build → TestFlight → final manual QA pass (checklist section 8) →
   submit.
