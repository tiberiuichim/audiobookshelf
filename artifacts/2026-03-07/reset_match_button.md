# Feature Specification: Reset Book Match

## Overview

The `Match` tab inside the "Edit book" modal allows users to search for and apply match data from metadata providers. Occasionally, books are incorrectly "Quick Matched" matching an incorrect title/author that is different from the raw audio file tags. This specification introduces a "Reset Match" button inside the `Match` tab.

## User Interface Changes

### Match.vue (client/components/modals/item/tabs/Match.vue)

- A new `Reset` button (red/error colored) with a `restore` icon is placed next to the `Search` button inside the Match tab form.
- The button is wrapped in a `<ui-tooltip>` with text `Reset metadata to file tags` to clarify its functionality.

## Interactions & Behavior

1. **Button Click (`resetMatch`)**:
   - Clicking the button opens a `globals/setConfirmPrompt` with a warning message: _"Are you sure you want to reset metadata? This will remove the metadata file and re-scan the item from files."_
   - This prevents accidental, destructive resets.

2. **Backend Process (`runResetMatch`)**:
   - The confirmation triggers a `POST` request to `/api/items/:id/reset-metadata`.
   - The tool sets `this.resetting = true` to display a loading state on the button during this async operation.
   - The backend deletes any metadata JSON files attached to the item and re-scans the raw tags of the inner files.

3. **Frontend Resolution**:
   - On success, a toast is shown: "Metadata reset successfully".
   - Using the data object returned by the API (which maps the `toOldJSONExpanded` format), the `searchTitle` and `searchAuthor` models are immediately populated with the new tags values returned from the internal files.
   - For example:
     ```javascript
     this.searchTitle = data.media.metadata.title || ''
     this.searchAuthor = data.media.metadata.authorName || ''
     ```
   - This replaces the (likely erroneous) previous search query with the true file-based title, allowing the user to correctly search using the Search button right away.
   - A failure triggers an error toast.
