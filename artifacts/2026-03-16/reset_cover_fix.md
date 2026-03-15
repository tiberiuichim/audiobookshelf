# Bug Fix: Reset Cover to Original Extracted Cover

## Overview

This fix addresses an issue where resetting a book's cover to the one extracted from its audio or ebook files would fail with the message "Cover is already using the original extracted cover" if a cover file (e.g., `cover.jpg`) already existed in the item's directory.

## Root Cause

1.  **CoverManager Bailing:** The `CoverManager.saveEmbeddedCoverArt` method would bail and return `null` if a `cover.jpg` or `cover.png` already existed in the target directory, preventing the extraction from taking place during a reset operation.
2.  **Path Comparison Logic:** Even if extraction succeeded and overwrote the file, the `Scanner.resetCoverLibraryItem` method would only consider it an update if the `coverPath` *string* changed. Since extraction often produces a file at the same path (e.g., replacing a provider cover at `metadata/items/ID/cover.jpg` with an extracted one at the same path), the update was rejected.

## Changes

### Backend

- **CoverManager (`server/managers/CoverManager.js`):**
    - Added an `overwrite` parameter to `saveEmbeddedCoverArt` and `saveEbookCoverArt` (defaulting to `false`).
    - Methods now only bail if `coverAlreadyExists` is true AND `overwrite` is false.
- **Scanner (`server/scanner/Scanner.js`):**
    - Updated `resetCoverLibraryItem` to call `saveEmbeddedCoverArt` and `saveEbookCoverArt` with `overwrite: true`.
    - Introduced a `wasOverwritten` flag to ensure that if extraction successfully occurred, the operation is considered an update even if the resulting path is identical to the original path.

### Traceability (Files Modified)

| File | Category | Change Description |
| :--- | :--- | :--- |
| `server/managers/CoverManager.js` | Backend | Added `overwrite` parameter to extraction methods. |
| `server/scanner/Scanner.js` | Backend | Updated reset logic to use overwrite and track extraction success. |

## Verification Plan

1.  **Reproduction:**
    - Match a book with Audible/Google to download a `cover.jpg`.
    - Click "Reset Cover" on the Item Details page.
    - **Observed Behavior (Before Fix):** Toast says "Cover is already using the original extracted cover".
2.  **Verification:**
    - Perform the same steps.
    - **Expected Behavior (After Fix):** Toast says "Cover reset successfully" and the cover is replaced with the one from the audio/ebook file.
3.  **No Regression:**
    - Ensure regular scanning (where `overwrite` is false) still works and doesn't unnecessarily overwrite existing covers if they are already in the DB.
