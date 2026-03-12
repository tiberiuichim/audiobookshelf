# Recompute Stats Button and Stale Audio Fix

## Detailed Overview
This feature adds a single **"Recompute Stats"** button to the library statistics page (`/library/:id/stats`). When clicked, it:
1. Triggers a **force re-scan** (`?force=1`) of the library, re-probing all audio files
2. Shows a loading spinner on the button while the scan runs
3. Listens on the socket for the `task_finished` event from this library's scan
4. Automatically re-fetches and displays updated statistics when the scan completes

### Backend Bug Fix: Stale Audio Files
A critical bug was fixed in `BookScanner.rescanExistingBookLibraryItem`. When audio files were removed from a book's folder:
- A prior scan (or the watcher) would correctly update the library item's `libraryFiles` to match disk
- But the book's `audioFiles` array (and therefore `duration`) could remain stale, because the removal filter (`checkAudioFileRemoved`) only catches files removed during **that same scan's** `checkLibraryItemData` pass
- On subsequent scans, `libraryFilesRemoved` was empty (library files already synced), so `checkAudioFileRemoved` removed nothing, leaving ghost audio entries

**Fix**: Added a reconciliation step after the existing removal filter. It removes any audio file from the book's `audioFiles` that doesn't have a corresponding file on disk (matched by inode or path against `audioLibraryFiles`).

## Traceability (Files Modified)
| Component | File | Description |
| --------- | ---- | ----------- |
| Backend | `server/scanner/BookScanner.js` | Added reconciliation filter and force-rescan support |
| Backend | `server/controllers/LibraryItemController.js` | Added metadata recalculation for Split/Promote actions |
| Backend | `server/scanner/LibraryScanner.js` | Passed forceRescan flag to LibraryScan object |
| Backend | `server/scanner/LibraryScan.js` | Added force property to track scan type |
| Backend | `server/utils/generators/abmetadataGenerator.js` | Improved chapter title validation fallbacks |
| Frontend | `client/components/app/BookShelfToolbar.vue` | Added "Recompute Stats" button |
| Frontend | `client/pages/library/_library/stats.vue` | Implemented recompute flow and auto-refresh |
| Frontend | `client/strings/en-us.json` | Added ButtonRecomputeStats string |
| Artifacts | `artifacts/index.md` | Updated index |

## Verification Plan
1. Remove audio files from a book folder on disk
2. Open the library stats page
3. Click "Recompute Stats" and observe the loading spinner
4. When the scan completes, stats auto-refresh with correct duration and size
5. Navigate to the individual book and verify its duration reflects the remaining audio files


