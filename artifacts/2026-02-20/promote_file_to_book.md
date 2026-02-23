# Promote File to Book Specification

## Overview
This feature allows users to "promote" files from an existing book into a standalone book in the library. This is useful when a single library item incorrectly groups multiple separate books or files together. The feature has two mechanisms: a quick single-file context action, and a bulk "Split Book" Wizard.

## UI Requirements

### 1. Single-File Promotion (Quick Action)
- Added to the "Library Files" table (`LibraryFilesTableRow.vue`).
- A new context menu item "Promote to book" is available for active files.
- Selecting it opens a confirmation prompt.

### 2. Multi-File Book Split (Wizard)
- A "Split Book" button added to the header of the "Library Files" table (`LibraryFilesTable.vue`).
- Opens `SplitBookModal.vue`, passing the current library item files.
- Displays a table of audio/ebook files with an input binding for "Book Number" (Default 1).
- Includes an "Assign 1 to N" quick action for automatically splitting every single file into its own standalone book.
- Submits an array of file assignments containing the target Book Number.

## Backend Requirements

### 1. Single-File Promotion
- **Endpoint**: `POST /api/items/:id/file/:fileid/promote`
- **Logic**:
  1. Determine a new folder name based on the target filename.
  2. Create the target destination folder.
  3. Move the specified file.
  4. Detach record from the current database entry.
  5. Trigger `LibraryScanner.scan(library)` to generate the standalone library item.

### 2. Multi-file Book Split
- **Endpoint**: `POST /api/items/:id/split`
- **Request Body**: `{ assignments: [{ ino: string, bookNumber: number }] }`
- **Logic**:
  1. Group payload assignments by `bookNumber` (ignoring `1` since that designates the current book).
  2. Iterate through groups. For each group `[Book 2, Book 3, etc]`:
     a. Compute target folder path based on original directory + `- Book [N]`.
     b. Ensure custom directory is created.
     c. Iterate through `ino` targets and migrate target resources.
  3. Detach file payload records from existing library item.
  4. Emit completion via `SocketAuthority.libraryItemEmitter`.
  5. Call `LibraryScanner.scan(library)` to construct the new entities sequentially.
