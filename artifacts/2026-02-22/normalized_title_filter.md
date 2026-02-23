# Normalized Title Filter Specification

## Overview
Added a "Duplicate Title" filter option to the frontend library controls. To support performant querying of duplicate titles across potentially massive libraries, a new `titleNormalized` concept was introduced to the backend models and database schema, allowing for fast `$Op.in` and `COUNT() > 1` matching via SQL.

## Verification Plan
1. Start server and ensure no migration errors occur
2. Verify existing books/podcasts have their `titleNormalized` fields backfilled
3. Select "Duplicate Title" in the library filter
4. Verify results contain books/podcasts that are identical or differ only by punctuation/casing

## Architectural Decisions
- **Pre-computed database fields**: Chosen over in-memory string similarity calculations to maintain $O(1)$ query complexity at filter time instead of $O(N^2)$ Node.js looping.
- **`getNormalizedTitle` Utility**: Centralized normalization to strip all non-unicode letter characters (`/[^\p{L}]/gu`), numbers, spaces, and ignore common sorting prefixes.
- **SQLite Triggers**: Implemented via migrations to automatically keep `libraryItems.titleNormalized` in sync with updates to `books.title` and `podcasts.title`.

## Traceability
| File | Changes |
| :--- | :--- |
| `server/utils/index.js` | Added `getNormalizedTitle` utility function. |
| `server/models/Book.js` | Added `titleNormalized` property and updated saving logic. |
| `server/models/Podcast.js` | Added `titleNormalized` property and updated saving logic. |
| `server/models/LibraryItem.js` | Added `titleNormalized` property, index, and hook copying from media. |
| `server/migrations/v2.32.9-*-columns.js` | Added migration to alter tables, backfill data, add hooks & triggers. |
| `server/utils/queries/libraryItemsBookFilters.js` | Added 'duplicates' filter handler to SQL mapping. |
| `server/utils/queries/libraryItemsPodcastFilters.js` | Added 'duplicates' filter handler to SQL mapping. |
| `client/components/controls/LibraryFilterSelect.vue` | Added "Duplicate Title" options to dropdown items. |
| `client/strings/en-us.json` | Added `LabelDuplicateTitle` translation string. |
