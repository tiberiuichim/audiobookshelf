# Metadata Management Tools

## Overview
Audiobookshelf provides tools to manage and recover metadata when automatic matching fails or when users have manually edited metadata and wish to revert to the data contained within the source files.

## Reset Metadata
The **Reset Metadata** action allows a user to discard all manual edits and server-side metadata files, forcing the scanner to re-evaluate the item from its original source.

### Mechanism
When a "Reset" is triggered:
1.  **Server Metadata Removal**: The `metadata.json` file stored in the application's internal metadata directory (`/metadata/items/<id>/metadata.json`) is deleted.
2.  **Local Metadata Removal**: If the system is configured to `storeMetadataWithItem`, the `metadata.json` file inside the book's folder is also deleted.
3.  **Database Reset**: The `media.coverPath` is set to `null` in the database.
4.  **Re-Scan**: A full scan is triggered using `LibraryItemScanner.scanLibraryItem(id)`. This scan prioritizes:
    *   Embedded Audio Tags (ID3, MP4, etc.)
    *   OPF or NFO files in the folder.
    *   Filename and folder structure patterns.

### Usage
- **Single Item**: Found in the **Edit Modal** under the **Details** tab, next to the "ReScan" button.
- **Color**: Represented by a red button (Warning) to indicate a destructive action.

## Batch Reset Metadata
The batch version allows performing the reset operation on multiple selected items simultaneously.

### Usage
1.  Select multiple items in the library listing.
2.  Open the context menu (three dots) in the selection bar at the top of the interface.
3.  Select **Reset Metadata**.
4.  A confirmation dialog will appear, confirming the number of items to be reset.

## When to Use
- **Incorrect Matches**: If a book was matched to the wrong title and manual corrections are too cumbersome.
- **File Updates**: If the underlying audio files have been replaced with different versions (e.g., higher bitrate) and the user wants to ensure the database reflects the new file tags.
- **Corrupted Metadata**: If the `metadata.json` has become inconsistent with the actual files on disk.

## Technical Details
- **Permissions**: Requires the `canUpdate` permission.
- **Events**: Triggering a reset will eventually emit an `item_updated` socket event once the subsequent scan completes.
