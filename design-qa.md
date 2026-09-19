# Design QA: Box 1.1.0 browser shell

- Source visual truth: `C:\Users\Y-ASL\AppData\Local\Temp\codex-clipboard-b7738c96-119f-4c1d-a2b8-3d60fb5d7e0e.png`
- Implementation screenshot: `F:\Projects_Code\Box\design-qa\implementation-1.1.0.png`
- Full comparison: `F:\Projects_Code\Box\design-qa\comparison-1.1.0.png`
- Focused comparisons: `F:\Projects_Code\Box\design-qa\comparison-header-1.1.0.png`, `F:\Projects_Code\Box\design-qa\comparison-content-1.1.0.png`
- Viewport: 1444 × 904 CSS px
- Source pixels: 1444 × 904
- Implementation pixels: 1444 × 904
- Density normalization: both captures compared at 1:1 pixel size; no scaling applied before comparison
- State: light theme, local new-tab page, no recent sites, empty address fields

## Findings

No actionable P0, P1, or P2 mismatch remains.

- Fonts and typography: the implementation keeps the reference hierarchy, weight, line length, and fallback stack. The title, supporting copy, address bar, and tab labels remain optically consistent at the matched viewport.
- Spacing and layout rhythm: the tab strip, navigation row, title, supporting copy, and launch form align with the reference after the second pass. Component radii now come from one shared scale.
- Colors and visual tokens: the light palette preserves the reference's cool neutral surfaces and indigo accent. Dark-mode equivalents are defined through the same semantic tokens.
- Image and icon fidelity: the two requested letter-brand blocks are intentionally absent. All remaining interface symbols, including the new fullscreen control, use Lucide components; there are no replacement glyphs or handcrafted SVGs.
- Copy and content: the reference new-tab copy and labels are preserved. The red arrows are screenshot annotations and are intentionally not implemented.

## Interaction and runtime evidence

- Browser-rendered preview checked in the Codex in-app Browser at 1444 × 904.
- Theme toggle changed the interface to dark mode and back to light mode.
- Submitting `ftp://invalid` displayed the expected HTTP(S)-only validation message without navigation.
- Browser console check returned no warning or error entries.
- Electron-only window controls are not callable in the renderer-only browser preview; their IPC, preload, and shared types are covered by the repository-wide TypeScript check and production build.

## Comparison history

1. First pass: removing the hero `B` shifted the title and launch form upward by about 45 px, creating a P2 vertical-rhythm mismatch.
2. Fix: changed the new-tab top padding from `clamp(5rem, 13vh, 8rem)` to `clamp(9rem, 21vh, 12rem)`.
3. Second pass: the title and form align within roughly 7 px of the source while preserving the intentionally removed brand mark. The focused header comparison also confirms the removed top-left mark and added fullscreen control.

## Implementation checklist

- [x] Remove both visible `B` blocks.
- [x] Add custom fullscreen/exit-fullscreen control.
- [x] Preserve the custom frame and browser-style tab strip.
- [x] Use Lucide for all interface icons.
- [x] Apply the shared typography, spacing, radius, color, shadow, and motion tokens.
- [x] Verify the matched viewport, theme interaction, validation state, and console output.

## Follow-up polish

No P3 follow-up is required for the requested scope.

final result: passed
