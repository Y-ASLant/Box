# Repository Guidelines

## Project Overview

Box（浏览器 Plus）is a compatibility-first, permissive Electron browser for trusted Web applications, intranet systems, device pages, digital signage, and kiosk-like use. A persistent React 19 and Chakra UI 3 browser shell owns the top tabs and navigation controls; remote HTTP(S) content runs in isolated Electron `WebContentsView` tabs below it.

Treat Electron security behavior as load-bearing. The default `permissive` compatibility mode disables certificate checks/web security and relaxes CSP; `standard` preserves Chromium security behavior. Remote tabs do not receive the app preload bridge. UI restrictions such as blocked shortcuts and DevTools are not security boundaries.

## Architecture & Data Flow

- `electron/main.ts` calls `initializeApp()` in `electron/app-lifecycle.ts`.
- Startup resolves one `ResolvedConfig` before Electron becomes ready, applies its compatibility/session policy, registers IPC, then creates windows. Development reads `process.cwd()/config.json`; packaged builds read beside `process.execPath`; `-config` can override the path. Precedence is defaults, then file, then CLI.
- `electron/window-manager.ts` owns the frameless main `BrowserWindow`, `WebContentsView` tabs, active-tab layout, navigation history, page titles, new-window handling, shortcuts, and cleanup. The React tab strip provides the custom drag region, visible border, and window controls.
- The React renderer starts at `src/main.tsx`. `src/App.tsx` keeps the browser shell mounted; `src/views/NewTabPage.tsx` is the local new-tab page. Browser commands flow through the typed preload bridge to the main-process tab manager.
- Privileged flow must remain: React component/hook → typed `window.electronAPI` in `src/vite-env.d.ts` → fixed bridge method/channel in `electron/preload.ts` → handler in `electron/ipc-handlers.ts` → Electron operation.
- HTTP(S) new-window requests become tabs, or reuse the current tab in `singlePage` mode; other protocols are denied.
- Main-process state is module-scoped where ownership is singular (the main window, tab map, active tab, and local-page visibility). Renderer state uses React state, effects, refs, callbacks, and the focused settings context in `use-app-settings.tsx`; persisted keys are `appSettings` and `recentUrls`. Clearing browsing data preserves application settings.
- The home action resets the current tab to the local new-tab page.

## Key Directories

- `src/` — React 19 renderer: persistent Chakra UI browser shell, local new-tab view, theme system, hooks, and platform-only CSS.
- `electron/` — privileged main/preload code: lifecycle, BrowserWindows, IPC, configuration, session setup, and page injection.
- `shared/` — cross-boundary types and URL normalization.
- `assets/` — build-time application icons; only `assets/index.ico` is copied into the packaged application files.
- `dist/`, `dist-electron/`, `build/` — generated outputs; never hand-edit or treat as source.

## Development Commands

```bash
corepack enable pnpm   # if pnpm is unavailable
pnpm install
pnpm start             # Electron development mode
pnpm dev               # renderer-only Vite server
pnpm preview           # preview renderer build
pnpm test              # Node configuration and URL tests
pnpm check             # strict renderer + Electron/shared/config checks
pnpm check:node        # Electron/shared/config TypeScript only
pnpm build             # tests + full checks + renderer bundle
pnpm build:electron    # tests + full checks + Electron bundle/package
pnpm build:win         # checked Windows x64 package
pnpm build:win:x64     # explicit Windows x64 package
pnpm build:mac         # checked macOS package for the current/default architecture
pnpm build:mac:x64     # checked macOS Intel package
pnpm build:mac:arm64   # checked macOS Apple Silicon package
pnpm build:linux       # checked Linux packages for the current/default architecture
pnpm build:linux:x64   # checked Linux x64 packages
pnpm build:linux:arm64 # checked Linux arm64 packages
pnpm release:notes v1.1.0 release-notes.md # validate/extract one changelog version
make build             # checked package; keeps only release files under build/
make clean             # deletes generated outputs, caches, logs, and temporary files
make distclean         # make clean plus node_modules/ and repo-local .pnpm-store/
```

