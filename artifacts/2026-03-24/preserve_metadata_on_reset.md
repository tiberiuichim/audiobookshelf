# Preserve Metadata on Reset: Specification

## Overview

The "Reset metadata to file tags" button in the Match tab was clearing all metadata including the cover image. When a book couldn't be matched, the user would lose their cover and all other curated metadata.

This fix modifies the reset behavior to only clear title and author fields, allowing the re-scan to populate title/author from file tags while preserving:
- Cover image
- Genres, tags, narrators
- Description, publisher, published year
- Series, chapters
- ISBN, ASIN, language, explicit/abridged flags

## Problem Statement

When using the "Reset metadata to file tags" button:
1. Cover was being cleared (`coverPath = null`)
2. All enriched metadata (genres, tags, description, etc.) was being lost
3. If the book couldn't be matched, the user ended up with no cover
4. User had to re-enter all metadata

## Solution

Modify the `resetMetadata()` methods in both `Book.js` and `Podcast.js` to:
1. Only clear title-related fields (`title`, `titleIgnorePrefix`, `titleNormalized`)
2. Only clear author associations (for books)
3. Preserve all other metadata including cover

## Implementation Details

### Files Modified

| Component | File | Change |
|-----------|------|--------|
| Backend | `server/models/Book.js` | Modified `resetMetadata()` to only clear title/author fields |
| Backend | `server/models/Podcast.js` | Modified `resetMetadata()` to only clear title/author fields |

### Book.resetMetadata() Changes

**Before:**
```javascript
async resetMetadata() {
  this.title = null
  this.titleIgnorePrefix = null
  this.titleNormalized = null
  this.subtitle = null
  this.publishedYear = null
  this.publishedDate = null
  this.publisher = null
  this.description = null
  this.isbn = null
  this.asin = null
  this.language = null
  this.explicit = false
  this.abridged = false
  this.genres = []
  this.tags = []
  this.narrators = []
  this.chapters = []
  this.coverPath = null

  // Clear associations
  const bookAuthorModel = this.sequelize.models.bookAuthor
  await bookAuthorModel.destroy({ where: { bookId: this.id } })
  if (this.authors) this.authors = []

  const bookSeriesModel = this.sequelize.models.bookSeries
  await bookSeriesModel.destroy({ where: { bookId: this.id } })
  if (this.series) this.series = []

  await this.save()
}
```

**After:**
```javascript
async resetMetadata() {
  this.title = null
  this.titleIgnorePrefix = null
  this.titleNormalized = null

  // Note: coverPath, genres, tags, narrators, description, series, chapters, etc.
  // are preserved to maintain user-curated metadata

  // Clear author associations
  const bookAuthorModel = this.sequelize.models.bookAuthor
  await bookAuthorModel.destroy({ where: { bookId: this.id } })
  if (this.authors) this.authors = []

  await this.save()
}
```

### Podcast.resetMetadata() Changes

**Before:**
```javascript
async resetMetadata() {
  this.title = null
  this.titleIgnorePrefix = null
  this.titleNormalized = null
  this.author = null
  this.releaseDate = null
  this.description = null
  this.itunesPageURL = null
  this.itunesId = null
  this.itunesArtistId = null
  this.language = null
  this.explicit = false
  this.coverPath = null
  this.tags = []
  this.genres = []

  await this.save()
}
```

**After:**
```javascript
async resetMetadata() {
  this.title = null
  this.titleIgnorePrefix = null
  this.titleNormalized = null
  this.author = null

  // Note: coverPath, genres, tags, description, language, explicit, etc.
  // are preserved to maintain user-curated metadata

  await this.save()
}
```

## Behavior After Fix

When user clicks "Reset metadata to file tags":
1. Title is cleared → Re-populated from file tags during scan
2. Author associations are cleared → Re-populated from file tags during scan
3. Cover is preserved → User keeps their existing cover
4. All other metadata is preserved → Genres, tags, description, series, etc. remain

## Verification Plan

### Manual Testing

1. Select a book with:
   - A cover image
   - Genres, tags, description
   - Title and author

2. Click "Reset metadata to file tags" button in Match tab

3. Verify:
   - Title/author are updated from file tags
   - Cover is preserved
   - Genres, tags, description remain unchanged
   - Series associations remain (for books)

4. Test with a book that has no valid file tags for title/author:
   - Title/author should become empty or use filename fallback
   - Cover and other metadata should still be preserved

### Edge Cases

- Book with no audio files: Should not break, title/author will be empty
- Podcast: Similar behavior, only title/author reset
- Book with locked metadata: Behavior unchanged (locked fields are protected elsewhere)

## Related Documentation

- [metadata_management_tools.md](../docs/metadata_management_tools.md) - General metadata management overview
- [reset_match_button.md](2026-03-07/reset_match_button.md) - Original feature specification
- [reset_metadata_deep_fix.md](2026-03-16/reset_metadata_deep_fix.md) - Previous bug fix for reset metadata