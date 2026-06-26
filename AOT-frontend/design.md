# AeroPay — Design System

Single source of truth for visual decisions. **Reference this file when generating or
editing any UI.** Goal: a cohesive, branded look — never default Tailwind/shadcn "AI" styling.

When prompting for a component, restate the relevant rule from here. If a value isn't
defined here, add it here first, then use it. Do not invent one-off hex / radii / shadows.

---

## 1. Color

Muted deep-teal + terracotta-copper on near-black (dark) / warm-white (light).
**Low neon. Restrained chroma.** All colors are CSS vars in `globals.css` — use the
token, never a raw hex in markup.

### Brand
| Role | Token (Tailwind) | Dark | Light |
|------|------------------|------|-------|
| Primary (teal) | `brand-teal` / `brand-cyan`* | `#3a9d8f` | `#3a9d8f` (text: `#1f6b60`) |
| Primary deep | `brand-teal-deep` | `#2c7a6f` | — |
| Accent (copper) | `brand-copper` / `brand-violet`* | `#c97a4e` | `#c97a4e` (text: `#9a5326`) |
| Accent deep | `brand-copper-deep` | `#a85f37` | — |

\* `brand-cyan`/`brand-violet` are **legacy aliases** kept so old markup works.
Prefer `brand-teal` / `brand-copper` in new code.

### Surfaces (theme-aware — flip automatically)
| Role | Var | Dark | Light |
|------|-----|------|-------|
| Page bg | `--bg` | `#070b0e` | `#f3f4f1` |
| Card | `--card` | `#0c1217` | `#ffffff` |
| Border | `--border` | `white/6%` | `ink/10%` |
| Text | `--foreground` | `#dfe6e4` | `#0d1714` |
| Soft fill | `--surface-soft` | `white/5%` | `ink/3.5%` |

### Rules
- **Two accents only**: teal (primary/structure) + copper (highlight/action). NO third hue.
- Status colors allowed sparingly: success `#15803d`/`emerald`, warn `amber`, error `red`.
- **Gradients**: only `teal → copper` or single-hue teal/copper shade ramps.
  ❌ Never `from-purple-500 to-pink-500`, `from-indigo to-purple`, rainbow pairs.
- Code / terminal panels stay dark (`#0c1217`) in BOTH themes — intentional.

---

## 2. Radius

Defined scale. Pick by element class — don't mix freely.

| Token | Value | Use for |
|-------|-------|---------|
| `rounded-md` (6px) | small | **buttons** (btn-brutal), inputs trailing |
| `rounded-xl` (12px) | medium | input fields, icon chips, pills-on-cards |
| `rounded-2xl` (16px) | large | inner cards, code panels, list items |
| `rounded-3xl` (24px) | hero | top-level panels (auth panels, big feature cards) |
| `rounded-full` | pill | tag pills, status dots, avatar |

Rule: one card never mixes 2xl + 3xl on sibling elements. Outer panel = 3xl,
nested cards = 2xl, chips = xl.

---

## 3. Typography

| Role | Font (var) | Weight | Tracking |
|------|-----------|--------|----------|
| Display / headings | `font-display` (Space Grotesk) | 700–900 | `tracking-tight` |
| Body / UI | `font-sans` (Inter) | 400–600 | normal / `-0.005em` |
| Mono / labels / metrics | `font-mono` | 700 | `tracking-widest` (uppercase micro-labels) |

- Hero H1: `font-black`, `tracking-tight`.
- Micro labels (stat captions, pill text): `font-mono`, `uppercase`, `text-[10px]–[11px]`,
  `tracking-widest`, muted color.
- Body copy: `text-gray-300/90` dark, auto-flips light. `text-pretty` for balance.

---

## 4. Spacing & layout

- Section vertical rhythm: `py-24` (desktop). Hero `min-h-screen`.
- Max content width: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
- Card padding: outer panels `p-8 md:p-12`, inner cards `p-6`.
- Grid gaps: `gap-6 md:gap-8`.

---

## 5. Elevation / surfaces

- **Glass card** = `.glass-card` (theme-aware blur + border + shadow). Use this, not
  ad-hoc `bg-slate-900/40 backdrop-blur`.
- Shadows come from `.glass-card` / `.btn-brutal` only. No random `shadow-2xl` sprinkling.
- Hairlines = `border-brand-border` (token), not `border-white/10`.

---

## 6. Buttons

Two variants only:
- **`.btn-brutal`** — solid copper, dark ink, 6px radius, hard offset shadow, shifts on
  hover. Primary action.
- **`.btn-brutal-ghost`** — transparent, teal outline + offset, fills teal on hover.
  Secondary action.

Don't create new button styles inline. Size via `!py-2 !px-4 !text-xs` + `--offset` for compact.

---

## 7. Motion

- Easing: `[0.22, 1, 0.36, 1]` (entrance), `[0.7, 0, 0.3, 1]` (reveal/zoom).
- Scroll reveals via `<Reveal>`; cards stagger `0.05–0.12s`.
- Background: WebGL aurora (`AuroraBackground`) + cursor spotlight. One system, site-wide.
- Respect `prefers-reduced-motion` — every animation must have a static fallback.
- No animation spam: each motion serves hierarchy or feedback.

---

## 8. Icon gradient system (kills the rainbow)

Icon chips use a **fixed 3-class set**, not per-icon random colors:
- `.icon-grad-teal` — teal ramp (primary features)
- `.icon-grad-copper` — copper ramp (treasury / money features)
- `.icon-grad-mix` — teal→copper (flagship / security)

Map each feature to one of these three. Never `from-<random>-400 to-<random>-500`.
