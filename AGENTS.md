# Repository Guidelines

## Project Overview

Box（浏览器Plus）is a frameless Electron browser shell for presentation and kiosk-like use. It shows a local Vue login/error UI or loads a configured remote HTTP(S) page, then injects window controls and presentation-specific behavior into that page.

Treat Electron security behavior as load-bearing. The app intentionally disables certificate checks/web security, relaxes CSP, and injects JavaScript into remote content. UI restrictions such as blocked shortcuts and DevTools are not security boundaries.

## Architecture & Data Flow

- `electron/main.ts` calls `initializeApp()` in `electron/app-lifecycle.ts`.
- Startup registers session policy, reads optional `process.cwd()/config.json`, merges CLI flags, registers IPC, then creates windows. Config-file values currently override CLI values.
- `electron/window-manager.ts` owns the main `BrowserWindow`, local/remote navigation, managed child windows, shortcuts, load failures, and cleanup.
- The Vue renderer starts at `src/main.ts`. `src/views/Login.vue` sends a URL through `window.electronAPI`; preload forwards it to `electron/ipc-handlers.ts`, which calls `BrowserWindow.loadURL()`.
- Privileged flow must remain: Vue component/composable → typed `window.electronAPI` in `src/vite-env.d.ts` → fixed bridge method/channel in `electron/preload.ts` → handler in `electron/ipc-handlers.ts` → Electron operation.
- Remote-page controls flow through `shared/control-panel-generator.ts` → `electron/controls-injector.ts` → injected DOM/script → `postMessage` → preload → IPC.
- Load failures route to the local hash route `/error`. New-window requests are denied by default and replaced with a managed child `BrowserWindow`.
- Main-process state is module-scoped where ownership is singular (`appConfig`, the main window, and the managed-window set). Renderer state uses Vue `ref`/`computed`; shared theme state lives in `useTheme.ts`; persisted keys are `theme` and `recentUrls`.

## Key Directories

- `src/` — Vue 3 renderer: local login/error views, router, theme composable, components, global styles.
- `electron/` — privileged main/preload code: lifecycle, BrowserWindows, IPC, configuration, session setup, and page injection.
- `shared/` — cross-boundary types, URL normalization, generated control-panel script, and injectable CSS.
- `assets/` — packaged icons and README screenshots.
- `dist/`, `dist-electron/`, `build/` — generated outputs; never hand-edit or treat as source.

## Development Commands

```bash
corepack enable pnpm   # if pnpm is unavailable
pnpm install
pnpm start             # Electron development mode
pnpm dev               # renderer-only Vite server
pnpm preview           # preview renderer build
pnpm check             # strict renderer + Electron/shared/config checks
pnpm check:node        # Electron/shared/config TypeScript only
pnpm build             # full checks + renderer bundle
pnpm build:electron    # full checks + Electron bundle/package
pnpm build:win         # checked Windows x64 package
pnpm build:mac:x64     # checked macOS Intel package
pnpm build:mac:arm64   # checked macOS Apple Silicon package
pnpm build:linux:x64   # checked Linux x64 packages
pnpm build:linux:arm64 # checked Linux arm64 packages
pnpm release:notes -- v1.0.0 release-notes.md # validate/extract one changelog version
make build             # checked package; keeps only release files under build/
make clean             # deletes generated outputs, caches, logs, and temporary files
make distclean         # make clean plus node_modules/ and repo-local .pnpm-store/
```

There are no `test`, `lint`, `format`, or coverage commands. Do not invent or claim them.

## Code Conventions & Common Patterns

- Vue files use `<script setup lang="ts">`, Composition API primitives, scoped CSS, and hash-router navigation.
- Use two-space indentation. Existing TypeScript generally uses single quotes and semicolons, though formatting is not fully uniform and no formatter enforces it.
- Use camelCase for functions/variables, `handle…` for handlers, `use…` for composables, PascalCase for types/components, and `SCREAMING_SNAKE_CASE` for generator constants.
- TypeScript implementation files use kebab-case (`window-manager.ts`); Vue components/views use PascalCase (`ThemeToggle.vue`, `Login.vue`).
- Put reusable cross-process contracts in `shared/types.ts`. Keep filesystem, session, protocol, and `BrowserWindow` access in `electron/`; keep UI and renderer state in `src/`.
- Reuse functional seams: explicit parameters such as `BrowserWindow`/`hiddenButtons`, module getters, and guard clauses. There is no DI container, class service layer, Pinia/Vuex store, or second state system.
- Before window operations, check null/destroyed state. Use `async`/`await` with `try/catch` for user-visible operations; use Promise `.catch(...)` for fire-and-observe Electron calls. Log unexpected injection, configuration, and session failures; swallow only documented non-critical failures.
- For new IPC behavior, expose a fixed preload method rather than raw `ipcRenderer`, add types to `src/vite-env.d.ts` or `shared/types.ts`, validate inputs/senders, and preserve context isolation.
- For behavior shared by main and child windows, extend `setupCommonWindowEvents`; keep role-specific logic in the existing main/child helpers. Put injected presentation changes in `shared/styles.ts` or `shared/control-panel-generator.ts`.
- Comments and user-facing messages are predominantly Simplified Chinese. Preserve that convention for UI/docs unless intentionally changing project language.

