# Reset Metadata Feature Specification

## Overview
This document outlines the implementation of the "Reset Metadata" feature, designed to allow users to reset a library item's metadata to its original state derived from the file system (tags, folder structure, OPF files), effectively ignoring or removing any manual edits stored in the database or `metadata.json` files.

## Date
2026-02-14

## Rationale
Users may encounter situations where a library item is matched to the wrong book, or the underlying files have changed (e.g., replaced with a different audiobook version). The existing "ReScan" functionality often preserves existing metadata (especially if `metadata.json` exists) to prevent data loss, which makes it difficult to force a full refresh from the files. A dedicated "Reset" action is needed.

## Detailed Implementation

### 1. Backend Implementation

#### Server Controller: `LibraryItemController.js`
- **Method:** `resetMetadata(req, res)`
- **Logic:**
    1.  **Permission Check:** Verifies if the user has update permissions (`req.user.canUpdate`). Returns 403 if not.
    2.  **Server Metadata Removal:** Identifies and deletes the `metadata.json` file from the server's metadata directory (`/metadata/items/<id>/metadata.json`) if it exists.
    3.  **Local Metadata Removal:** Identifies and deletes the `metadata.json` file from the item's local folder path (if `storeMetadataWithItem` is enabled and the file exists).
    4.  **Database Update (Cover):** Sets `media.coverPath` to `null` in the database. This forces a re-evaluation of the cover image (checking embedded art or `cover.jpg` in folder) during the subsequent scan.
    5.  **Re-Scan:** Triggers `LibraryItemScanner.scanLibraryItem(id)` to re-process the item from scratch using the remaining sources (Audio Tags, OPF, NFO, Folder Structure).
    6.  **Response:** Returns the updated library item in JSON format.

#### API Router: `ApiRouter.js`
- **Route:** `POST /api/items/:id/reset-metadata`
- **Middleware:** Applies authentication, item access checks, and update permission verification (`LibraryItemController.middleware`).
- **Handler:** Maps to the `LibraryItemController.resetMetadata` method.

### 2. Frontend Implementation

#### Vue Component: `Details.vue`
- **Location:** `client/components/modals/item/tabs/Details.vue`
- **UI Element:** Added a "Reset" button to the "Details" tab in the edit modal, located next to the existing "ReScan" button.
- **Styling:** Used `bg-error` (red) for the button to indicate a destructive action.
- **Interactivity:**
    1.  **Click Handler:** `resetMetadata()` triggers a confirmation dialog (`globals/setConfirmPrompt`) explaining the action: "Are you sure you want to reset metadata? This will remove the metadata file and re-scan the item from files."
    2.  **Action Handler:** `runResetMetadata()` calls the `POST /api/items/:id/reset-metadata` endpoint.
    3.  **Feedback:** On success, a toast notification "Metadata reset successfully" is displayed. On failure, an error toast is shown.
    4.  **State Management:** Uses a `resetting` flag to show a loading state on the button while the request is processing.

## Verification Scenarios
1.  **Manual Edit Reversion:** Open an audiobook where the title was manually changed. Click "Reset". Verify that the title reverts to the value found in the audio file tags or folder name.
2.  **Metadata File Deletion:** Open an audiobook that has a `metadata.json` file present. Click "Reset". Verify that the `metadata.json` file is deleted from the filesystem and the metadata is refreshed.
3.  **Cover Reset:** Ensure that triggering a reset also clears the cover path, causing the scanner to look for a cover again.
