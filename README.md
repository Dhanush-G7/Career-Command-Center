# Career Command Center — Full Standalone V1.3 (Final)

Open `index.html` directly in any modern browser. No build step, no server, no dependencies.

## What was fixed
- Removed stray Markdown code fences (```` ``` ````) that had been pasted into
  `index.html`, `css/styles.css` and `js/app.js`. These broke the HTML structure
  and made the JavaScript file fail to parse, so the app rendered as a blank page.
- Corrected the asset paths in `index.html`:
  - `./style.css` → `./css/styles.css`
  - `./script.js` → `./js/app.js`
- Replaced every hard-coded colour in the stylesheet with theme variables so all
  surfaces (sidebar, topbar, modals, inputs, panels, progress tracks) follow the
  active theme.

## Target role validation (fixed)
Previously any text with a letter in it was accepted, so "asdfgh" or
"hello" passed. `validateTargetRole()` in `js/app.js` now checks the input
against a real job-title dictionary:

- It must contain a recognised **head noun** (developer, engineer, analyst,
  designer, manager, nurse, accountant, chef, lawyer, teacher …) or be a
  known abbreviation (SDE, SDET, QA, HR, PM, CTO, UI/UX, DevOps …).
- Keyboard mashing is caught by vowel-ratio, consonant-run and
  keyboard-sequence checks ("asdfgh", "hjkl", "zzzz", "sdfkjhsdkfj").
- Digits-only, symbols-only, repeated characters and full sentences are
  rejected with a specific message.
- Typos get a **clickable "Did you mean …?" chip** driven by Levenshtein
  distance against 100+ known titles — "Fronend Developr" → Frontend
  Developer, "Data Scientst" → Data Scientist, "Civil Enginer" → Civil
  Engineer.
- Accepted values are normalised to title case (`hr manager` → `HR Manager`).
- Validation runs live while typing (debounced 450ms), on blur, and again
  on submit in both onboarding and Settings.
- The input is backed by a `<datalist>` of 100+ real job titles for
  autocomplete.

Also fixed: `loadState()` referenced the bare identifier `structuredClone`,
which throws a `ReferenceError` rather than being falsy in browsers that
don't have it. Now uses a `typeof` guard.

## Animation fix — pill going translucent / offset
Two bugs in the sidebar's gooey-pill animation are fixed:

1. **Position offset.** The pill was measured with
   `getBoundingClientRect()`, which includes in-flight CSS
   transforms. The nav items run a slide-in entrance
   (`translateX(-14px) → 0`), so a rect read mid-animation landed
   the pill ~14px left of the item it was tracking. Fixed by
   walking the `offsetParent` chain (`offsetLeft`/`offsetTop`),
   which ignores transforms entirely.
2. **Washed-out opacity.** The pill's entrance keyframes animated
   `opacity`, which — next to a sibling layer carrying
   `mix-blend-mode` and `blur(7px) contrast(100)` — could get
   compositor-stuck at a partial value (~21%) even after the
   animation reported "finished". The keyframes now animate
   `transform` only; the pill is opaque at rest, so there's no
   in-between frame it can freeze on.

Also: removed a duplicate blurred pill layer that trailed a ghost
behind the real one, wrapped the effect in an `overflow: hidden`
layer so its oversized backdrop can't grow the sidebar's scroll
area, and delayed enabling slide transitions until after first
paint so a slow load can't show the pill flying in from the
corner.

## Gooey nav animation
The sidebar navigation uses a vanilla-JS port of the GooeyNav particle
effect. Selecting a page springs a pill into place and bursts 15 particles
that melt together via a `blur(7px) contrast(100)` filter and a
`mix-blend-mode` layer. Colours come from the active theme
(`--color-1` … `--color-4`), and light themes flip the blend from `lighten`
to `darken` so the effect reads correctly on white sidebars. Tune it via
the `GOOEY` config object at the top of `js/app.js`:

```js
const GOOEY = {
    animationTime: 600,
    particleCount: 15,
    particleDistances: [90, 10],
    particleR: 100,
    timeVariance: 300,
    colors: [1, 2, 3, 1, 2, 3, 1, 4]
};
```

## Themes (7 total)
Switch with the ◐ button in the top bar, or from **Settings → Appearance**.
Your choice is saved to LocalStorage.

| Theme | Description |
|---|---|
| Midnight | Violet on near-black (default) |
| Daylight | Clean light mode |
| Graphite | Black and gray |
| Orchid | Pink and purple |
| Sage | Green and cement |
| Lagoon | Cyan and white |
| Ember | Amber and charcoal |

## Animation improvements
- Staggered fade-up entrance for every page and its sections
- Animated counters/stat cards on the dashboard
- Ambient floating glow on the hero card
- Sidebar nav: slide-in on load, sliding active indicator bar, icon pop on hover
- Buttons: lift, shimmer sweep, press-down feedback
- Cards: hover lift with themed shadow
- Modals, search, command palette and onboarding: scale-and-fade entrance
- Notification panel and theme menu: spring pop-in
- Pulsing notification dot, spinning theme icon
- Shimmering progress and skill bars with eased width transitions
- Staggered table row entrance, row hover highlight
- Focus rings and input glow tinted to the active theme
- Smooth 0.4s cross-fade when switching themes
- Full `prefers-reduced-motion` support — all motion disabled for users who ask for it

## Features
- Local demo login and onboarding
- Profile-aware dashboard
- Application tracking
- Detailed application and interview forms
- Skill-gap tracking
- Job description analyzer
- Weighted offer comparison
- Funnel analytics
- Command palette (Ctrl/Cmd + K) and global search
- Notification center
- Validation, empty states, toast feedback
- Export/reset local data
- Responsive layout and keyboard-visible focus

All data is stored in browser LocalStorage. No backend or API is required.
