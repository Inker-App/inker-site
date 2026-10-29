# inker.sh

The landing page for INKER and its "How it works" page. SvelteKit with `adapter-static`, two prerendered routes (`/` and `/how`), no UI library.

The landing page follows the reference in the landing handoff (`landing-desktop.html`,
`landing-mobile.html`): a phone layout below 640 px, desktop from 640 px. Its sections are in
`src/lib/components/landing/`.

`/how` follows the reference in the how-it-works handoff (`how-it-works.html`). Its sections are in
`src/lib/components/how/`, its copy and sample data in `src/lib/how/content.ts`, and the chat timeline
and scroll-to-step maths in `src/lib/how/chat.ts` and `scroll.ts`. It reuses the landing page's nav,
footer, eyes and lockup. The "Follow the file" stage is `src/lib/ink/stage.ts`.

The drawings are ports of the design boards in `inker/docs/handoff/design/`, kept as plain
TypeScript in `src/lib/ink/`. Each renderer has a `start(canvas, opts) => stop` signature:

- `eyes.ts`: the Nosy Ones (`WorldEyes`) and the page eyes (`mkEye`, `eyeStep`, `eyeDots`)
- `eyemanager.ts`: the page-wide cursor, single eye canvases, and `fitEyes` (the Tide layout)
- `linedemo.ts`: the draggable W-2 line demo, desktop and mobile tunings
- `lockup.ts`: the mark and wordmark (`startLock` in `AppPopEmpty`)
- `inkgrid.ts`: the shared ink grid (`field`, `bridge`, `drawInk`, letters, mark)
- `reaction.ts`: the Gray-Scott field (not drawn on the page yet)
- `stage.ts`: the six-step drawing on `/how`
- `runtime.ts`: Retina sizing, the frame loop, pausing and reduced motion

## Template counts

The badges on `/how` count the form templates in the INKER repo. At build time
`src/routes/how/+page.server.ts` reads each `packs/<name>/pack.toml` through the GitHub API
(its `category` and the length of `forms`) and merges that onto the categories listed in
`src/lib/how/templates.ts`. While the repo is private the build needs `GITHUB_TOKEN` (a
fine-grained token with Contents: read on `Inker-App/inker`); locally,
`GITHUB_TOKEN=$(gh auth token) pnpm build`. Without it the build logs
`[templates] using the built-in counts` and uses the numbers in `templates.ts`. The INKER repo's
`site-rebuild` workflow asks Vercel for a build when `packs/**` changes.

## Commands

```sh
pnpm install
pnpm dev        # dev server
pnpm test       # unit tests (Vitest) for the pure parts of the renderers
pnpm check      # svelte-check and TypeScript
pnpm build      # static site in build/
pnpm preview    # serve build/ locally
```

## Deploy

`pnpm build` writes plain static files to `build/`. Upload that directory to any static host.