There are no `lint`, `format`, or coverage commands. Do not invent or claim them.

## Code Conventions & Common Patterns

- React files use typed function components and hooks. Use Chakra UI's unmodified `defaultSystem`, semantic tokens, component recipes, variants, sizes, radii, and native motion instead of custom design tokens or handwritten component CSS; keep raw CSS limited to Electron drag regions and browser-platform behavior that Chakra cannot express portably.
- Use `lucide-react` for interface icons. Import individual icon components for tree-shaking; do not substitute Unicode symbols, emoji, handwritten SVG, or a dynamic all-icons registry.
- Use two-space indentation. Existing TypeScript generally uses single quotes and semicolons, though formatting is not fully uniform and no formatter enforces it.
- Use camelCase for functions/variables, `handle…` for handlers, `use…` for composables, PascalCase for types/components, and `SCREAMING_SNAKE_CASE` for generator constants.
- TypeScript implementation and hook files use kebab-case (`window-manager.ts`, `use-app-settings.tsx`); React components and views use PascalCase (`BrowserChrome.tsx`, `NewTabPage.tsx`, `SettingsPage.tsx`).
- Put reusable cross-process contracts in `shared/types.mts`. Keep filesystem, session, protocol, and `BrowserWindow` access in `electron/`; keep UI and renderer state in `src/`.
- Reuse functional seams: explicit parameters such as `BrowserWindow`, pure config parsing, module getters, React hooks, and guard clauses. There is no DI container, class service layer, global client store, or second state system.
- Before window operations, check null/destroyed state. Use `async`/`await` with `try/catch` for user-visible operations; use Promise `.catch(...)` for fire-and-observe Electron calls. Log unexpected injection, configuration, and session failures; swallow only documented non-critical failures.
- For new IPC behavior, expose a fixed preload method rather than raw `ipcRenderer`, add types to `src/vite-env.d.ts` or `shared/types.mts`, validate inputs/senders, and preserve context isolation.
- Keep browser-shell state changes in the existing `window-manager.ts` tab helpers and publish a full `BrowserState` snapshot after relevant navigation changes.
- Comments and user-facing messages are predominantly Simplified Chinese. Preserve that convention for UI/docs unless intentionally changing project language.

## Important Files

- `package.json` — scripts, direct dependencies, Electron entry, and electron-builder configuration.
- `.github/workflows/ci.yml` — push/PR/manual workflow and application validation.
- `.github/workflows/package-test.yml` — manual packaging for five native platform/architecture targets without publishing a release.
- `.github/workflows/release.yml` — tag validation, five native package jobs, artifact collection, and GitHub Release publication.
- `CHANGELOG.md` — bilingual Keep a Changelog release history used verbatim for GitHub Release notes.
- `scripts/extract-release-notes.mjs` — validates tag/package versions and extracts matching changelog sections.
- `pnpm-lock.yaml`, `pnpm-workspace.yaml` — reproducible graph, overrides, and allowed dependency build scripts.
- `vite.config.mts` — renderer-only Vite configuration.
- `electron.vite.config.mjs` — renderer + Electron main/preload development/build configuration; loading it clears `dist-electron/`.
- `vite.shared.mts` — shared output, minification, alias, chunk, and server settings.
- `tsconfig.json` — strict React renderer configuration selected by `tsc`.
- `tsconfig.node.json` — strict Electron/shared/Vite-config check invoked by `pnpm check`.
- `electron/app-config.mts` and `electron/app-config.test.mts` — typed config loading, compatibility migration, CLI merging, path resolution, and tests.
- `shared/types.mts`, `shared/url.mts`, `shared/url.test.mts` — cross-boundary browser/tab contracts and tested HTTP(S) normalization.
- `electron/app-lifecycle.ts`, `electron/window-manager.ts`, `electron/preload.ts`, `electron/ipc-handlers.ts` — main runtime and trust boundary.
- `README.md` — user-facing commands, CLI/config flags, themes, and manual behavior examples.

## Runtime/Tooling Preferences

