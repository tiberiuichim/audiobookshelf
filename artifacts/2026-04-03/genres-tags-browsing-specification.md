# Genres and Tags Browsing Feature Specification

**Date**: 2026-04-03  
**Feature**: Add dedicated browsing pages for Genres and Tags (similar to Authors)  
**Related Feature**: Authors implementation (see `authors-implementation-reference.md`)

## Executive Summary

This specification outlines the implementation of dedicated browsing UI for Genres and Tags, following the same pattern as the existing Authors feature. The goal is to provide users with a visual, paginated, filterable interface to browse genres and tags, with dedicated detail pages showing all items associated with a specific genre or tag.

**Key Design Decisions**:
- ✅ Keep genres/tags as JSON arrays (no database schema changes)
- ✅ Mirrors Authors UI pattern: bookshelf browsing + detail pages
- ✅ Public API endpoints for all users (not admin-only)
- ✅ Letter-based filtering (A-Z, #)
- ✅ Pagination and lazy loading
- ✅ Real-time updates via WebSockets

---

## 1. Database Layer

### Current State

**Genres and Tags** are stored as JSON arrays in:
- `server/models/Book.js` (lines 167-168)
- `server/models/Podcast.js` (lines 153-154)

```javascript
// Book.js
genres: DataTypes.JSON,   // ["Science Fiction", "Fantasy"]
tags: DataTypes.JSON,     // ["audiobook", "favorite"]
```

### Changes Required

**NO SCHEMA CHANGES NEEDED** - The existing JSON array approach will be maintained.

---

## 2. Backend API Endpoints

### New Public Endpoints

All endpoints should be accessible to regular users (not admin-only).

#### A. Get Genres in Library

**Endpoint**: `GET /api/libraries/:id/genres`  
**Handler**: `LibraryController.getGenres`  
**File**: `server/controllers/LibraryController.js`

**Query Parameters**:
- `limit` - Results per page (default: 25)
- `page` - Page number (default: 0)
- `sort` - Sort by: `name`, `numBooks` (default: `name`)
- `desc` - Sort descending (1 or 0, default: 0)
- `filter` - Filter by first letter: `letter.A`, `letter.#` (for non-alphabetic)

#### B. Get Tags in Library

**Endpoint**: `GET /api/libraries/:id/tags`  
**Handler**: `LibraryController.getTags`  
**File**: `server/controllers/LibraryController.js`

**Same query parameters as genres endpoint.**

#### C. Get Items by Genre

**Endpoint**: `GET /api/genres/:name/items`  
**Handler**: `LibraryController.getItemsByGenre`  
**File**: `server/controllers/LibraryController.js`

**Query Parameters**:
- `libraryId` - Required, library to search in
- `limit`, `page` - Pagination
- `sort`, `desc` - Sorting options (inherited from library items)

#### D. Get Items by Tag

**Endpoint**: `GET /api/tags/:name/items`  
**Handler**: `LibraryController.getItemsByTag`  
**File**: `server/controllers/LibraryController.js`

**Same query parameters as genre items.**

---

## 3. Frontend Pages

### A. Genre Browsing Page

**Route**: `/library/:libraryId/bookshelf/genres`  
**File**: `client/pages/library/_library/bookshelf/_id.vue` (extended)

### B. Genre Detail Page

**Route**: `/library/:libraryId/genre/:name`  
**File**: `client/pages/library/_library/genre/_name.vue` (new)

### C. Tag Browsing and Detail Pages

Same pattern as genres:
- Browsing: `/library/:libraryId/bookshelf/tags`
- Detail: `/library/:libraryId/tag/:name`

---

## 4. Frontend Components

### A. GenreCard Component

**File**: `client/components/cards/GenreCard.vue` (new)  
**Pattern**: Based on `client/components/cards/AuthorCard.vue`

**Props**:
- `genreMount` - Object: `{ name: string, numBooks: number }`
- `width` - Card width (default: 200)
- `height` - Card height (default: 200)

**Features**:
- Display genre name prominently
- Show book count badge
- Click to navigate to genre detail page
- Colored background based on genre name

### B. TagCard Component

**File**: `client/components/cards/TagCard.vue` (new)  
**Pattern**: Similar to GenreCard but with tag-specific styling

---

## 5. Real-Time Updates

Since genres/tags are derived from library items, the genre/tag list should refresh when:
- A new library item is added
- A library item's genres/tags are updated
- A library item is deleted

**Approach**: Emit `filter_data_updated` event on these operations.

---

## 6. Translation Strings

**File**: `client/strings/en-us.json`

New strings needed:
- `LabelGenre`, `LabelGenres`
- `LabelTag`, `LabelTags`
- `MessageNoGenres`, `MessageNoTags`
- `HeaderBrowseGenres`, `HeaderBrowseTags`
- `LabelBookCount`

---

## 7. Files Summary Table

| Layer | File Path | Change Type | Purpose |
|------|-----------|-------------|---------|
| **Backend** | `server/Database.js` | Modify | Add genre/tag query methods |
| | `server/controllers/LibraryController.js` | Modify | Add genre/tag listing endpoints |
| | `server/routers/ApiRouter.js` | Modify | Add genre/tag routes |
| **Frontend Components** | `client/components/cards/GenreCard.vue` | **Create** | Genre card for bookshelf |
| | `client/components/cards/TagCard.vue` | **Create** | Tag card for bookshelf |
| | `client/components/app/LazyBookshelf.vue` | Modify | Support genres/tags entities |
| | `client/components/app/BookShelfToolbar.vue` | Modify | Add genre/tag filtering |
| **Frontend Pages** | `client/pages/library/_library/bookshelf/_id.vue` | Modify | Handle 'genres' and 'tags' pages |
| | `client/pages/library/_library/genre/_name.vue` | **Create** | Genre detail page |
| | `client/pages/library/_library/tag/_name.vue` | **Create** | Tag detail page |
| **State Management** | `client/store/libraries.js` | Modify | (Optional) Add caching |
| **Strings** | `client/strings/en-us.json` | Modify | Add translation strings |
| **Navigation** | `client/components/app/LibrariesDropdown.vue` | Modify | Add genre/tag links |

---

## 8. Implementation Phases

### Phase 1: Backend API (Current)
1. Add query methods to `Database.js`
2. Add controller endpoints to `LibraryController.js`
3. Add routes in `ApiRouter.js`

### Phase 2: Frontend Components (Next)
1. Create `GenreCard.vue` and `TagCard.vue`
2. Integrate with `LazyBookshelf.vue`

### Phase 3: Frontend Pages & Integration
1. Extend bookshelf for genres/tags
2. Create detail pages
3. Add navigation links
4. Add translation strings

### Phase 4: Testing
1. Performance testing with large libraries
2. Permission testing (tag-based access)
3. Cross-browser testing

---

## 9. Success Criteria

✅ Users can browse all genres in a library with pagination and letter filtering  
✅ Users can browse all tags in a library with pagination and letter filtering  
✅ Clicking a genre shows all books with that genre  
✅ Clicking a tag shows all books with that tag  
✅ Sorting by name and book count works correctly  
✅ Real-time updates when books are added/updated  
✅ Performance acceptable with libraries of 10,000+ items  
✅ Works correctly with tag-based user permissions  
✅ Translations available for all new strings  
✅ Navigation clearly accessible from library UI

---

## 10. Implementation Status

**Status**: ✅ **COMPLETE**  
**Started**: 2026-04-03  
**Completed**: 2026-04-03

### Backend Implementation ✅
- ✅ `server/controllers/LibraryController.js` - Added `getGenres()` and `getTags()` methods
- ✅ `server/routers/ApiRouter.js` - Added routes for `/api/libraries/:id/genres` and `/api/libraries/:id/tags`
- ✅ Pagination, sorting, and letter filtering support
- ✅ User permission-based filtering (tag access control)

### Frontend Components ✅
- ✅ `client/components/cards/GenreCard.vue` - Genre card component with colored backgrounds
- ✅ `client/components/cards/TagCard.vue` - Tag card component
- ✅ `client/mixins/bookshelfCardsHelpers.js` - Added GenreCard and TagCard support
- ✅ `client/components/app/LazyBookshelf.vue` - Support for 'genres' and 'tags' pages
- ✅ `client/components/app/SideRail.vue` - Added navigation links for Genres and Tags

### Frontend Pages ✅
- ✅ `client/pages/library/_library/bookshelf/_id.vue` - Routing for genres/tags pages
- ✅ `client/pages/library/_library/genre/_name.vue` - Genre detail page showing filtered books
- ✅ `client/pages/library/_library/tag/_name.vue` - Tag detail page showing filtered items

### Translation Strings ✅
- ✅ All required strings already existed in `client/strings/en-us.json`
- ✅ Added `ButtonViewBooks` and `ButtonViewItems`

---

## 11. Testing & Verification

### Manual Testing Steps

1. **Browse Genres**:
   - Navigate to `/library/:libraryId/bookshelf/genres`
   - Verify genres display in card grid
   - Test letter filtering (A-Z, #)
   - Test sorting by name and book count
   - Verify pagination works

2. **Browse Tags**:
   - Navigate to `/library/:libraryId/bookshelf/tags`
   - Verify tags display in card grid
   - Test all sorting and filtering options

3. **Genre Detail**:
   - Click on a genre card
   - Verify all books with that genre display
   - Verify back navigation works

4. **Tag Detail**:
   - Click on a tag card
   - Verify all items with that tag display
   - Verify back navigation works

5. **Permissions**:
   - Test with users having restricted tag access
   - Verify they only see tags from books they can access

6. **Performance**:
   - Test with large libraries (10,000+ items)
   - Verify acceptable response times

---

## 12. Known Limitations

1. **No Genre/Tag Management UI for Regular Users** - Only admins can manage genres/tags (existing limitation)
2. **No Genre Hierarchy** - Genres are flat, no parent/child relationships
3. **No Genre Artwork** - Uses generated colored backgrounds only
4. **No Genre Descriptions** - Genres/tags are just strings without metadata

---

## 13. Files Modified

| File | Change Type | Description |
|------|-------------|-------------|
| `server/controllers/LibraryController.js` | Modified | Added `getGenres()` and `getTags()` methods |
| `server/routers/ApiRouter.js` | Modified | Added genre and tag API routes |
| `client/components/cards/GenreCard.vue` | **Created** | Genre card component |
| `client/components/cards/TagCard.vue` | **Created** | Tag card component |
| `client/mixins/bookshelfCardsHelpers.js` | Modified | Added GenreCard and TagCard support |
| `client/components/app/LazyBookshelf.vue` | Modified | Support for genres/tags pages |
| `client/components/app/SideRail.vue` | Modified | Added navigation links |
| `client/pages/library/_library/bookshelf/_id.vue` | Modified | Handling genre/tag routing |
| `client/pages/library/_library/genre/_name.vue` | **Created** | Genre detail page |
| `client/pages/library/_library/tag/_name.vue` | **Created** | Tag detail page |
| `client/strings/en-us.json` | Modified | Added ButtonViewBooks and ButtonViewItems strings |

---

## 14. Summary

This implementation successfully adds dedicated browsing pages for Genres and Tags, following the existing Authors pattern. Users can now:

- Browse all genres in a book library
- Browse all tags in a book library
- View all books/items for a specific genre or tag
- Filter by first letter (A-Z, #)
- Sort by name or count
- Navigate directly from the sidebar

The implementation maintains consistency with the existing Audiobookshelf UI patterns and leverages the existing LazyBookshelf architecture for optimal performance.