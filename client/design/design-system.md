# Starry Sky Design System

The design system has two sources of truth:

- **Executable tokens:** `client/src/styles/tokens.css`
- **Human-readable reference:** `/design-system`

The route is the visual reference. This document records the rules, decisions, and behavior that an agent should follow when changing the system.

## Product direction

**Arcade Orbit** is the canonical visual direction. The implemented UI takes priority over unused design explorations.

The interface uses:

- Cool near-black surfaces
- Warm primary text
- Violet as the primary action and selection color
- Space Grotesk for headings and actions
- Inter for body copy and navigation
- Space Mono for data readouts

Star-map rendering colors are outside this design system. Visualization colors should not be changed when updating interface tokens.

## Shared rules

### Color

Use semantic roles instead of one-off values:

- `--color-background`: page-level background
- `--color-panel`: standard container surface
- `--color-panel-raised`: nested or elevated controls
- `--color-text-primary`: headings and important content
- `--color-text-body`: normal reading text
- `--color-text-subtle`: metadata and supporting labels
- `--color-text-disabled`: unavailable controls
- `--color-accent`: primary actions, active states, and selection
- `--color-success`, `--color-warning`, `--color-danger`: feedback only. They color feedback text and outlines, and may also fill small status indicators (progress bars, status dots). They never fill large surfaces or buttons.

Violet should communicate interaction or importance, not serve as general decoration.

### Typography

- **Space Grotesk:** headings, buttons, active labels
- **Inter:** body copy, navigation, general UI
- **Space Mono:** timers, IDs, magnitudes, scores, ranks, and technical metadata

Preserve these roles on every platform. Adjust scale, not font families.

### Shape, spacing, and elevation

Reuse the spacing scale, button/card radii, focus ring, and shadow tokens from `tokens.css`. Do not introduce arbitrary values when an existing token fits.

Cards should remain dark, lightly bordered, moderately rounded, and restrained in their use of shadow.

About walkthrough cards and exploration controls cap at 400px and remain centered throughout the mobile layout (up to 900px); narrow phones retain fluid widths and page gutters.

Mobile geometry uses the shared `--page-gutter-mobile`, `--page-edge-start`, and `--page-edge-end` tokens. The edge tokens include `safe-area-inset-*` so content clears notches and rounded screen corners. `--touch-target-min` is the 44px minimum for controls. At the mobile breakpoint, the type scale steps down through token overrides; cards and grids become a single column.

### Accessibility

Every interactive element must have:

- Visible keyboard focus using the warm-white `--color-focus` outline and violet `--focus-ring`, including dialogs and custom button roles
- Adequate contrast
- A usable disabled state
- A touch target of at least 44px on mobile (`--touch-target-min`)
- Reduced-motion behavior where animation is present; duration tokens become zero when `prefers-reduced-motion: reduce` is active
- Text that can grow without breaking the layout

## Dialog and navigation behavior

Contextual dialogs use the native modeless API:

```js
dialog.show();
```

Do not replace this with `showModal()` unless the interaction is genuinely blocking. Modeless dialogs preserve navbar interaction and allow users to navigate to another route while the dialog is open.

This rule applies to desktop dialogs and mobile sheets unless a future interaction explicitly requires a blocking confirmation or safety flow.

### Play flow and layers

Only the current Play phase exposes a panel: start, instructions, gameplay, finishing, score submission, or leaderboard. Gameplay controls yield to the result panel as soon as every star is found. Map clicks cannot change a completed game or reopen submission. A request in progress disables its action and reports status; failures preserve entered data and offer a retry.

Contextual Play dialogs share one surface, responsive typography, rounded corners and outer gutters on mobile, and a 700px sheet breakpoint. Their final position must work independently of animation, including reduced motion. Dialogs sit above the gameplay panel, and primary navigation remains available above contextual content. Escape handling stays local so navigation can close normally.

