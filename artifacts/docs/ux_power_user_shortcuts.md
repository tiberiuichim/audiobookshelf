# UX and Power User Shortcuts

## Overview
Audiobookshelf includes several workflow improvements designed to speed up common tasks and ensure a smooth navigation experience.

## 1. Keyboard Shortcuts
To improve the efficiency of batch operations, global keyboard listeners have been added to the library views.

- **Select All**: `Ctrl + A` (Windows/Linux) or `Cmd + A` (macOS).
    - **Behavior**: Selects all items currently loaded on the screen.
    - **Persistent Selection**: If you scroll down and new items load while in "Select All" mode, the new items will be automatically selected.
    - **Exit**: Clicking outside the items or manually deselecting an item will toggle off the "Select All" persistent state.

- **Action Shortcuts** (Context-aware: Applied to selection in Library, or current item on Item Page):
    - **Consolidate**: `Ctrl + K`.
    - **Merge**: `Ctrl + M` (Requires 2+ selected items).
    - **Move to Library**: `Ctrl + Shift + M` or `Alt + M`.
    - **Reset Metadata**: `Alt + R`. (Note: `Alt` is used specifically to avoid conflict with standard "Reload" `Ctrl + R`).
    - **Quick Match / Match**: `Alt + Q`.

- **Navigation Shortcuts** (Requires an active library selection):
    - **Home**: `Alt + H`.
    - **Library**: `Alt + L`.
    - **Series**: `Alt + S`.
    - **Collections**: `Alt + C`.
    - **Authors**: `Alt + A`.

- **Modal & Prompt Controls**:
    - **Confirm / Submit**: `Enter` (Works on confirmation prompts and many action modals like "Move", "Quick Match", and "Split").
    - **Cancel / Close**: `Escape` (Closes modals, cancels prompts, and clears batch selections).

## 2. Navigation and Filter Persistence
The interface manages filter states dynamically to prevent confusion when switching contexts.

### Library Switch Reset
When you switch from one library to another (e.g., from "Audiobooks" to "Podcasts"):
- **Search Reset**: The search query is cleared.
- **Filter Reset**: All filters (Genre, Series, Collections, Progress) are reset to "All".
- **Sort Reset**: The view returns to the library's default sort order.
- **Rationale**: This prevents the "No results found" scenario that occurs when filters from one library are unknowingly applied to another.

### Home View "View All" Shortcuts
The Home view includes shortcuts next to shelf headlines to jump directly to a filtered/sorted library view.

| Shortcut | Action |
| :--- | :--- |
| **Recently Added** | Navigates to Library -> Bookshelf sorted by `Added At` (DESC). |
| **Recent Series** | Navigates to Library -> Series sorted by `Recent`. |
| **Newest Authors** | Navigates to Library -> Authors sorted by `Added At` (DESC). |

## 3. Batch Selection Mode
When multiple items are selected:
- A specialized **Selection App Bar** appears at the top.
- **Counters**: Displays exactly how many items are selected.
- **Contextual Menu**: The three-dot menu in this bar dynamically updates to show only actions relevant to the selected items (e.g., "Merge" only appears if books are selected).
- **Escape**: Pressing `Esc` or clicking the "X" in the selection bar clears all selections.
