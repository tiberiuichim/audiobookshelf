# Specification: Reset Filters on Library Switch

## Problem
Currently, when a user switches from one library to another in the UI, the previously applied filters (e.g., search query, genre, series, etc.) remain active. This can lead to confusing results, especially if the filters from the previous library don't return any results in the new library.

## Goal
Automatically reset all library filters to their default state whenever the active library is changed.

## Proposed Changes
1.  **Detect Library Switch**: Identify the mechanism used to switch libraries (e.g., route change or Vuex store update).
2.  **Reset Filters**: Trigger a reset of the filter state when a library switch is detected.
    -   Fields to reset: search, genre, series, series filter, tags, progress, etc.
3.  **UI Updates**: Ensure the filter UI (dropdowns, search bar) reflects the reset state.

## Implementation Details

### 1. Store Updates (`client/store/user.js`)
- Update `checkUpdateLibrarySortFilter` action to accept a `libraryChanging` flag.
- If `libraryChanging` is true, reset `filterBy` to `'all'` and `seriesFilterBy` to `'all'`.
- This ensures that when the store's current library is updated, the filter state is also cleared, preventing components (like `LazyBookshelf.vue`) from re-applying old filters to the URL.

### 2. Library Switcher Update (`client/components/ui/LibrariesDropdown.vue`)
- Update the `updateLibrary` method to pass `libraryChanging: true` when calling `libraries/fetch`.
- Modify the navigation logic:
    - If on the search page, redirect to the bookshelf of the new library (clearing the search).
    - If on a series item page, redirect to the series list of the new library (already doing this).
    - Otherwise, ensure it navigates to the equivalent page in the new library but without query parameters.

### 3. Global Search Reset (`client/components/controls/GlobalSearch.vue`)
- Add a watcher or listener to reset the local search state when the `currentLibraryId` changes.
- This ensures the search input in the header is cleared when the library changes.
