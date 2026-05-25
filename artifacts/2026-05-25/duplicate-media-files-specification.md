# Duplicate Media Files Feature Proposals & Specification

**Date:** 2026-05-25

## Overview

This specification details proposals and architecture designs to address the issue of duplicate media files within an audiobook server. It covers identifying duplicate files (e.g., matching size, duration, track number, or copy patterns) within a single library item (Intra-Book) and across the entire server (Inter-Book), providing comprehensive cleanup tools.

---

## Proposed Architectural Options

We propose three distinct options to address duplicate files, which can be implemented individually or combined for a premium UX.

### Option 1: Intra-Book Duplicate Media Cleaner (Files Tab Enhancement)
Exposes duplicate detection directly within the individual audiobook's **Files** tab.

#### API Endpoint Designs

##### 1. Analyze Book Files for Duplicates
```
GET /api/items/:id/duplicate-groups
```
**Response:**
```json
{
  "duplicateGroups": [
    {
      "type": "exact-duplicate", // exact-duplicate, format-duplicate, name-match
      "recommendedKeepIno": "ino-of-m4b-file",
      "files": [
        {
          "ino": "ino-1",
          "filename": "Book.m4b",
          "size": 154320980,
          "duration": 7200,
          "format": "m4b",
          "bitrate": 128000
        },
        {
          "ino": "ino-2",
          "filename": "Book.mp3",
          "size": 154320980,
          "duration": 7200,
          "format": "mp3",
          "bitrate": 128000
        }
      ]
    }
  ]
}
```

##### 2. Bulk Clean Duplicates
```
POST /api/items/:id/clean-duplicates
```
**Request Body:**
```json
{
  "fileInosToDelete": ["ino-2"]
}
```
**Response:** `200 OK` with updated `LibraryItem` JSON.

---

### Option 2: Library-Wide Duplicate Finder (Settings > Tools)
Exposes a global maintenance tool for administrators to clean up duplicates across the entire server.

#### API Endpoint Designs

##### 1. Trigger or Retrieve Library-Wide Duplicate Report
```
GET /api/tools/duplicate-finder
```
**Response:**
```json
{
  "intraItemDuplicates": [
    {
      "libraryItemId": "item-uuid",
      "bookTitle": "My Book",
      "groupsCount": 1,
      "potentialSavings": 154320980
    }
  ],
  "interItemDuplicates": [
    {
      "size": 154320980,
      "duration": 7200,
      "items": [
        { "libraryItemId": "item-uuid-1", "path": "/audiobooks/Book A/audio.mp3" },
        { "libraryItemId": "item-uuid-2", "path": "/audiobooks/Book B/audio.mp3" }
      ]
    }
  ]
}
```

---

### Option 3: Proactive Badging & Filtering
Automatically flags items containing duplicate files during scans.

- Adds a `hasDuplicateFiles` boolean field to `LibraryItem` (or resolves dynamically).
- Adds a **"Has Duplicate Files"** option to frontend Library Filter dropdowns.
- Renders a cover card badge similar to the "Not Consolidated" badge.

---

## Implementation Details & Completed Changes

We have fully implemented a comprehensive Duplicate Media Files management system including automatic detection, library filtering, settings tools, single-book quick actions, and visual bookshelf badging.

### Files Modified

| File | Component | Description |
| :--- | :--- | :--- |
| `server/migrations/v2.35.1-add-has-duplicate-media-column.js` | DB Migration | [NEW] Adds `hasDuplicateMedia` boolean column to the `libraryItems` table. |
| `package.json` & `client/package.json` | Project Config | Bumps version to `2.35.1` matching the DB schema migration. |
| `server/models/LibraryItem.js` | Backend Model | Implements server-side `checkHasDuplicateMedia()` with advanced heuristics, wires hooks, and serializes the new status. |
| `server/scanner/BookScanner.js` & `server/scanner/PodcastScanner.js` | Scanner Logic | Computes duplicate status on item scan and saves it to the database. |
| `server/routers/ApiRouter.js` & `server/controllers/LibraryController.js` | Backend API | Adds library-wide status updater endpoint `POST /api/libraries/:id/update-duplicate-media`. |
| `server/utils/queries/libraryItemsBookFilters.js` & `libraryItemsPodcastFilters.js` | Backend Query | Implements SQL where queries for filtering duplicates via pre-indexed column. |
| `client/components/controls/LibraryFilterSelect.vue` & `client/strings/en-us.json` | Frontend Filter | Adds i18n keys and registers the "Has Duplicate Media" toggle select dropdown option. |
| `client/components/modals/libraries/LibraryTools.vue` | Settings Tool | Adds "Update Duplicate Media Status" button card to Library Settings and resolves scrollable overflow issue. |
| `client/components/modals/item/CleanDuplicatesModal.vue` | Frontend Modal | [NEW] Beautifully groups duplicates by type (Exact Size, Format Consolidation, Similar Durations) with dynamic space savings and stay/delete indicators. |
| `client/components/tables/LibraryFilesTable.vue` | Frontend Table | Exposes warning-themed quick-cleanup headers in individual files lists. |
| `client/store/globals.js` & `client/layouts/default.vue` | Global State | Manages the Clean Duplicates Modal toggle status and layout registration. |
| `client/components/cards/LazyBookCard.vue` | Bookshelf Card | Renders a vibrant, red `delete_sweep` badge dynamically stacked mathematically above standard badges, allowing instant one-click deduplication. |

---

## Verification Plan

### Automated Verification
- Ran full Nuxt client production compile via `npm run generate` inside `client/` - compiled perfectly with 0 warnings or errors.

### Manual Verification
1. Add duplicate audio tracks (e.g. copying a disc or splitting files) inside a book folder.
2. Scan the library or run the "Update Duplicate Media Status" tool in settings.
3. Observe the dynamic, crimson warning badge stacked perfectly on the bottom-left of the card.
4. Click the badge and verify that the sleek "Clean Duplicates" sweep modal opens instantly.
5. Choose stay/delete options, click clean, and verify the duplicate media files are cleanly deleted from the filesystem and database.

---

## Changelog & Known Edge Cases Fixed

### 2026-05-25 (Session 2): Format-consolidated scenario handling

**Problem:** The duplicate detection and the modal display were wrong for books that have many per-chapter M4B files AND a single whole-book MP3 file. The old logic would show: keep 1 M4B, delete all MP3s — ignoring 66 chapter M4Bs entirely.

**Root cause:** `keep: [filteredM4bFiles[0]]` was hardcoded to keep only the first M4B, regardless of how many M4Bs are present.

**Fix (client `CleanDuplicatesModal.vue`):**
- The `format-consolidated` group logic now detects **which side is the chapter split vs. the whole-book**:
  - If `m4bFiles.length > splitFiles.length` → m4bs are per-chapter, put ALL m4b files in `keep`, and the fewer split files in `delete`
  - Otherwise → 1 m4b is the consolidated whole book; keep it, delete the many split files
- Group label now clearly describes the relationship (e.g., "M4B chapter files vs whole-book MP3 file(s)")
- **Collapsible keep lists**: When a "keep" group has > 3 files (e.g. 67 chapters), it shows a collapsed summary row with total size and format. A "Show all N files" toggle expands the full list. This prevents UI flooding for books with many chapter files.
- `expandedKeepGroups` reactive map tracks which groups are expanded per-session.

| File | Change |
| :--- | :--- |
| `client/components/modals/item/CleanDuplicatesModal.vue` | Fixed format-consolidated keep/delete logic; added collapsible keep list; added `expandedKeepGroups` data + `toggleExpandKeep()` method |