## Important Files

- `package.json` — scripts, direct dependencies, Electron entry, and electron-builder configuration.
- `.github/workflows/release.yml` — tag validation, five native package jobs, artifact collection, and GitHub Release publication.
- `CHANGELOG.md` — bilingual Keep a Changelog release history used verbatim for GitHub Release notes.
- `scripts/extract-release-notes.mjs` — validates tag/package versions and extracts matching changelog sections.
- `pnpm-lock.yaml`, `pnpm-workspace.yaml` — reproducible graph, overrides, and allowed dependency build scripts.
- `vite.config.mts` — renderer-only Vite configuration.
- `electron.vite.config.mjs` — renderer + Electron main/preload development/build configuration; loading it clears `dist-electron/`.
- `vite.shared.mts` — shared output, minification, alias, chunk, and server settings.
- `tsconfig.json` — strict renderer configuration selected by `vue-tsc`.
- `tsconfig.node.json` — strict Electron/shared/Vite-config check invoked by `pnpm check`.
- `electron/app-config.ts` — config-file loading, CLI merging, and background-path resolution.
- `electron/app-lifecycle.ts`, `electron/window-manager.ts`, `electron/preload.ts`, `electron/ipc-handlers.ts` — main runtime and trust boundary.
- `README.md` — user-facing commands, CLI/config flags, themes, hidden controls, and manual behavior examples.

## Runtime/Tooling Preferences

- Use Node.js **22.12+**; this floor is declared in `package.json` and required by Electron 44/Vite 8.
- Use **pnpm 12.4.2**. Do not create npm/yarn lockfiles or replace pnpm-specific `allowBuilds`/overrides.
- Vite configs are native-ESM-compatible (`.mts`/`.mjs`). Keep explicit extensions for local ESM imports and use `import.meta.dirname`, not `__dirname`.
- Keep renderer asset paths relative (`base: './'`) for packaged `file://` loading. `@` resolves to `src/`.
- Production renderer builds use Terser and drop `console`/`debugger`; do not rely on them for packaged diagnostics.
- electron-builder packages only `dist/**/*`, `dist-electron/**/*`, and the runtime `assets/index.ico`; README screenshots and source-only icons stay outside `app.asar`. Vue and Vue Router remain dev dependencies because Vite fully bundles them and packaged runtime `node_modules` is intentionally empty. Windows uses x64 NSIS; macOS uses DMG for x64 and arm64; Linux uses AppImage/deb/rpm for x64 and arm64. Release filenames include version, platform, and architecture.
- Electron 44 downloads its platform binary lazily. The `prestart` and `prebuild:electron` hooks run `install-electron --no`, and electron-builder reuses `node_modules/electron/dist` through `electronDist`.
- `make build` removes `dist/`, `dist-electron/`, unpacked staging directories, builder diagnostics, and updater metadata only after packaging succeeds. Use `pnpm build:electron` when those intermediates are needed for debugging or runtime smoke checks.
- Supported runtime flags include `-link`, `-mode`, `-window`, `-page`, `-theme`, `-hide`, and `-bg`; hide values are comma-separated.

## Testing & QA

- There is no automated test suite, test framework, linter, formatter, or coverage setup. The release workflow provides static/build/package gates but does not replace manual runtime testing.
- `pnpm check` is the repository-wide static gate: `vue-tsc` checks `src/**/*`, then `tsc -p tsconfig.node.json` checks Electron, shared code, and Vite configs.
- For Electron behavior, launch `pnpm start` and exercise the changed path. Relevant smoke scenarios include URL navigation/load failure, main versus child windows, theme/config precedence, hidden controls, cache/history clearing, fullscreen/top/single-page behavior, custom backgrounds, and `Ctrl + Shift + Alt` control-panel toggling.
- For packaging changes, use the checked `pnpm build:electron` or the relevant platform script and verify the expected files under `build/`.
- If adding tests, cover observable boundaries such as IPC validation, configuration precedence, URL normalization, theme persistence, and load-error routing. Introducing a runner/config is a new project-wide convention; keep it minimal and document the command.

## Release & Changelog Conventions

- Releases are triggered only by pushed `v*` or `V*` tags. The tag must be a complete SemVer value and must exactly match `package.json#version`; legacy date-suffixed tags are not accepted by the workflow.
- `CHANGELOG.md` keeps Simplified Chinese first and English second, following Keep a Changelog headings. Every released version must appear in both language sections as `## [x.y.z] - YYYY-MM-DD`.
- Release entries describe the final user-visible difference from the previous version. Keep intermediate implementation details and reverted changes out of the changelog.
- The GitHub Release body is generated by `scripts/extract-release-notes.mjs`; do not maintain a second release-notes file.
- The release matrix runs Windows x64, macOS x64/arm64, and Linux x64/arm64 on matching native GitHub-hosted runners. All five jobs must succeed before publication.
