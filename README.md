# inker.sh

The landing page for INKER. SvelteKit with `adapter-static`, one prerendered route, no UI library.

The drawings are ports of the design boards in `inker/docs/handoff/design/`, kept as plain
TypeScript in `src/lib/ink/`. Each renderer has a `start(canvas, opts) => stop` signature:

- `eyes.ts`: the Nosy Ones (`WorldEyes`)
- `redaction.ts`: the inked W-2 (`BrandRedaction`)
- `lockup.ts`: the mark and wordmark (`startLock` in `AppPopEmpty`)
- `inkgrid.ts`: the shared ink grid (`field`, `bridge`, `drawInk`, letters, mark)
- `reaction.ts`: the Gray-Scott field (not drawn on the page yet)
- `runtime.ts`: Retina sizing, the frame loop, pausing and reduced motion

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
