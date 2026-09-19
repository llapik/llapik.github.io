# llapik reel — scroll-scrubbed sprite reel

The landing page (`/index.html`) is a scroll-driven version of the sprite reel.
Page scroll scrubs the reel timeline (0–32s) instead of autoplaying.

## Files
- `animations.jsx` — reel framework (Stage/Sprite/easing), from the original reel export.
- `scenes.jsx` — the 6 scenes (Intro, Name, About, Skills, Projects, Contact).
- `app.jsx` — `ScrollStage`: maps page scroll → timeline seconds, cover-fits 1920×1080.
- `reel.bundle.js` — **generated** plain-JS build of the three sources above (no runtime Babel).
- `vendor/` — pinned React 18.3.1 production UMD builds (no CDN dependency).
- `build.js` — regenerates `reel.bundle.js`.

## Rebuild after editing any `.jsx`
```
npm pack @babel/standalone@7.29.0   # obtain babel.min.js
node reel/build.js /path/to/babel.min.js
```

The classic portfolio remains available at `/index-classic.html`.
