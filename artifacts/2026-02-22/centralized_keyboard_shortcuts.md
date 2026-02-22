# Centralizing Keyboard Shortcuts

**Date:** 2026-02-22

## Objective
Centralize the definitions of all keyboard shortcuts into a single configuration file (`client/plugins/constants.js`). Currently, hotkeys are scattered across various components (e.g., `Appbar.vue`, `ContextMenuDropdown.vue`, `ShortcutsModal.vue`), with hardcoded keys like `Ctrl+K`, `Alt+H`, etc.

## Proposed Strategy
1. **Extend `$hotkeys` in `client/plugins/constants.js`:**
   Add a new section `App` or `Global` and `Batch` to store the exact combination of keys for each action.
   Example:
   ```javascript
   const hotkeys = {
     // ... existings ones ...
     Global: {
       Home: 'Alt-H',
       Library: 'Alt-L',
       Series: 'Alt-S',
       Collections: 'Alt-C',
       Authors: 'Alt-A',
       ShortcutsHelper: 'Shift-/'
     },
     Batch: {
       SelectAll: 'Ctrl-A',
       Consolidate: 'Ctrl-K',
       Merge: 'Ctrl-M',
       MoveToLibrary: 'Alt-M',
       ResetMetadata: 'Alt-R',
       QuickMatch: 'Alt-Q',
       Cancel: 'Escape'
     },
     ItemView: {
        // ...
     }
   }
   ```

2. **Refactor Event Listeners:**
   Modify `handleKeyDown` in `Appbar.vue` and `keyDown` in `default.vue` to check against these constants instead of relying on hardcoded `e.key` checks. They can use the existing `this.getHotkeyName(e)` (which returns format `Ctrl-K` or `Alt-K`) from `default.vue`.

3. **Refactor Visual Components:**
   Components like `ContextMenuDropdown.vue` and `ShortcutsModal.vue` should import or use `this.$hotkeys` mapping to display the combination in the UI, rendering the exact combination so if it changes in `constants.js`, it updates automatically everywhere. 

## Expected Outcome
- Easier to manage and modify shortcuts in the future.
- Reduced risk of conflicts.
- A single source of truth for the codebase and documentation.