The leaderboard reserves a viewport-sized table area across loading, errors, and different page lengths. Status messages use that same area. Column headings stay aligned in the scrolling table; pagination and replay stay centered in a stacked footer that stays in place.

## Responsive principles

Preserve meaning, hierarchy, and interaction language. Adapt geometry, density, and composition to the device.

### Desktop

- Use generous page gutters and layered compositions.
- Keep primary navigation horizontal and visible.
- Use overlay panels where they support the map experience.
- Hover may preview information, but actions must also work with keyboard focus.

### Mobile

- Prefer a single-column flow and full-width cards.
- Use compact, safe-area-aware page edges from the shared tokens.
- Use full-width panels or bottom sheets instead of cramped overlays.
- Replace hover behavior with tap, focus, or persistent selected states.
- Stack or widen primary actions for touch; every interactive example must expose keyboard focus and a 44px target.
- Reduce type scale and gutters while reusing the shared tokens.
- Keep route navigation available from contextual dialogs and sheets.
- Simplify motion when it competes with content; honor `prefers-reduced-motion`.

### Bottom sheet or overlay?

Prefer a **bottom sheet** for contextual content on mobile when it is touch-driven, needs more room than a popover, or should remain attached to the current screen. Prefer an **overlay** when content is brief, spatially anchored to its trigger, and should not interrupt the surrounding task. A blocking confirmation is the exception: use a modal dialog only when the user must resolve it before continuing.

## Game panel (timer and stars to find)

The timer and the "Stars to find" list are one component. They share one source of game state so they never disagree.

### Layout

- **Desktop:** a compact floating panel (220px wide) anchored top-right below the navbar. The star list always stays open; there is no collapse arrow or automatic collapse on map interaction.
- **Mobile:** a floating bottom panel inset by the shared 16px page gutters and device safe areas. A grab handle and the whole header toggle the list; no separate arrow. The first map interaction collapses it once per game. Keyboard Enter and Space also toggle the header.
- On screens from 480–700px, gameplay panels cap at 340px; Play dialogs cap at 400px. Center inset panels rather than stretching them across a compact tablet. Narrow phones retain fluid widths and 16px gutters.
- Both use the standard neutral panel border, rounded corners, panel background and overlay shadow. Play dialogs use the same neutral border and mobile outer spacing.

### Content

- A compact timer and a single found count (0/2, without the word found) share one header row. The compact timer uses Space Grotesk bold at 24px; the count uses Space Mono.
- Unfound stars appear first; found stars move to the bottom, preserving relative order within each group. A simple list shows each star name, with no cards, catalog IDs, dots or status tags. Found names become subdued and struck through; screen readers receive the found state as text.
- Remove the missing-star block, progress bar and repeated list heading/count.
- Star rows have a 28px minimum height and wrap long names. Desktop lists scroll at 360px; mobile lists are capped so the map remains visible.
- Collapsed mobile panels preview only the first unfound star, left-aligned below the timer and count. Mobile collapse changes the list height inside the panel, preserving its border and bottom gutter. Hidden content is inert, and the header exposes expanded state and list association. Motion respects reduced-motion preferences.

### Submit time

Option C is selected: a 32px Space Mono result with 44px line height, a Name placeholder with an accessible Name label, and a full-width Submit action. Keep validation, nickname autocomplete, and the 12-character limit. Show calculating/saving feedback in the fixed-size action button and announce it through a visually hidden live region. Do not reserve a blank status row below Submit; the bottom gap is the shared dialog padding.

### Leaderboard

Option A is the selected footer: centered pagination, followed by a centered Play again text action. Reserve table space across full, short, loading and failed pages so the panel and footer do not jump.

## Decision rule

> Preserve meaning, hierarchy, and interaction language. Adapt layout, density, and geometry to the device.

When a new component or pattern is introduced:

1. Reuse an existing token or component pattern.
2. Check whether the behavior is shared or platform-specific.
3. Add the rule here if it affects future implementation.
4. Update `/design-system` if the visual reference needs to change.
