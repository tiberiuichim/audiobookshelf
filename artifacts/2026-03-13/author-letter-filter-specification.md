# Author Letter Filter Specification

## Overview
Add a horizontal sticky navigation filter at the top of the Authors page that displays all letters present in author names. Clicking a letter filters the author listing to show only authors whose names start with that letter. Includes a "#" category for non-Latin author names.

## API Changes

### GET /api/libraries/:id/authors
**New Query Parameter**: `filter=letter.X` where X is A-Z or `#`

**Example**: `GET /api/libraries/:id/authors?filter=letter.A&sort=name`

**Backend Implementation** (server/controllers/LibraryController.js):
- Parse `filter` query param for pattern `letter.<char>`
- Apply SQL WHERE clause: `name LIKE 'X%'` for letters A-Z
- For `#` filter: Use regex to match names starting with non-letter characters

## Frontend Changes

### 1. User Settings Store (client/store/user.js)
- Add `authorFilterBy: 'all'` to default settings
- Reset to 'all' when changing libraries (in `checkUpdateLibrarySortFilter`)

### 2. LazyBookshelf (client/components/app/LazyBookshelf.vue)
- Add computed: `authorFilterBy` from user settings
- Modify `buildSearchParams()` to include letter filter for authors page
- Add method to extract unique first letters from loaded authors
- Emit available letters to parent component via event bus or store

### 3. BookShelfToolbar (client/components/app/BookShelfToolbar.vue)
- Add horizontal letter navigation in authors page section (line ~87-95)
- Sticky positioning: `position: sticky; top: 0; z-index: 50`
- Display: A-Z + # (for non-Latin)
- Only show letters that have authors (computed from LazyBookshelf)
- Click handler: Update `authorFilterBy` setting → triggers LazyBookshelf refetch

## UI Design

```
┌─────────────────────────────────────────────────────────────┐
│ [Home] [Library] [Series] [Playlists] [Collections] [Authors] │
├─────────────────────────────────────────────────────────────┤
│ A B C D E F G H I J K L M N O P Q R S T U V W X Y Z #     │ <- Sticky filter
├─────────────────────────────────────────────────────────────┤
│ Showing 42 Authors                            [Match All] [Sort ▼]
├─────────────────────────────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                           │
│ │Auth│ │Auth│ │Auth│ │Auth│                           │
│ └─────┘ └─────┘ └─────┘ └─────┘                           │
│ ...                                                          │
└─────────────────────────────────────────────────────────────┘
```

- Horizontal flex container with letter buttons
- "All" option to clear filter (shows all authors)
- Active letter highlighted with different background
- Scrollable horizontally on small screens
- Sticky at top of page

## Files Modified

| File | Changes |
|------|---------|
| `server/controllers/LibraryController.js` | Add letter filter parsing and SQL WHERE clause |
| `client/store/user.js` | Add `authorFilterBy` setting |
| `client/components/app/BookShelfToolbar.vue` | Add sticky letter navigation UI |
| `client/components/app/LazyBookshelf.vue` | Pass letter filter to API, compute available letters |

## Testing Plan

1. Navigate to Authors page (`/library/:id/bookshelf/authors`)
2. Verify horizontal letter filter appears at top
3. Click letter "A" - verify only authors starting with A are shown
4. Click letter "#" - verify authors with non-Latin names are shown
5. Click "All" or clear filter - verify all authors shown
6. Verify sort still works with filter
7. Verify filter persists on page refresh (via URL params)
8. Verify sticky behavior works when scrolling
