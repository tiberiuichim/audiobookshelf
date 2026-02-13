# Consolidate Book Feature Specification

## Overview

The "Consolidate" feature allows users to organize their book library by renaming a book's folder to a standard `Author - Book Name` format and moving it to the root of the library folder. This helps in flattening nested structures and maintaining a consistent naming convention.

## User Interface

### Frontend

- Context menu on Book Card (Library View).
- Context menu on Book View page.
- A new option "Consolidate" will be added to the book card's context menu (the "meatball" menu).
- **Visibility**:
  - Only available for Books (not Podcasts).
  - Only available if the user has "Update" permissions.
  - Only available if the item is a folder (not a single file).
- **Interaction**:
  - Clicking "Consolidate" triggers a confirmation dialog explaining the action.
  - Upon confirmation, the operation is performed.
  - A toast notification indicates success or failure.

## Backend Logic

- **Endpoint**: `POST /api/items/:id/consolidate`
- **Controller**: `LibraryItemController.consolidate`
- **Logic**:
  1.  **Retrieve Item**: Fetch the library item by ID. Verify it is a book and the user has permissions.
  2.  **Determine New Name**: Construct the folder name using the pattern `${Author} - ${Title}`.
      - `Author`: Primary author name.
      - `Title`: Book title.
      - **Sanitization**: Ensure the name is safe for the file system (remove illegal characters).
  3.  **Determine New Path**:
      - `Target Library Folder`: The root path of the library the item belongs to.
      - `New Path`: `Path.join(LibraryRoot, NewFolderName)`.
  4.  **Validation**:
      - Check if `New Path` already exists.
      - If it exists and is the same as the current path, return success (no-op).
      - If it exists and is different, return an error (or handle collision - for now, error).
  5.  **Execution**:
      - Move the directory from `Old Path` to `New Path`.
      - Update the `path` and `relPath` in the `libraryItems` table.
      - Update paths of all associated files (audio files, ebook files, cover, etc.) in the database.
      - Update `libraryFolderId` to the root folder ID (if applicable/tracked).
  6.  **Cleanup**:
      - If the old folder was inside another folder (e.g., `Author/Series/Book`), check if the parent folders are now empty and delete them if so (similar to how Move or Delete handles it). _Note: The existing `move` logic might handle this or we can reuse `handleMoveLibraryItem` if we can trick it or modify it._
      - Actually, `handleMoveLibraryItem` takes a `targetFolder`. If we pass the library root as `targetFolder` and rename the directory before/during move?
      - `handleMoveLibraryItem` assumes `itemFolderName` is `Path.basename(libraryItem.path)`. It does NOT rename the folder name itself.
      - So we need a custom logic or a modified helper that supports renaming.
- **Response**: JSON object indicating success and the updated item.

## Artifacts

- This specification is saved as `artifacts/2026-02-13/consolidate.md`.
