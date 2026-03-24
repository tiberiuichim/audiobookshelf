# Move to Library: Author Cleanup Fix

**Date:** 2026-03-24

## Problem

When moving books between libraries, author records in the source library are not being properly cleaned up when they become empty (have no remaining books).

### Root Cause Analysis

The `handleMoveLibraryItem` function has author cleanup logic, but the approach has issues:

1. **Cleanup happens inside the loop** - For each book-author link, we update the link then immediately check if the source author has 0 books. This works but is fragile.

2. **Fallback cleanup has wrong criteria** - The `checkRemoveAuthorsWithNoBooks` calls after `handleMoveLibraryItem` only remove authors that have NO metadata (no ASIN, description, imagePath). This means authors with metadata are never cleaned up as a fallback.

3. **Potential race conditions** - Having two cleanup mechanisms (in-transaction and post-transaction) can cause issues.

## Solution

Restructure author cleanup to:
1. Collect all source author IDs upfront
2. Perform all author migrations
3. Clean up empty source authors after ALL links are updated
4. Remove redundant `checkRemoveAuthorsWithNoBooks` calls

## Files Modified

| File | Changes |
|------|---------|
| `server/controllers/LibraryItemController.js` | Restructured author cleanup in `handleMoveLibraryItem`; removed redundant cleanup calls |

## Implementation Details

### Before (lines 296-349)

Cleanup happened inside the book-author loop, checking after each individual link update.

### After

```javascript
// 1. Collect source author IDs and migrate
const sourceAuthorIdsToCheck = []
for (const ba of bookAuthors) {
  const sourceAuthor = await Database.authorModel.findByPk(ba.authorId, { transaction })
  if (!sourceAuthor) continue
  
  sourceAuthorIdsToCheck.push(sourceAuthor.id)
  // ... migrate author to target library ...
}

// 2. Cleanup empty source authors AFTER all migrations complete
for (const sourceAuthorId of sourceAuthorIdsToCheck) {
  const remainingBooks = await Database.bookAuthorModel.getCountForAuthor(sourceAuthorId, transaction)
  if (remainingBooks === 0) {
    const sourceAuthor = await Database.authorModel.findByPk(sourceAuthorId, { transaction })
    if (sourceAuthor) {
      if (sourceAuthor.imagePath) {
        await fs.remove(sourceAuthor.imagePath).catch(...)
      }
      await sourceAuthor.destroy({ transaction })
      Database.removeAuthorFromFilterData(oldLibraryId, sourceAuthorId)
      SocketAuthority.emitter('author_removed', { id: sourceAuthorId, libraryId: oldLibraryId })
    }
  }
}
```

## Additional Cleanup

Removed redundant `checkRemoveAuthorsWithNoBooks` calls from:
- `move` endpoint (line ~1424)
- `batchMove` endpoint (line ~2225)

These calls used metadata-based criteria and could cause race conditions with the transaction-based cleanup.

## Testing

1. Move book that is author's only book → Source author deleted
2. Move book when author has other books → Source author preserved
3. Move book with author metadata (ASIN, description, image) → All metadata copied, source cleaned up