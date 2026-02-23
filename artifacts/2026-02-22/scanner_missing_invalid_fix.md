# Artifact Specification: Scanner Missing and Invalid Flag Reset Fix

## 1. Overview
This specification details the fixes implemented to resolve two major bugs regarding how the application's library scanner processes files and updates item statuses:
1. **Stuck "Issues" Status:** Books and podcasts migrated from v1 databases could have a legacy `isInvalid: true` flag. Normal scans and rescans successfully cleared `isMissing` when files were found, but `isInvalid` was never cleared. This forced items to permanently show up as having "issues" unless the user performed a heavy "Consolidate" action. 
2. **Scanner Path Duplication (Symlink Bug):** When libraries were sourced from symlinked directories, `fileUtils.recurseFiles` would inadvertently duplicate paths because the underlying `fs.realpath` resolution of the symlink caused a string mismatch when stripping the root relative path.

## 2. API & Data Contracts
- **Data Contracts**: No changes to the database schemas. The existing `isMissing` and `isInvalid` schema flags are preserved.
- **Scanner Output**: `LibraryItemScanData`, `BookScanner`, and `PodcastScanner` will actively push `isInvalid: false` to the DB when files are detected. 

## 3. Traceability (Files Modified)

| Category | File | Change Description |
| :--- | :--- | :--- |
| **Backend** | `server/scanner/LibraryItemScanData.js` | Updated `checkLibraryItemData` to assert `isMissing: false` and `isInvalid: false` if either was `true` |
| **Backend** | `server/scanner/BookScanner.js` | Updated `rescanExistingBookLibraryItem` to assert `isMissing: false` and `isInvalid: false` if either was `true` |
| **Backend** | `server/scanner/PodcastScanner.js` | Updated `rescanExistingPodcastLibraryItem` to assert `isMissing: false` and `isInvalid: false` if either was `true` |
| **Backend** | `server/utils/fileUtils.js` | Refactored `recurseFiles` to use `fs.realpath()` for `relPathToReplace` before string manipulation to ensure correct substring replacement inside symlinks |

## 4. Architectural Decisions
### Scanner Flags
- **Decision:** Explicitly check `|| existingLibraryItem.isInvalid` before attempting to unset the flags.
- **Reasoning:** Rather than wiping `isInvalid` indiscriminately, we check if the flag is actively `true` and the filesystem says the files exist and load correctly. If so, the item is restored to a fully healthy state. This aligns behavior seamlessly with the `isMissing` logic.

### Symlink Substring Removal
- **Decision:** Use `fs.realpath(relPathToReplace)` before stripping prefixes. 
- **Reasoning:** The `recursiveReaddirAsync` utility was configured with `realPath: true`. It inherently resolves all symlinks for deep-scanned objects. When `fileUtils` tried to truncate the root path `relPathToReplace` using string replacement, it failed on symlinked paths because `item.fullname` was resolved but `relPathToReplace` was not. Ensuring `relPathToReplace` also runs through `fs.realpath` fixes the root mismatch.

## 5. Verification Plan
1. **Invalid Items Recovery:**
   - Restart server.
   - Re-scan an item that was historically tagged "invalid" via single-file root folders.
   - Verify the UI "issues" count actively clears.
2. **Symlink Scans:**
   - Trigger a scan on a directory mapped via symlinks (e.g., `/home/user/...` -> `/mnt/docker/...`).
   - Validate that item metadata and paths register with the scanner correctly without dumping duplicate paths (`/home/user/mnt/docker/user...`) in logs or the DB.

## 6. Limitations & Future Work
- Legacy v1 `isInvalid` items are still expected to exist in long-lived databases until they are actively rescanned or a full-library scan captures them under the new rules. No background database migration was run to mass-clear them, to ensure the file scanner correctly assesses integrity.
