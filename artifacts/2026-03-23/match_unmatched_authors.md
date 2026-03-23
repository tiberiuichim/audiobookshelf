# Match Unmatched Authors Feature Specification

## Overview

Add a "Match Unmatched" button to the Authors page toolbar that will match only authors that have no metadata (no description, no cover photo, and no ASIN). The existing "Match All Authors" button matches ALL authors; this new feature will filter to only match authors that are truly "unmatched".

## Current Behavior

The `BookShelfToolbar.vue` component already has a "Match All Authors" button (`$strings.ButtonMatchAllAuthors`) that:
1. Fetches ALL authors from the library
2. Iterates through each author
3. Calls `POST /api/authors/:id/match` for each author
4. Shows toast messages for successes/failures

## Proposed Changes

### Definition of "Unmatched Author"

An author is considered **unmatched** when they have **ALL** of the following:
- No `asin` (Audible ASIN identifier)
- No `description` (author biography)
- No `imagePath` (author photo)

This is determined client-side after fetching authors from the API.

### Files Modified

| File | Change Type | Description |
|------|-------------|-------------|
| `client/components/app/BookShelfToolbar.vue` | Modify | Add filtering logic to `matchAllAuthors()` |
| `client/strings/en-us.json` | Modify | Update button string |
| `artifacts/index.md` | Modify | Add reference to this specification |

### Implementation Details

#### 1. Update Button Text

Change the button from "Match All Authors" to "Match Unmatched Authors".

#### 2. Modify `matchAllAuthors()` Method

Update the method in `BookShelfToolbar.vue` to filter authors to only those without metadata.

### Verification Plan

1. Create a test library with multiple authors
2. Manually clear metadata from some authors (remove asin, description, imagePath)
3. Navigate to Authors page
4. Click "Match Unmatched Authors" button
5. Verify only authors without metadata are matched
6. Verify already-matched authors are skipped
7. Verify toast shows correct count of matched authors

### Edge Cases

- **All authors matched**: Show info toast "All authors already have metadata"
- **No authors in library**: API returns empty array, no action needed
- **Match failure for individual author**: Continue to next author, show error toast