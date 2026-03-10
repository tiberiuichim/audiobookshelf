# Bookshelf Item Cover Collections

Displays the list of collections that an item belongs to directly on the item's cover, available in both grid/listing views and the detailed item view.

## Features
- **Top Center Badges**: Renders a list of collection names at the top center of the cover image.
- **Dynamic Sizing**: Uses `em` (for `LazyBookCard`) and `rem` scaled by `sizeMultiplier` (for `BookCover`) to ensure the badges scale properly with the cover size.
- **Truncation**: Badges have a `max-w-[90%]` and `truncate` classes to prevent long collection names from overflowing the cover.
- **Opacity & Contrast**: Styled with `bg-black/80` and `text-white font-medium` to ensure readability over any cover image.

## Implementation Details

- **Store Integration**: Checks `this.store.state.libraries.collections` to filter collections where `c.books.includes(this.libraryItemId)`. This reacts to state changes efficiently.
- **LazyBookCard (`client/components/cards/LazyBookCard.vue`)**: Adds `itemCollections` computed property and corresponding HTML to absolutely position the list of collections over the book covers on library shelves.
- **BookCover (`client/components/covers/BookCover.vue`)**: Replicating for the details view so the collections are visible consistently across the application.
