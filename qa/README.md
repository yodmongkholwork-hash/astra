# Realms QA suite (Phase 1–2)

Run against a production server (`npm run build && npm start` on port 3100, or set `BASE`):

```bash
node qa/regression.js   # existing ASTRA features (routes, API, rooms, engines, chat, history)
node qa/responsive.js   # phone / tablet / desktop layouts, quality switch, reduced motion, no-WebGL
node qa/desktop.js      # entrance, overview, camera smoothness, 8 markers, travel, return, animation
```

Needs Playwright with Chromium. `locations.json` is the shot data extracted from `src/lib/realms/locations.ts`
(regenerate it if you change camera shots). The suites read the live camera through the opt-in
`window.__ASTRA_TEST__` probe in `KingdomCanvas.tsx`.
