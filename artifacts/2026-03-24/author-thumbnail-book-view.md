# Author Thumbnail in Book View

## Overview

Add author thumbnail(s) below the book cover on the book details page. Each thumbnail displays:
1. Author image (or placeholder)
2. Author name
3. Number of books this author has in the library
4. "Unmatched" badge if the author lacks metadata (no ASIN, description, or image)
5. Quick match button on hover (for users with update permissions)
6. Links to the author's page when clicked

For books with multiple authors, thumbnails are stacked vertically under the book cover, each approximately 1/3 the width of the book cover (~70px for a208px cover).

## User Stories

1. As a user, I want to see the author's face/image when viewing a book, making it easier to recognize authors I enjoy
2. As a user, I want to quickly see how many books by this author are in my library
3. As a user, I want to quickly navigate to the author's page from the book view
4. As a librarian, I want to see which authors need matching so I can improve metadata

## Implementation Approach

**Frontend-Only**: Fetch author data separately using existing `GET /api/authors/:id` endpoint. This avoids backend changes and keeps the implementation simple.

## Files Modified

| File | Changes |
|------|---------|
| `client/components/cards/AuthorThumbnail.vue` | **New file** - Compact author thumbnail component |
| `client/pages/item/_id/index.vue` | Add author thumbnails section below book cover, fetch author details |
| `artifacts/index.md` | Add link to this specification |

## Component Details

### AuthorThumbnail.vue

A compact author thumbnail component that:
- Uses existing `AuthorImage.vue` for author image/placeholder
- Shows `numBooks` badge
- Shows "unmatched" icon (sync_problem) if author lacks ASIN, description, AND imagePath
- Hover reveals quick match button (search icon) for users with update permission
- Click navigates to `/author/:id`
- Emits `author-updated` event after successful quick match

**Props:**
```javascript
{
  author: Object, // { id, name, imagePath, asin, description, numBooks }
  width: Number, // Thumbnail width (default: 150)
}
```

### Book Details Page Changes

1. Added `authorsWithDetails` data property
2. Added `fetchAuthorDetails()` method to fetch author details via `/api/authors/:id`
3. Added `authorUpdated()` method to update author data after quick match
4. Added author thumbnails section in the template (stacked vertically)
5. Call `fetchAuthorDetails()` on mount and when library item updates

## Visual Layout

```
┌─────────────────────────┐
│                         │
│      [Book Cover]       │
│        (208px)          │
│                         │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ ⚡  [IMG]  Author Name  │  ← Thumbnail (~70px wide)
│           5 books       │     ⚡ = unmatched badge
│              🔍         │     🔍 = quick match on hover
└─────────────────────────┘
┌─────────────────────────┐
│     [IMG]  Co-Author    │  ← Additional author (stacked)
│           2 books       │
└─────────────────────────┘
```

## Verification Plan

1. **Unit tests**:Manual testing required**
   - Open a book details page with one author
   - Verify author thumbnail appears below book cover
   - Verify clicking thumbnail navigates to author page
   - Verify quick match button appears on hover for unmatched authors
   - Test with multiple authors (verify vertical stacking)
   - Test with authors that have images and without images
   - Test responsive layout (mobile vs desktop)

2. **Edge cases:**
   - Book with no authors (no thumbnails shown)
   - Author with no books (numBooks = 0)
   - Author with no image (placeholder shown)
   - Very long author names (text truncation)

## Limitations & Future Work

1. **Performance**: Fetching author details adds additional API calls. Future optimization could include adding author data to the library item API response or creating a batch endpoint.

2. **Caching**: Author data could be cached in Vuex store to reduce repeated API calls when navigating between books by the same author.