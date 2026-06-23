# Library List View Specification

## Overview

Add a **List View** as an alternative to the existing Thumbnail (card) view in the Library bookshelf pages. Users should be able to toggle between Thumbnail and List views via a button in the toolbar. The List view displays books as rows in a table-like layout, showing cover, title, author, duration, and progress inline — similar to the existing `BookTableRow` component used in collections.

This feature targets the **main library bookshelf** (`/library/:id/bookshelf`) only. It does not apply to the library home page, series, collections, playlists, authors, genres, or tags pages.

## User-Facing Behavior

1. A new **view toggle button** appears in the toolbar on library bookshelf pages.
2. Clicking the button switches between **Thumbnail** (current default) and **List** views.
3. The selected view is persisted per-user in `localStorage` (following the existing user settings pattern).
4. In List view, each book is rendered as a single row containing:
   - Small cover thumbnail (left)
   - Title (primary text, link to item page)
   - Author / Narrator (secondary text)
   - Duration (right-aligned)
   - Progress bar or finished indicator (right-aligned)
   - Action buttons on hover (play, edit, more menu)
5. Pagination/scrolling behavior remains the same as the existing card view (virtual scrolling via `LazyBookshelf`).

## Architecture

### Existing View System

The codebase already has a two-tier view system:

| View Type | Constant | Description |
|-----------|----------|-------------|
| `STANDARD` (0) | `BookshelfView.STANDARD` | Card-based bookshelf with covers on "shelves" (horizontal rows with dividers) |
| `DETAIL` (1) | `BookshelfView.DETAIL` | Alternative view using `widgets-item-slider` with horizontal scrolling shelves and detail text below covers |

These are controlled by server settings (`bookshelfView`, `homeBookshelfView`) and are global, not per-user. The new List View is a **per-user preference** stored in the client-side user settings.

### Approach: New User Setting + Conditional Rendering

The cleanest approach is to add a new user setting `bookshelfListView: boolean` that, when enabled, renders a list-style layout instead of the card-based layout. This avoids modifying the `BookshelfView` constant enum and keeps the change scoped to user preferences.

### Key Components Involved

| Component | Role | Changes Needed |
|-----------|------|----------------|
| `client/store/user.js` | User settings state | Add `bookshelfListView: false` to default settings |
| `client/components/app/BookShelfToolbar.vue` | Toolbar with sort/filter controls | Add view toggle button (thumbnail/list icon) |
| `client/components/app/LazyBookshelf.vue` | Main bookshelf rendering for library pages | Add conditional list view rendering path |
| `client/components/tables/library/BookListRow.vue` **(NEW)** | Single row in list view | New component: cover + title + author + duration + progress + actions |
| `client/strings/en-us.json` | English translations | Add new string keys for UI labels |

## Detailed Design

### 1. New User Setting

**File:** `client/store/user.js`

Add to the `state.settings` object:

```js
bookshelfListView: false,
```

This setting is persisted to `localStorage` automatically by the existing `setSettings` mutation.

A new getter should be added:

```js
getBookshelfListView: (state) => !!state.settings.bookshelfListView,
```

### 2. View Toggle Button in Toolbar

**File:** `client/components/app/BookShelfToolbar.vue`

Add a toggle button in the toolbar (near the sort/filter selects) that switches the `bookshelfListView` setting. The button should show:

- `grid_view` icon when List view is active (click to switch back to Thumbnail)
- `view_list` icon when Thumbnail view is active (click to switch to List)

Implementation pattern — add a computed property and method:

```js
// computed
isListView() {
  return this.$store.getters['user/getBookshelfListView']
}

// method
toggleView() {
  this.$store.dispatch('user/updateUserSettings', {
    bookshelfListView: !this.isListView
  })
}
```

The button should only appear on the library bookshelf page (`isLibraryPage`), not on series/collections/playlists/authors pages.

### 3. New BookListRow Component

**File:** `client/components/tables/library/BookListRow.vue` **(NEW)**

A new component rendering a single book as a list row. Design inspired by the existing `BookTableRow.vue` (used in collections) and `ItemTableRow.vue` (used in playlists).

**Layout (horizontal flex row):**

| Column | Content | Width |
|--------|---------|-------|
| Cover | Small cover image (50px wide) | Fixed |
| Title | Book title (truncated, link to `/item/:id`) | Flex-grow |
| Author | Author name(s), series info | Flex-grow (secondary) |
| Duration | Formatted duration | Fixed (~80px) |
| Progress | Progress bar or finished checkmark | Fixed (~60px) |
| Actions | Play button, edit, more menu (on hover) | Fixed (~120px, slides in on hover) |

**Key features:**

- Click on title/cover navigates to item detail page
- Click on play button emits `play-item` event (same as card view)
- Hover reveals action buttons (edit, more menu with mark finished, collections, delete, etc.)
- Progress bar shown inline (thin horizontal bar or percentage)
- Handles podcasts (shows episode count instead of duration)
- Handles missing/invalid items (shows error indicator)
- Supports selection mode (radio button in first column)
- Respects `showSubtitles` user setting
- Series sequence badge, ebook format badge, RSS feed indicator

**Props:**

```js
props: {
  libraryItem: Object,
  index: Number,
  bookCoverAspectRatio: Number,
}
```

**Events:**

```js
// emit('select', { entity, shiftKey }) — for batch selection
// emit('edit', libraryItem, tab) — for edit modal
```

### 4. LazyBookshelf — List View Rendering Path

**File:** `client/components/app/LazyBookshelf.vue`

The `LazyBookshelf` component currently renders cards using the `bookshelfCardsHelpers` mixin with virtual scrolling (shelves + entity mounting). For the List view, a separate rendering approach is used.

