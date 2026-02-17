# Consolidate Single File Books Specification

## Overview
The "Consolidate" feature is being expanded to support books that are currently single files (e.g., `.m4b`, `.mp3`) located directly in the root of a library folder. When consolidated, these files will be moved into a newly created folder named according to the `Author - Title` convention.

## Implementation Details

### Server-Side Changes

#### 1. `handleMoveLibraryItem` Helper
Modified the internal helper to handle the case where a single file is being moved to a new "folder" name.
- **Logic**: If `libraryItem.isFile` is true AND a `newItemFolderName` is provided:
    1. Create the target directory: `Path.join(targetFolder.path, newItemFolderName)`.
    2. Move the file into this new directory.
    3. Update the `libraryItem.isFile` status to `false`.
    4. Update the `libraryItem.path` to the new directory path.

#### 2. `LibraryItemController.consolidate`
- Removed the restriction that blocked consolidation for items where `isFile` is true.
- Consolidation is now permitted for any library item of type `book`.

#### 3. `LibraryItemController.batchConsolidate`
- Updated the batch processing loop to allow processing of items where `isFile` is true.

#### 4. `LibraryItem` Model
Added a `beforeSave` hook to the `LibraryItem` model to ensure that:
- **Metadata Sync**: Denormalized fields (`title`, `titleIgnorePrefix`, `authorNamesFirstLast`, `authorNamesLastFirst`) are automatically synchronized from the linked `media` object (Book or Podcast) before saving.
- **Status Recalculation**: The `isNotConsolidated` flag is recalculated whenever the item is saved, using the latest metadata and path. This ensures that features like "Match" or manual metadata updates immediately reflect the correct consolidation status in the library listings.

### Client-Side Changes

#### 1. `LazyBookCard.vue`
- Updated the context menu logic to show the "Consolidate" option for single-file books.
- Removed the `!this.isFile` check in the `moreMenuItems` computed property.

#### 2. `item/_id/index.vue` (Book View Page)
- Updated the primary action button for consolidation to be visible even for single-file books.
- Removed the `!isFile` check in the template.

## Verification
- **Scenario 1 (Single File Consolidation)**: Navigate to a book that is a single M4b file in the library root. Click "Consolidate". The file should be moved into a folder named `Author - Title`, and the UI should update showing the book is now consolidated. The database entry should reflect `isFile: false`.
- **Scenario 2 (Metadata Update Recalculation)**: Navigate to a folder-based book that is currently marked as "Consolidated". Manually rename the title in the "Edit" modal. Upon saving, the "Not Consolidated" indicator should appear because the folder name no longer matches the `Author - Title` convention based on the new metadata.
