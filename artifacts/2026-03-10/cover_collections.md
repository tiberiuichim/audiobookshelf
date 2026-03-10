# Bookshelf Item Cover Collections

Displays the list of collections that an item belongs to directly on the item's cover, available in both grid/listing views and the detailed item view.

## Features
- **Top Center Badges**: Renders a list of collection names at the top center of the cover image.
- **Dynamic Sizing**: Uses `em` (for `LazyBookCard`) and `rem` scaled by `sizeMultiplier` (for `BookCover`) to ensure the badges scale properly with the cover size.
- **Truncation**: Badges have a `max-w-[90%]` and `truncate` classes to prevent long collection names from overflowing the cover.
- **Visual Distinction**: Styled with `bg-success` and `font-bold` to ensure collections are easily distinguishable from other cover badges (which use `bg-black/70` or `font-medium`).

## Implementation Details

### Backend
- **[MODIFY] [Book.js](file:///mnt/docker/work/books/audiobookshelf/server/models/Book.js)**: Updated `oldMetadataToJSONMinified` and `oldMetadataToJSONExpanded` to include the `collections` array (id, name).
- **[MODIFY] [libraryItemsBookFilters.js](file:///mnt/docker/work/books/audiobookshelf/server/utils/queries/libraryItemsBookFilters.js)**: Updated `getFilteredLibraryItems`, `getContinueSeriesLibraryItems`, and `getDiscoverLibraryItems` to include `Database.collectionModel` in the Sequelize query.
- **[MODIFY] [libraryFilters.js](file:///mnt/docker/work/books/audiobookshelf/server/utils/queries/libraryFilters.js)**: Updated `getSeriesMostRecentlyAdded` to populate collections for the "Recent Series" shelf.

### Frontend Store
- **[MODIFY] [libraries.js](file:///mnt/docker/work/books/audiobookshelf/client/store/libraries.js)**: Implemented `fetchCollections` to load all collections for the current library. Optimized lookups by mapping `bookIds` to each collection in the store.

### UI Components
- **[MODIFY] [LazyBookCard.vue](file:///mnt/docker/work/books/audiobookshelf/client/components/cards/LazyBookCard.vue)**: Added `itemCollections` computed property and rendered the collection list at the top center of the cover. Also added an inline list of collections to the "Detailed" view (description area).
- **[MODIFY] [BookCover.vue](file:///mnt/docker/work/books/audiobookshelf/client/components/covers/BookCover.vue)**: Implemented the same top-center collection rendering for the item details page cover.
- **[MODIFY] [BookTableRow.vue](file:///mnt/docker/work/books/audiobookshelf/client/components/tables/collection/BookTableRow.vue)**: Updated the "Other Collections" column to use the optimized `bookIds` mapping from the store.
- **[MODIFY] [LibraryItemDetails.vue](file:///mnt/docker/work/books/audiobookshelf/client/components/content/LibraryItemDetails.vue)**: Added a new "Collections" section under the metadata, listing all associated collections with links.
