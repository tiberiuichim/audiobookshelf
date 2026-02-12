# Specification: Merge Books Feature

## Implementation Plan

# Merge Books Feature Implementation Plan

## Goal Description

Allow users to select multiple books (e.g., individual mp3 files improperly imported as separate books) and "Merge" them into a single book. This involves moving all files to a single folder and updating the database to reflect a single library item containing all files.

## Proposed Changes

### Backend

#### [NEW] `server/controllers/LibraryItemController.js`

- Implement `batchMerge(req, res)` method.
  - **Validation**: Ensure user has update/delete permissions. Check all items belong to the same library and are books.
  - **Primary Item Selection**: Use the first selected item as the "primary" item (the one that will act as the container).
  - **Target Folder**: Determine the target folder path.
    - If the primary item is already in a suitable folder (e.g. `Author/Title`), use it.
    - If the items are in the root or disorganized, create a new folder based on the primary item's metadata (Author/Title).
  - **File Operations**:
    - Iterate through all _other_ selected items.
    - Move their media files (audio, ebook, cover) to the target folder.
    - Handle filename collisions (append counter if needed).
    - Update `LibraryItem` entries? No, we will rescind the primary item.
  - **Database Updates**:
    - Delete the _other_ `LibraryItem` records from the database.
    - Trigger a rescan of the primary item's folder to pick up the new files and update tracks/chapters.
    - Clean up empty source folders of the moved items.

#### [MODIFY] `server/routers/ApiRouter.js`

- Add `POST /items/batch/merge` route mapped to `LibraryItemController.batchMerge`.

### Frontend

#### [MODIFY] `client/components/app/Appbar.vue`

- Update `contextMenuItems` computed property.
- Add "Merge" option when:
  - User has update/delete permissions.
  - Library is a "book" library.
  - Multiple items are selected (`selectedMediaItems.length > 1`).
- Implement `batchMerge()` method to call the API.
  - Add confirmation dialog explaining what will happen.

## Verification Plan

### Manual Verification

1. **Setup**:
   - Add multiple individual mp3 files to the root of a library (or separate folders) so they show up as separate books.
   - Ensure they have some metadata (Title/Author) or add it manually.
2. **Execution**:
   - Go to the library in the web UI.
   - Select the multiple "books" (mp3 files).
   - Click the Multi-select "x items selected" bar if not already open (it opens automatically on selection).
   - Click the Context Menu (3 dots) or find the "Merge" button (to be added).
   - Select "Merge".
   - Confirm the dialog.
3. **Result Validation**:
   - Verify that the separate books disappear.
   - Verify that one single book remains.
   - Open the remaining book and check "Files" tab. It should contain all the mp3 files.
   - Check the filesystem: Ensure all mp3 files are now in the same folder.
   - Check metadata: Ensure the book plays correctly.

## Walkthrough

# Merge Books Feature Walkthrough

I have implemented the "Merge Books" feature, which allows users to combine multiple library items (specifically books) into a single library item. This is particularly useful for fixing issues where individual audio files were imported as separate books.

## Changes

### Backend

- **`server/controllers/LibraryItemController.js`**: Added `batchMerge` method.
  - Validates that all items are books and from the same library.
  - Identifies a "primary" item (the first one selected).
  - Creates a new folder for the book if the primary item is a file in the root.
  - Moves all media files from the other selected items into the primary item's folder.
  - Deletes the old library items for the moved files.
  - Triggers a scan of the primary item to update metadata and tracks.
  - Cleans up empty authors and series.
- **`server/routers/ApiRouter.js`**: Added `POST /api/items/batch/merge` route.

### Frontend

- **`client/components/app/Appbar.vue`**: Added "Merge" option to the multi-select context menu.
  - Enabled only when multiple books are selected.
  - Shows a confirmation dialog before proceeding.
- **`client/strings/en-us.json`**: Added localization strings for the new feature.

## Verification

### Automated Tests

I created a new test file `test/server/controllers/LibraryItemController_merge.test.js` to verify the backend logic.

To run the verification test:

```bash
npx mocha test/server/controllers/LibraryItemController_merge.test.js --exit
```

**Test Results:**

```
  LibraryItemController Merge
    batchMerge
      ✔ should merge two file-based items into a new folder

  1 passing (113ms)
```

### Manual Verification Steps

1. **Identify Split Books**: Find a set of books in your library that should be a single book (e.g., "Chapter 1", "Chapter 2" showing as separate books).
2. **Select Books**: Enable multi-select and click on the books you want to merge.
3. **Click Merge**: In the top URI bar, click the menu button (3 dots) and select **Merge**.
4. **Confirm**: Accept the confirmation dialog ("Are you sure you want to merge...").
5. **Verify**:
   - The separate books should disappear.
   - A single book should remain (based on the first selected book).
   - Open the book and check the "Files" tab. It should contain all the audio files.
   - Play the book to ensure tracks are ordered and playable.
