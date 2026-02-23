# Select All Keyboard Shortcut Specification

## Overview
Enable `Ctrl+A` (or `Cmd+A` on macOS) to select all items in the library listing screen.

## Date
2026-02-15

## User Interface
- **Component**: `client/components/app/LazyBookshelf.vue`
- **Trigger**: Global `keydown` event listener active when the bookshelf is mounted.
- **Shortcut**: `Ctrl+A` / `Cmd+A`.
- **Behavior**:
    - Selects all currently loaded items in the bookshelf.
    - Sets a `isSelectAll` flag that automatically selects newly loaded items as the user scrolls.
    - Updates the "Selection Mode" UI with the total count of selected items.
    - Clicking/Deselecting an individual item while `isSelectAll` is active will toggle off the `isSelectAll` persistent state (but keep existing selections).

## Implementation Details

### Vuex Store
- **File**: `client/store/globals.js`
- **Mutation**: `addBatchMediaItemsSelected`
- **Purpose**: Efficiently add a large number of items to the `selectedMediaItems` array without duplicates.

### LazyBookshelf Component
- **Methods**:
    - `handleKeyDown(e)`: Detects the shortcut and calls `selectAll()`.
    - `selectAll()`: Iterates through loaded `entities`, builds media item objects, and commits them to the store.
    - `mountEntities()` Extension: Check `isSelectAll` flag and auto-select items as they are rendered.
- **Events**:
    - Listen for `keydown` on `window`.
    - Handle `bookshelf_clear_selection` event to reset `isSelectAll` flag.

## Artifacts
- This specification is saved as `artifacts/2026-02-15/select_all.md`.
