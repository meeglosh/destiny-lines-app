# Destiny Lines — App Store Submission Checklist

The code is submission-ready; the steps below are account/console setup that only you can do.
Work through them in order.

## 1. Apple Developer account

- [ ] Enroll at https://developer.apple.com ($99/yr). Approval can take a day or two.
- [ ] Register an App ID (bundle identifier). The code currently uses the placeholder
      **`com.destinylines.app`** — if you pick something else, update it in `app.json`
      (`ios.bundleIdentifier` and `android.package`) before your first build.
      The bundle ID can never change after the app ships.

## 2. Supabase backend (project `zbgjgfvssyfkxnfkpyfd` — "Destiny Lines AI")

The app points at the fresh project you created on 2026-07-06. The original
builder-era project is renamed "Destiny Lines AI (OLD)" and can be deleted.

- [x] Migration applied (`supabase db push`, 2026-07-06)
- [x] Edge functions deployed: analyze-palm, delete-account, sync-subscription
- [ ] Set function secrets (Dashboard → Edge Functions → Secrets, or
      `supabase secrets set KEY=value`):
      - `OPENAI_API_KEY` — your own OpenAI API key (platform.openai.com).
        Readings fail with "Service configuration error" until this is set.
      - `REVENUECAT_SECRET_KEY` (from RevenueCat, step 3)
- [ ] Delete the two obsolete projects to avoid confusion:
      "Destiny Lines AI (OLD)" (hbozjbhfpxsiazkbdkqr) and the CLI-created
      "destiny-lines" (loqgjjhhqivkoligpzyz) under your other Supabase account
      (also delete ~/.destiny-lines-db-password once that project is gone).
- [ ] Auth settings: decide whether "Confirm email" is on. The app handles both,
      but leaving it ON means Apple's reviewer must verify an email — for review,
      easier to turn it OFF or provide a pre-verified demo account (step 5).

## 3. RevenueCat + products

- [ ] Create a RevenueCat account + project, add an iOS app with your final bundle ID.
- [ ] In App Store Connect, create a subscription group with two auto-renewable products,
      e.g. `destiny_standard_monthly` ($4.99) and `destiny_premium_monthly` ($14.99).
      Product IDs must contain "standard" / "premium" — the paywall matches on that.
- [ ] In RevenueCat: create entitlements with the exact IDs **`standard`** and **`premium`**,
      attach each product, and add both packages to the default (current) offering.
- [ ] Copy the RevenueCat **public iOS API key** into `app.json` →
      `extra.revenueCatIosApiKey` (replace the PLACEHOLDER value).
- [ ] Copy a RevenueCat **secret API key** into the Supabase function secret
      `REVENUECAT_SECRET_KEY` (used by sync-subscription to verify entitlements server-side).
- [ ] Recommended hardening for later: add a RevenueCat webhook that calls a Supabase
      function on renewal/cancellation, so expirations sync without the app opening.

## 4. Legal pages

- [ ] Push this repo to GitHub, then enable GitHub Pages:
      repo Settings → Pages → Deploy from branch → `main`, folder `/docs`.
- [ ] Verify the URLs in `utils/constants.ts` resolve:
      - https://meeglosh.github.io/destiny-lines-app/privacy.html
      - https://meeglosh.github.io/destiny-lines-app/terms.html
      (If you use a custom domain instead, update `LEGAL_URLS` in `utils/constants.ts`.)
- [ ] Make sure `support@destinylines.app` (in `utils/constants.ts` and the legal pages)
      is a real mailbox, or change it everywhere to one you own.

## 5. App Store Connect app record

- [ ] Create the app (name "Destiny Lines", your bundle ID).
- [ ] Privacy policy URL: the privacy.html URL above.
- [ ] App Privacy "nutrition label" answers, based on what the app actually does:
      - Contact info (email) — linked to identity, for app functionality
      - Photos — collected but **not** linked/retained (analyzed only, never stored)
      - User content (readings) — linked to identity, for app functionality
      - Purchases — linked to identity
      - No tracking, no third-party advertising
- [ ] Age rating questionnaire (the app self-restricts to 16+ in its terms).
- [ ] App Review notes: include a **demo account** (email + password of a pre-verified
      test account) and mention that palm readings require a photo of a palm —
      reviewers can use the Upload Photo option with any palm image.
- [ ] Screenshots for 6.7" and 6.5" iPhones (and iPad if you keep `supportsTablet: true`).

## 6. Build & submit with EAS

- [ ] `npm i -g eas-cli && eas login`
- [ ] `eas init` (links the project; adds `extra.eas.projectId` to app.json)
- [ ] `eas build -p ios --profile production`
- [ ] Test on TestFlight first: sign up, get free readings, buy each tier in sandbox,
      restore purchases, delete account.
- [ ] `eas submit -p ios`

## 7. Security cleanup (do this soon)

- [ ] Your local git remote URL embeds a GitHub personal access token
      (`git remote -v` shows it). Rotate that token on GitHub and switch the remote to
      SSH or a credential helper:
      `git remote set-url origin git@github.com:meeglosh/destiny-lines-app.git`
- [ ] The Supabase anon key in `lib/supabase.ts` is designed to be public, but it is only
      safe because Row Level Security is enabled — don't weaken the RLS policies in the migration.

## 8. Final smoke test (fresh install)

- [ ] Intro carousel → onboarding disclaimer → agree to terms → sign up
- [ ] 3 free readings work end-to-end with a real palm photo (camera and upload)
- [ ] Non-palm photo is rejected gracefully
- [ ] 4th reading prompts the paywall; purchase unlocks 20/100 monthly readings
- [ ] History shows past readings; share works
- [ ] Profile: privacy/terms links open, support email opens, sign out works,
      delete account works and returns to the auth screen
