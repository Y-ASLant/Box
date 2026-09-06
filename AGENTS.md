# Repository Guidelines

## Project Overview

Box（浏览器Plus）is a frameless Electron browser shell for presentation and kiosk-like use. It shows a local Vue login/error UI or loads a configured remote HTTP(S) page, then injects window controls and presentation-specific behavior into that page.

Treat Electron security behavior as load-bearing. The app intentionally disables certificate checks/web security, relaxes CSP, and injects JavaScript into remote content. UI restrictions such as blocked shortcuts and DevTools are not security boundaries.

## Architecture & Data Flow

- `electron/main.ts` calls `initializeApp()` in `electron/app-lifecycle.ts`.
- Startup registers protocols/session policy, reads optional `process.cwd()/config.json`, merges CLI flags, registers IPC, then creates windows. Config-file values currently override CLI values.
- `electron/window-manager.ts` owns the main `BrowserWindow`, local/remote navigation, managed child windows, shortcuts, load failures, and cleanup.
- The Vue renderer starts at `src/main.ts`. `src/views/Login.vue` sends a URL through `window.electronAPI`; preload forwards it to `electron/ipc-handlers.ts`, which calls `BrowserWindow.loadURL()`.
- Privileged flow must remain: Vue component/composable → typed `window.electronAPI` in `src/vite-env.d.ts` → fixed bridge method/channel in `electron/preload.ts` → handler in `electron/ipc-handlers.ts` → Electron operation.
- Remote-page controls flow through `shared/control-panel-generator.ts` → `electron/controls-injector.ts` → injected DOM/script → `postMessage` → preload → IPC.
- Load failures route to the local hash route `/error`. New-window requests are denied by default and replaced with a managed child `BrowserWindow`.
- Main-process state is module-scoped only where ownership is singular (`appConfig`, main window). Renderer state uses Vue `ref`/`computed`; shared theme state lives in `useTheme.ts`; persisted keys are `theme` and `recentUrls`.

## Key Directories

