# LumaSkin — web build

The Figma Make prototype, running as a plain Vite + React + Tailwind v4 app.
Desktop shows a centred iPhone 15 Pro frame; on a real phone the frame drops
away and the app fills the screen. Installable as a PWA.

> Replaces the hand-written HTML/CSS PWA that lived here until commit `25b1a6b`
> — that version is still in the history if you need to pull anything back out.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/
```

## Deploy to Vercel

1. `git init && git add -A && git commit -m "init"` then push to a GitHub repo.
2. Vercel → **Add New… → Project** → import the repo.
3. Framework preset **Vite** is auto-detected. Build `npm run build`, output `dist`.
   No environment variables are needed — the app has no backend.
4. Deploy.

CLI alternative: `npx vercel --prod` from this folder.

## What changed vs. the raw Figma Make export

| | |
|---|---|
| **Fonts** | Make emitted families as `Inter:Medium`, `SF Pro Text:Bold`, … — names no font actually provides, so every one silently fell back to the browser default. Families are now real, weight comes from the companion `font-*` class, and Inter is self-hosted via `@fontsource-variable/inter` (Google Fonts is unreachable from mainland China). |
| **Splash wordmark** | Was live text in `Notable` + `Helvetica Neue Thin`. Helvetica Neue only exists on Apple devices, so the lockup is drawn from your original Figma vector (`src/assets/brand.svg`) — identical on every platform, and nothing to wait on at load. |
| **Build config** | `vite.config.ts` dropped four Figma-internal plugins (site.json head injection, HMR error-overlay replay, refresh-boundary fallback, `/.figma/make/kit.html`). `index.html` had `<!-- figma:title -->`-style placeholders that only Figma's build filled in; those are now real tags. |
| **Images** | 6.4 MB of PNG → 385 KB of WebP at the same pixel dimensions (quality 92). Renamed to match your `asset/` folder: `hero-skin`, `onboarding-1/2/3`. |
| **Dead weight** | Removed `.figma/`, `AGENTS.md`, `CLAUDE.md`, `.mise.toml`, `pnpm-lock.yaml`, a duplicate top-level `imports/`, an unused 200 KB `Frame94` component, and a blank 256×256 placeholder that sat invisible under onboarding screen 1. |
| **Responsive** | `.app-stage` / `.phone-frame` / `.phone-island` / `.phone-screen` / `.phone-home` / `.status-bar` in `src/index.css` drive the desktop-frame ⇄ full-screen switch at a 520 px breakpoint, with `100dvh` and `env(safe-area-inset-*)` for iOS. |
| **Status bar** | The Dynamic-Island inset lives on `.status-bar` (via `--chrome-top`), not on the screen, so login and the onboarding screens can run their image to the top edge with the bar floating over it. On phones the mock bar's contents are hidden and it collapses to the safe-area inset. |
| **Cursor** | Tailwind v4 changed the default button cursor to `default`. Restored to `pointer` — this prototype is nothing but buttons. |

## Things you may want to tweak

- **The fake status bar** (`9:41 / 100%`) shows on desktop only. On phones its
  contents are hidden — the device draws a real one — and the element collapses
  to `env(safe-area-inset-top)` so content still clears the notch. To bring it
  back on mobile, drop the `.status-bar > * { display: none }` block from the
  media query in `src/index.css`.
- **Breakpoint.** 520 px in `src/index.css` — raise it if you want tablets to go
  full-screen too.
- **`src/FlowMap.tsx`** renders every screen on one board. Nothing imports it; wire
  it to a `?flow` query param if you want an all-screens overview page.

## PWA

`public/manifest.webmanifest` + `public/sw.js`, registered from `src/main.tsx`.
Icons are generated from the real LumaSkin mark (`src/assets/logo-mark.svg`) on
the `#1a1a2e` stage colour, at 192/512 plus a maskable 512 and a 180 px
apple-touch-icon.

The service worker is hand-rolled rather than pulled from `vite-plugin-pwa`, so
there is no extra build dependency to keep green. Navigations are network-first
(a redeploy shows up immediately, the cached shell covers offline); everything
else is cache-first with a background refresh. Vite fingerprints files under
`/assets/`, so only the shell needs precaching.

It registers **in production builds only** — `npm run dev` never serves a stale
cache. To test it locally: `npm run build && npm run preview`.

Bumping `VERSION` in `sw.js` invalidates every client's cache on next load.

## Deep-linking

`App` accepts an `initialScreen` prop (`'home'`, `'scan-result'`, `'profile'`, …).
Three lines in `src/main.tsx` turn that into shareable URLs:

```ts
const screen = new URLSearchParams(location.search).get('screen') as any
root.render(<React.StrictMode><App initialScreen={screen ?? undefined} /></React.StrictMode>)
```
