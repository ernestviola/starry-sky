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
- `--color-success`, `--color-warning`, `--color-danger`: feedback only

Violet should communicate interaction or importance, not serve as general decoration.

### Typography

- **Space Grotesk:** headings, buttons, active labels
- **Inter:** body copy, navigation, general UI
- **Space Mono:** timers, IDs, magnitudes, scores, ranks, and technical metadata

Preserve these roles on every platform. Adjust scale, not font families.

### Shape, spacing, and elevation

Reuse the spacing scale, button/card radii, focus ring, and shadow tokens from `tokens.css`. Do not introduce arbitrary values when an existing token fits.

Cards should remain dark, lightly bordered, moderately rounded, and restrained in their use of shadow.

### Accessibility

Every interactive element must have:

- Visible keyboard focus
- Adequate contrast
- A usable disabled state
- A touch target of approximately 44px on mobile
- Reduced-motion behavior where animation is present
- Text that can grow without breaking the layout

## Dialog and navigation behavior

Contextual dialogs use the native modeless API:

```js
dialog.show();
```

Do not replace this with `showModal()` unless the interaction is genuinely blocking. Modeless dialogs preserve navbar interaction and allow users to navigate to another route while the dialog is open.

This rule applies to desktop dialogs and mobile sheets unless a future interaction explicitly requires a blocking confirmation or safety flow.

## Responsive principles

Preserve meaning, hierarchy, and interaction language. Adapt geometry, density, and composition to the device.

### Desktop

- Use generous page gutters and layered compositions.
- Keep primary navigation horizontal and visible.
- Use overlay panels where they support the map experience.
- Hover may preview information, but actions must also work with keyboard focus.

### Mobile

- Prefer a single-column flow.
- Use full-width panels or bottom sheets instead of cramped overlays.
- Replace hover behavior with tap, focus, or persistent selected states.
- Stack or widen primary actions for touch.
- Reduce type scale and gutters while reusing the shared tokens.
- Keep route navigation available from contextual dialogs and sheets.
- Simplify motion when it competes with content.

## Decision rule

> Preserve meaning, hierarchy, and interaction language. Adapt layout, density, and geometry to the device.

When a new component or pattern is introduced:

1. Reuse an existing token or component pattern.
2. Check whether the behavior is shared or platform-specific.
3. Add the rule here if it affects future implementation.
4. Update `/design-system` if the visual reference needs to change.