- `src/` — Vue 3 renderer: local login/error views, router, theme composable, components, global styles.
- `electron/` — privileged main/preload code: lifecycle, BrowserWindows, IPC, configuration, protocol/session setup, page injection.
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
pnpm build:electron-fast  # package without type checks
pnpm build:win         # checked Windows package; mac/linux variants also exist
make build             # checked Electron package
make clean             # deletes generated outputs, caches, logs, and temporary files
make clear             # compatibility alias for make clean
make distclean         # make clean plus node_modules/ and repo-local .pnpm-store/
```

There are no `test`, `lint`, `format`, or coverage commands. Do not invent or claim them. `build:no-check` and `build:electron-fast` intentionally skip type checks.

## Code Conventions & Common Patterns

- Vue files use `<script setup lang="ts">`, Composition API primitives, scoped CSS, and hash-router navigation.
- Use two-space indentation. Existing TypeScript generally uses single quotes and semicolons, though formatting is not fully uniform and no formatter enforces it.
- Use camelCase for functions/variables, `handle…` for handlers, `use…` for composables, PascalCase for types/components, and `SCREAMING_SNAKE_CASE` for generator constants.
- TypeScript implementation files use kebab-case (`window-manager.ts`); Vue components/views use PascalCase (`ThemeToggle.vue`, `Login.vue`).
- Put reusable cross-process contracts in `shared/types.ts`. Keep filesystem, session, protocol, and `BrowserWindow` access in `electron/`; keep UI and renderer state in `src/`.
- Reuse functional seams: explicit parameters such as `BrowserWindow`/`hiddenButtons`, module getters, and guard clauses. There is no DI container, class service layer, Pinia/Vuex store, or second state system.
- Before window operations, check null/destroyed state. Use `async`/`await` with `try/catch` for user-visible operations; use Promise `.catch(...)` for fire-and-observe Electron calls. Log unexpected injection/config/protocol failures; swallow only documented non-critical failures.
- For new IPC behavior, expose a fixed preload method rather than raw `ipcRenderer`, add types to `src/vite-env.d.ts` or `shared/types.ts`, validate inputs/senders, and preserve context isolation.
- For behavior shared by main and child windows, extend `setupCommonWindowEvents`; keep role-specific logic in the existing main/child helpers. Put injected presentation changes in `shared/styles.ts` or `shared/control-panel-generator.ts`.
- Comments and user-facing messages are predominantly Simplified Chinese. Preserve that convention for UI/docs unless intentionally changing project language.

## Important Files

- `package.json` — scripts, direct dependencies, Electron entry, and electron-builder configuration.
- `pnpm-lock.yaml`, `pnpm-workspace.yaml` — reproducible graph, overrides, and allowed dependency build scripts.
- `vite.config.mts` — renderer-only Vite configuration.
- `electron.vite.config.mjs` — renderer + Electron main/preload development/build configuration; loading it clears `dist-electron/`.
- `vite.shared.mts` — shared output, minification, alias, chunk, and server settings.
- `tsconfig.json` — strict renderer configuration selected by `vue-tsc`.
- `tsconfig.node.json` — strict Electron/shared/Vite-config check invoked by `pnpm check`.
- `electron/app-config.ts` — config-file loading, CLI merging, and background-path resolution.
- `electron/app-lifecycle.ts`, `electron/window-manager.ts`, `electron/preload.ts`, `electron/ipc-handlers.ts` — main runtime and trust boundary.
- `README.md` — user-facing commands, CLI/config flags, themes, hidden controls, and manual behavior examples.
- `box_install.sh` — interactive installer for hosted Linux archives; it does not verify checksums and recursively applies mode `755`, so modify with deployment/security review.

## Runtime/Tooling Preferences

- Use Node.js **22.12+**; this floor is declared in `package.json` and required by Electron 44/Vite 8.
- Use **pnpm 12.3.4**. Do not create npm/yarn lockfiles or replace pnpm-specific `allowBuilds`/overrides.
- Vite configs are native-ESM-compatible (`.mts`/`.mjs`). Keep explicit extensions for local ESM imports and use `import.meta.dirname`, not `__dirname`.
- Keep renderer asset paths relative (`base: './'`) for packaged `file://` loading. `@` resolves to `src/`.
- Production renderer builds use Terser and drop `console`/`debugger`; do not rely on them for packaged diagnostics.
- electron-builder packages only `dist/**/*`, `dist-electron/**/*`, and the runtime `assets/index.ico`; README screenshots and source-only icons stay outside `app.asar`. Vue and Vue Router remain dev dependencies because Vite fully bundles them and packaged runtime `node_modules` is intentionally empty. Windows uses x64 NSIS; macOS uses DMG; Linux uses AppImage/deb/rpm for x64 and arm64.
- Supported runtime flags include `-link`, `-mode`, `-window`, `-page`, `-theme`, `-hide`, and `-bg`; hide values are comma-separated.

## Testing & QA

- No automated tests, test framework, linter, formatter, coverage setup, or repository CI exists. Treat every change as unprotected by regression tests.
- `pnpm check` is the repository-wide static gate: `vue-tsc` checks `src/**/*`, then `tsc -p tsconfig.node.json` checks Electron, shared code, and Vite configs.
- For Electron behavior, launch `pnpm start` and exercise the changed path. Relevant smoke scenarios include URL navigation/load failure, main versus child windows, theme/config precedence, hidden controls, cache/history clearing, fullscreen/top/single-page behavior, custom backgrounds, and `Ctrl + Shift + Alt` control-panel toggling.
- For packaging changes, use the checked `pnpm build:electron` or the relevant platform script and verify the expected files under `build/`.
- If adding tests, cover observable boundaries such as IPC validation, configuration precedence, URL normalization, theme persistence, and load-error routing. Introducing a runner/config is a new project-wide convention; keep it minimal and document the command.
