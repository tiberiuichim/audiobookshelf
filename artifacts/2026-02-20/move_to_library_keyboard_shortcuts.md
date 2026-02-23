# Move to Library — Keyboard Shortcut Buttons

**Date:** 2026-02-20

## Overview

Replace the dropdown-based library picker in the "Move to Library" dialog with a horizontal row of buttons. Each button represents a target library and has one letter highlighted (underlined) as a keyboard shortcut. Pressing that key immediately selects and executes the move.

## UX Design

- Libraries are displayed as **buttons in a horizontal, wrapping row** (flexbox wrap).
- Each button shows the library name with **one letter visually highlighted** (e.g. underlined, bold, or different color) to indicate its keyboard shortcut.
- Letters are assigned greedily: use the **first unused letter** of each library name, scanning left to right. This ensures the mnemonic is intuitive.
- When the dialog is open, pressing a shortcut key triggers the move immediately (same as clicking the button).
- If there are multiple folders in the target library, fall back to the existing folder dropdown before executing. 

## Letter Assignment Algorithm

```
used = {}
for each library in targetLibraries:
  for each character in library.name:
    letter = character.toLowerCase()
    if letter is a-z and letter not in used:
      assign letter as shortcut
      used.add(letter)
      break
```

## Keyboard Handling

- Listen for `keydown` events while the dialog is open.
- Match the pressed key against assigned shortcuts (case-insensitive).
- If matched and not processing, trigger `moveItems()` for that library.
- Ignore key events when a child input/select element is focused (e.g., folder dropdown).

## Visual Button Design

Each button should:
- Show the library name with the shortcut letter underlined.
- Have a hover/focus state.
- Show an active/selected state when a library is picked.
- The shortcut letter should be highlighted using a `<span>` with distinct styling (underline + slightly different color).
