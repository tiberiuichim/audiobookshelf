# Feature Specification: Book Details & Batch Cover Quick Match

## Overview

This specification covers enhancements made to the book details view to expand the metadata display, improve layout, and introduce a highly targeted batch action to match only covers.

## 1. Book Details Layout & Metadata (LibraryItemDetails.vue)

### Fields Added

- **ASIN:** Included directly from the book's metadata if present. Displayed as a clickable link leading out to `https://www.audible.com/pd/<ASIN>`.
- **ISBN:** Included directly from the book's metadata if present. Displayed as raw text.

### Dual-Column Layout Structure

- The `LibraryItemDetails.vue` component layout was refined using a responsive CSS Grid:
  ```html
  <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 mt-4"></div>
  ```
- This implementation ensures that extensive metadata (like Duration, Size, Narrators, Genres, Tags, Languages, Year, Publisher, ISBN, ASIN) takes up less vertical space by flowing into two parallel columns on wider viewports (`md` breakpoints and above), whilst maintaining a neat single-column view on mobile devices.

## 2. Batch Quick Match Covers (BatchQuickMatchCoversModal.vue)

### Purpose

Allows users to select multiple books and trigger an API process that searches configured providers (like Audible or Google) exclusively for new covers. Other metadata (like Title, Description, Authors) remains completely untouched.

### Backend Implementation

- **Scanner Endpoint:** `Scanner.quickMatchCoverLibraryItem` added to uniquely handle downloading and saving just the cover from standard Provider queries.
- **Route:** `POST /api/items/batch/quickmatch-covers` implemented on `LibraryItemController` to process bulk requests and emit the `batch_quickmatch_covers_complete` websocket event.

### User Interface Changes

- **Toolbar Multi-select Action:** A new `Quick Match Covers` action appears under the context menu (edit pencil -> triple dot) in the multi-select toolbar alongside standard options.
- **Modal Component:** `BatchQuickMatchCoversModal.vue` allows the selection of a specific book cover provider (using `bookCoverProviders` from the store). It warns the user that this will override existing covers but won't change other details, then triggers the API route to perform the matches.

## Interactions & Behavior

1. **Selection Context:** The user multi-selects items via the shift-click methodology on the Bookshelf.
2. **Launch:** Selecting `Quick Match Covers` under the batch context menu toggles the modal.
3. **Configuration:** The user switches the API Provider dropdown target to one with superior covers for their collection (e.g. `audible`).
4. **Processing:** Submission marks the UI as `processingBatch`. The server downloads missing covers async. Once complete, it clears processing and reports success visually, updating the thumbnail indicators.