- Use Node.js **22.18+**; this floor is declared in `package.json` and keeps native TypeScript tests warning-free. CI uses Node.js 22.23.2.
- Use **pnpm 12.4.2**. Do not create npm/yarn lockfiles or replace pnpm-specific `allowBuilds`/overrides.
- Vite configs are native-ESM-compatible (`.mts`/`.mjs`). Keep explicit extensions for local ESM imports and use `import.meta.dirname`, not `__dirname`.
- Keep renderer asset paths relative (`base: './'`) for packaged `file://` loading. `@` resolves to `src/`.
- Production renderer builds use Terser and drop `console`/`debugger`; do not rely on them for packaged diagnostics.
- electron-builder packages only `dist/**/*`, `dist-electron/**/*`, and the runtime `assets/index.ico`; source-only icons stay outside `app.asar`. React and Chakra UI remain dev dependencies because Vite fully bundles them and packaged runtime `node_modules` is intentionally empty. Windows uses x64 NSIS; macOS uses DMG for x64 and arm64; Linux uses AppImage/deb/rpm for x64 and arm64. Release filenames include version, platform, and architecture.
- Electron 44 downloads its platform binary lazily. The `prestart` and `prebuild:electron` hooks run `install-electron --no`, and electron-builder reuses `node_modules/electron/dist` through `electronDist`.
- `make build` removes `dist/`, `dist-electron/`, unpacked staging directories, builder diagnostics, and updater metadata only after packaging succeeds. Use `pnpm build:electron` when those intermediates are needed for debugging or runtime smoke checks.
- Canonical runtime flags are `-url`, `-fullscreen`, `-always-on-top`, `-single-page`, `-theme`, `-background`, `-compatibility-mode`, and `-config`; one or two leading dashes are accepted. Legacy `-link`, `-mode`, `-window`, `-page`, and `-bg` remain compatibility aliases. Missing protocols are normalized to `http://`.

## Testing & QA

- `pnpm test` uses the Node.js built-in test runner for config parsing/precedence/path behavior and HTTP(S) URL normalization. There is no linter, formatter, or coverage setup. CI validates workflows, tests, changelog extraction, static checks, and the renderer build. Package Test and Release provide native package gates but do not replace manual runtime testing.
- `pnpm check` is the repository-wide static gate: `tsc -p tsconfig.json` checks the React renderer, then `tsc -p tsconfig.node.json` checks Electron, shared code, and Vite configs.
- For Electron behavior, launch `pnpm start` and exercise the changed path. Relevant smoke scenarios include creating/switching/closing tabs, URL navigation/load failure, back/forward/reload/home, popup-to-tab behavior, valid and invalid config/CLI precedence, session/cache clearing, fullscreen/always-on-top behavior, custom backgrounds, and `Ctrl/Cmd + T/W/L` shortcuts.
- For packaging changes, use the checked `pnpm build:electron` or the relevant platform script and verify the expected files under `build/`.
- Before moving a release tag, run Package Test manually from GitHub Actions when packaging or dependency behavior has changed.
- Extend the existing Node tests for configuration precedence and URL normalization. If a browser/Electron runner is later added, prioritize IPC validation, theme persistence, tab navigation failures, and window behavior.

## Release & Changelog Conventions

- Releases are triggered only by pushed `v*` or `V*` tags. The tag must be a complete SemVer value and must exactly match `package.json#version`; legacy date-suffixed tags are not accepted by the workflow.
- `CHANGELOG.md` keeps Simplified Chinese first and English second, following Keep a Changelog headings. Every released version must appear in both language sections as `## [x.y.z] - YYYY-MM-DD`.
- Release entries describe the final user-visible difference from the previous version. Keep intermediate implementation details and reverted changes out of the changelog.
- The GitHub Release body is generated by `scripts/extract-release-notes.mjs`; do not maintain a second release-notes file.
- The release matrix runs Windows x64, macOS x64/arm64, and Linux x64/arm64 on matching native GitHub-hosted runners. All five platform/architecture jobs must succeed before publication.
