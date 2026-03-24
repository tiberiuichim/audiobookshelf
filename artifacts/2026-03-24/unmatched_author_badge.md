# Unmatched Author Badge Specification

## Overview

Add a visual indicator (badge) to author cards in the Authors listing to identify authors that are "unmatched" - meaning they have no metadata (no ASIN, no description, and no image).

## Definition of "Unmatched Author"

An author is considered **unmatched** when they have ALL of the following:
- No `asin` (Audible ASIN identifier)
- No `description` (author biography)
- No `imagePath` (author photo)

This is determined client-side from the author data already returned by the API.

## Implementation Details

### Backend (Server)

No changes required. The `/api/libraries/:id/authors` endpoint already returns `asin`, `description`, and `imagePath` fields in the author response.

### Cache Invalidation

When the Quick Match is triggered from the author card badge, the local author state is immediately updated with the response data to ensure:
1. The "Unmatched" badge disappears immediately after a successful match
2. The author image refreshes with the new `updatedAt` timestamp for cache busting

This is done by merging the response author data into the local state:
```javascript
this.author = { ...this.author, ...response.author }
```

The response includes `asin`, `description`, `imagePath`, and `updatedAt` fields which allows the `isUnmatched` computed property to recompute and the `AuthorImage` component to generate a new cache-busted image URL.

### Frontend (Client)

**File: `client/components/cards/AuthorCard.vue`**

#### Changes Made:

1. **Computed Property**: Added `isUnmatched` computed property that checks if the author has no asin, no description, and no imagePath.

2. **Badge UI**: Added a badge overlay in the bottom-left corner of the author card that:
   - Uses a yellow background (`bg-warning`) consistent with other "attention needed" indicators
   - Shows a "sync problem" icon (`sync_problem`) to indicate missing metadata
   - Has a tooltip explaining "Unmatched - No metadata found"
   - Is clickable and triggers Quick Match when the user has update permissions
   - Is always visible (not just on hover) for easy scanning of unmatched authors

3. **Positioning**: Bottom-left corner, similar to the "not consolidated" badge on book cards. Positioned to avoid overlap with the author name overlay at the bottom.

#### Badge Styling:
- Position: `absolute bottom-0 left-0`
- Z-index: `z-10` (above the cardbackground)
- Padding: `0.375em`
- Icon size: `1em`
- Background: `bg-warning` (yellow)
- Border: `border border-black/20`
- Border radius: `rounded-full` for circular appearance

### Toast Messages

Reuses existing translation strings:
- `ToastAuthorUpdateSuccess` - When match succeeds
- `ToastAuthorUpdateSuccessNoImageFound` - When match succeeds but no image found
- `ToastNoUpdatesNecessary` - When match finds nothing to update
- `ToastAuthorNotFound` - When author not found

## Files Modified

| File | Change Type | Description |
|------|-------------|-------------|
| `client/components/cards/AuthorCard.vue` | Modify | Add unmatched badge withcomputed property and UI element |
| `artifacts/index.md` | Modify | Add reference to this specification |

## Verification Plan

1. Create test library with multiple authors
2. Manually verify badge appears on authors without any metadata
3. Verify badge does NOT appear on authors with at least one of: ASIN, description, or image
4. Test clicking the badge triggers Quick Match
5. Verify badge disappears after successful match
6. Verify badge is visible on both desktop and mobile views
7. Verify tooltip shows on hover over the badge

## Edge Cases

- **Author with only ASIN**: Should NOT show badge (partial match)
- **Author with only description**: Should NOT show badge (partial match)
- **Author with only image**: Should NOT show badge (partial match)
- **Author with no books**: Badge still shows if unmatched (numBooks doesn't affect matched status)
- **User without update permission**: Badge shows but is not clickable, tooltip still appears

## Future Considerations

1. **Filter Option**: Add filter in Authors page toolbar to show only unmatched authors
2. **Bulk Action**: Add "Match All Unmatched" button functionality (already exists as "Match Unmatched Authors")
3. **Statistics**: Show count of unmatched authors in library stats