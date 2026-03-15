# Reset Metadata Deep Fix Specification

## Overview
This fix ensures that when a "Reset Metadata" or "Batch Reset Metadata" operation is performed, the database entries for the media (Book or Podcast) are actually cleared before the re-scan is triggered. Previously, only the `metadata.json` file was deleted and the `coverPath` cleared, but other fields like `tags`, `genres`, and `narrators` persisted in the database. Since the scanner skips fields that are not present in the new scan, these old values would remain.

## Implementation Details

### Model Changes
- **`Book.js`**: Added `resetMetadata()` method to clear `title`, `subtitle`, `description`, `genres`, `tags`, `narrators`, `chapters`, etc. and delete associations with `Author` and `Series`.
- **`Podcast.js`**: Added `resetMetadata()` method to clear `title`, `author`, `description`, `genres`, `tags`, etc.

### Controller Changes
- **`LibraryItemController.js`**: Updated `resetMetadata` and `batchResetMetadata` to call the new `resetMetadata()` method on the media object.

## Files Modified

| Component | File | Change |
| --- | --- | --- |
| Backend | `server/models/Book.js` | Added `resetMetadata()` method |
| Backend | `server/models/Podcast.js` | Added `resetMetadata()` method |
| Backend | `server/controllers/LibraryItemController.js` | Call `media.resetMetadata()` during reset operations |
| Test | `test/server/controllers/LibraryItemController_resetMetadata.test.js` | New test case to verify the fix |

## Verification Plan

### Automated Tests
- Run `npx mocha test/server/controllers/LibraryItemController_resetMetadata.test.js` to verify that both books and podcasts are correctly cleared of metadata and associations.

### Manual Verification
1.  Select a book with tags/genres.
2.  Perform a "Reset Metadata".
3.  Verify that tags/genres are cleared if they are not in the audio file tags.
4.  Verify that authors and series associations are cleared.
