# Match Dialog Default Provider

This specification artifact details the changes made to the "Match" and "Edit" dialogs within the audiobookshelf application to ensure the default metadata provider corresponds to the library's default setting, rather than a globally persisted user selection.

## Background

Previously, when matching a book in the "Match" tab of the Edit modal, changing the metadata provider (e.g., from "Audible" to "Google Books") would save that choice to `localStorage` under the key `book-provider`. Subsequent visits to the Match tab for any other book would initialize the provider dropdown with this last-used value.

This behavior led to a suboptimal user experience, specifically for users who manage multiple libraries with different default metadata providers or specifically want their library's default provider to take precedence by default.

## Implementation Details

### Removal of `localStorage` Persistence

The `Match.vue` component has been updated to remove the persistence of `book-provider` to `localStorage`.

- The `persistProvider()` method has been removed.
- The `submitSearch()` method no longer triggers persistence.

### Initialization from Library Settings

The initial provider selection logic in `getDefaultBookProvider()` inside `Match.vue` (and similarly `Cover.vue`) has been refactored:

- It now queries the Vuex store (`this.$store.getters['libraries/getLibraryProvider']`) utilizing the `libraryId` of the current item.
- If the current library has a customized provider, it correctly defaults to that provider.
- It falls back to `"google"` safely if no library setting is found or the retrieved provider is invalid.

This ensures that closing and reopening the Match dialog for another item accurately respects the library's established metadata source configuration.
