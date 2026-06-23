# Photoslide — marketing site

A single, focused landing page for the Photoslide iPhone app. Built with Next.js
(App Router) + React 19.

## Design direction — "Lightbox"

A camera roll is an overwhelming **pile**; the app flicks it into shape. The page
performs that thesis: photos glow like prints on a warm-dark sorting table, and the
hero is a **kinetic pile you physically fling** — right to keep, left to clear, up
for later — with live KEPT / CLEARED / GB-reclaimed tallies.

- **Color:** warm near-black lightbox, coral→rose brand gradient as the spark, and
  green / red as the functional keep/clear binary (the whole point of the app).
- **Type:** Space Grotesk (display) · Inter (body) · Space Mono (labels & counters).
- **"What it is"** pairs a plain statement with a **swipeable 4-screen mockup carousel**
  (Albums · the deck · Trash · Privacy) — drag, arrows, or dots.
- Quality floor: responsive to mobile, keyboard-operable pile (arrow keys), touch-draggable
  pile and carousel, visible focus, `prefers-reduced-motion` respected.

## Run it

```bash
cd site
npm install
npm run dev      # http://localhost:3000
npm run build && npm run start   # production
```

## Structure

```
site/
  app/
    layout.tsx     Fonts (next/font) + metadata
    page.tsx       hero → "what it is" statement → three gesture rows → privacy close
    globals.css    Design tokens + all styling
  components/
    Pile.tsx       The kinetic, draggable photo pile (hero signature element)
    Carousel.tsx   Swipeable 4-screen mockup carousel
    phones.tsx     iPhone frame + Albums / Swipe / Trash / Privacy screens
    Nav.tsx        Sticky blurred nav
    Reveal.tsx     IntersectionObserver scroll-reveal wrapper
    icons.tsx      Inline SVG icon set
  public/logo.png  App icon
```

> The App Store button is a placeholder (`#`) until there's a live listing.
