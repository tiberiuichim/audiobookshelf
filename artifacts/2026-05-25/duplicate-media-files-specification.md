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

## Proposed Changes (Files to be modified if implemented)

| File | Component | Description |
| :--- | :--- | :--- |
| `server/controllers/ToolsController.js` | Backend | Add route handlers for global duplicate scanning and resolution. |
| `server/controllers/LibraryItemController.js` | Backend | Add item-level analysis and bulk duplicate deletion endpoints. |
| `server/routers/ApiRouter.js` | Backend | Register new routes for duplicate analysis. |
| `server/models/Book.js` | Backend | Add helper method `analyzeDuplicates()` to identify file groups. |
| `client/components/modals/item/FilesTab.vue` or equivalent | Frontend | Render duplicate warnings, group visualizer, and "Clean Duplicates" actions. |
| `client/strings/en-us.json` | Localization | Add translations for warnings, options, and actions. |

---

## Verification Plan

### Manual Verification
1. Place duplicate media files in a book's folder (e.g. create a duplicate file named `test-copy.mp3`).
2. Run duplicate check and ensure the group matches `test.mp3` and `test-copy.mp3`.
3. Resolve the duplicate by selecting `test-copy.mp3` for deletion.
4. Verify the file is physically removed from the directory and plays cleanly.