**Approach:** When `isListView` is true, render list rows using the existing pagination system (`pagesLoaded`, `loadPage`, `booksPerFetch`). Only entities that have been fetched are rendered — the full `entities` array is NOT rendered at once. This prevents DOM bloat for large libraries.

**Rendering strategy:**

1. Add a `listContainer` ref div with scroll handling
2. On scroll, use `loadPage()` to fetch pages on demand (same as card view)
3. Render `BookListRow` components only for entities in loaded pages
4. Track `listVisibleRange` to limit DOM nodes to what's visible on screen
5. Use CSS `contain: layout style paint` on rows for rendering isolation

**Template changes:**

```html
<!-- List view rendering -->
<div v-if="isListView && initialized && entities.length" ref="listContainer" class="w-full list-view-container">
  <template v-for="entity in listVisibleEntities">
    <tables-library-book-list-row
      v-if="entity"
      :key="entity.id"
      :library-item="entity"
      :index="entities.indexOf(entity)"
      :book-cover-aspect-ratio="coverAspectRatio"
      @select="selectEntity"
      @edit="editEntity"
    />
  </template>
</div>
```

The existing card rendering (`shelf-*` divs with `mountEntityCard`) is hidden when in list view. The skeleton placeholders and empty states remain shared.

**Important:** The list view uses the same data fetching (`fetchEntites`, `loadPage`, pagination) as the card view — only the presentation layer changes. A computed `listVisibleEntities` filters `entities` to only those in loaded pages within the visible scroll range.

### 5. Strings (i18n)

**File:** `client/strings/en-us.json`

New string keys to add:

```json
"LabelListView": "List view",
"LabelThumbnailView": "Thumbnail view",
```

These are used as tooltips on the view toggle button.

## Files Modified / Created

| File | Type | Change |
|------|------|--------|
| `client/store/user.js` | Modify | Add `bookshelfListView` setting and getter |
| `client/components/app/BookShelfToolbar.vue` | Modify | Add view toggle button |
| `client/components/app/LazyBookshelf.vue` | Modify | Add list view rendering path |
| `client/components/tables/library/BookListRow.vue` | **Create** | New list row component |
| `client/strings/en-us.json` | Modify | Add tooltip string keys |

## State Management Flow

```
User clicks toggle button
  → BookShelfToolbar.toggleView()
  → dispatch('user/updateUserSettings', { bookshelfListView: true/false })
  → setSettings mutation (persists to localStorage)
  → emits 'user-settings' event on eventBus
  → LazyBookshelf.settingsUpdated() reacts (already listens to 'user-settings')
  → Component re-renders with new view type
```

The existing `settingsUpdated()` handler in `LazyBookshelf` already triggers a rebuild when settings change, which is sufficient for switching views.

## Verification Plan

1. **Toggle button visibility**: Confirm the view toggle button appears on the library bookshelf page, but NOT on the home page, series, collections, playlists, or authors pages.
2. **View switching**: Click the button and verify the view switches between Thumbnail and List.
3. **Persistence**: Refresh the page and confirm the last-selected view is restored.
4. **List row content**: Verify each row shows cover, title, author, duration, and progress correctly.
5. **Navigation**: Click on a row's title and confirm navigation to the item detail page.
6. **Play action**: Click the play button on a list row and confirm playback starts.
7. **Hover actions**: Hover over a row and verify action buttons appear (edit, more menu).
8. **More menu**: Open the more menu from a list row and verify all expected actions are present (mark finished, add to collection, delete, etc.).
9. **Selection mode**: Enter batch selection mode and verify radio buttons appear in list rows.
10. **Empty state**: Verify the empty library message still displays correctly in list view.
11. **Scrolling**: Verify scrolling works smoothly with many items in list view.
12. **Podcast items**: Verify podcast library items render correctly in list view (episode count instead of duration).
13. **Missing/invalid items**: Verify error indicators display correctly.
14. **Sort and filter**: Verify that changing sort order or filter works correctly in list view.
15. **Responsive**: Verify list view works on mobile screen sizes.

## Limitations & Future Work

### Known Limitations

1. **No full virtual scrolling for list view**: The list view uses the existing pagination system to limit fetched entities, and renders only visible-range entities. For very large libraries (1000+ items), further optimization with intersection observer-based virtual scrolling could be added.
2. **Home page, series, collections, playlists, authors pages unaffected**: The list view toggle only applies to the main library bookshelf page.
3. **No column sorting**: Clicking column headers does not sort. Sorting is controlled by the existing sort dropdown in the toolbar.
4. **No resizable columns**: Column widths are fixed.

### Future Enhancements

1. **Virtual scrolling for list view**: Implement intersection observer to only render visible rows, matching the card view's performance characteristics.
2. **Column customization**: Allow users to show/hide columns (duration, progress, etc.).
3. **Column header sorting**: Click column headers to sort by that field.
4. **Expandable rows**: Click to expand a row and show additional metadata (narrator, publisher, year, tags, description).
5. **Apply to other pages**: Extend list view to series, collections, and playlists pages.
6. **Keyboard navigation**: Arrow key navigation between list rows.

## Traceability

### No Backend Changes Required

This feature is entirely client-side. No API changes, database migrations, or server-side code modifications are needed. The existing API endpoints (`/api/libraries/:id/items`) return the same data regardless of view type.

### No Database Migration Required

The `bookshelfListView` setting is stored in the client's `localStorage` as part of the existing `userSettings` object. No database schema changes are needed.

### No Version Bump Required

Since no migration or server-side changes are involved, the `package.json` version does not need to be bumped.
