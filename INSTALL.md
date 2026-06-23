# Sweep — install & run

A Tinder-style photo cleanup app. Browse albums → swipe **right to keep**, **left to
stage for deletion**. Left-swiping is **non-destructive**: photos are only collected
into an in-app **Trash** list. Nothing is removed from your library until you open Trash
and tap **Delete** (which triggers iOS's own confirmation → Recently Deleted).

Built with Expo SDK 56 (React Native 0.85), iOS 26 ready.

---

## Option A — Run it today on your iPhone (free, no Apple account, no .ipa)

Uses the **Expo Go** app. Fastest way to actually use Sweep.

1. Install **Expo Go** from the App Store on your iPhone.
2. On this Mac, in the project folder:
   ```
   npx expo start
   ```
3. Scan the QR code with the iPhone Camera, open in Expo Go.

> Both devices must be on the same Wi-Fi (or use `npx expo start --tunnel`).

---

## Option B — Build an unsigned `.ipa` for SideStore (free, no paid Apple account)

SideStore re-signs apps on-device with your own free Apple ID, so we only need to produce
the **`.ipa` binary** — SideStore handles signing + install. Compiling an iOS binary needs
the full Xcode toolchain (iOS SDK), which isn't on this Mac. So we build it on a **free
macOS CI runner (GitHub Actions)** and download the result.

A ready-to-run workflow lives at `.github/workflows/build-ipa.yml`.

1. Push this project to a GitHub repo:
   ```
   git add -A
   git commit -m "Sweep app"
   git branch -M main
   git remote add origin https://github.com/<you>/photoslide.git
   git push -u origin main
   ```
2. On GitHub → **Actions** tab → run **“Build unsigned IPA”** (it also runs automatically
   on push to `main`). Build takes ~10–20 min on a `macos-15` runner.
3. When it finishes, open the run → **Artifacts** → download **`Sweep-unsigned-ipa`**
   (a zip containing `Sweep.ipa`).
4. Get `Sweep.ipa` onto your iPhone and open it in **SideStore** → it signs with your
   free Apple ID and installs. (Free-account apps expire after 7 days; just refresh in
   SideStore, or re-run the workflow for a fresh build.)

> The workflow archives with `CODE_SIGNING_ALLOWED=NO` and zips the `.app` into a
> `Payload/` folder — a standard unsigned `.ipa` that SideStore/AltStore accept.

### Alternative: paid Apple Developer account + EAS
If you ever get the Apple Developer Program ($99/yr), `eas.json` already has a `preview`
profile: `npx eas-cli@latest build -p ios --profile preview` builds & signs an `.ipa` in
the cloud with no Xcode needed locally.

### Why not build the `.ipa` locally?
Local builds need **full Xcode** (~40 GB; only Command Line Tools are installed here, with
no iOS SDK). CI gives you a clean macOS box with Xcode for free.

---

## Project layout

```
src/
  app/
    _layout.tsx     Root navigator + providers (gesture root, theme, Trash store)
    index.tsx       Albums grid + photo-permission gate
    swipe.tsx       Tinder-style swipe deck + action bar
    trash.tsx       Staged photos, select + confirmed delete (modal)
  components/        AppText, IconButton (SF Symbols), GlassBar (Liquid Glass), SwipeDeck
  store/trash.tsx    In-app staging list, persisted via AsyncStorage
  lib/media.ts       expo-media-library helpers (albums, paged photo loading)
  theme/             Design tokens (HIG type ramp, semantic light/dark colors) + hook
```
