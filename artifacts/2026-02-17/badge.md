# Cover Size Badge Specification

## Overview
Indicates the size tier of a book cover image directly on the cover in various views. This helps users quickly identify high-quality (Audible-grade) covers vs. lower resolution ones.

## Size Tiers
The badge uses the following logic based on the image's natural dimensions (Width or Height):

| Tier | Condition | Text | Color |
| :--- | :--- | :--- | :--- |
| **BIG** | Width or Height >= 1200px | BIG | Green (`bg-success`) |
| **MED** | Width or Height >= 450px | MED | Blue (`bg-info`) |
| **SML** | Width or Height < 450px | SML | Yellow (`bg-warning`) |

## Implementation Details
The detection is performed server-side and stored in the database to ensure accuracy regardless of thumbnail sizes.

### Dimension Detection
- `coverWidth` and `coverHeight` columns added to `books` and `podcasts` tables.
- A `beforeSave` hook on `Book` and `Podcast` models detects dimensions using `ffprobe` when `coverPath` changes.
- A database migration (`v2.32.7-add-cover-dimensions.js`) populates existing items.

### Components Impacted
1. **`BookCover.vue`**: Used in detail views and some table rows (e.g., Collections).
2. **`LazyBookCard.vue`**: Used in main library bookshelf views, home page shelves, and search results.

### Logic
- USE `media.coverWidth` and `media.coverHeight` (from the server) as the primary source.
- FALLBACK to `naturalWidth` and `naturalHeight` from the image's `@load` event if server data is unavailable.
- COMPUTE the badge tier based on the rules above.
- RENDER a small, absolute-positioned badge in the bottom-right corner of the cover.

### UI Styling
- **Position**: Bottom-right of the cover image.
- **Font Size**: Scales with the `sizeMultiplier` (default `0.6rem`).
- **Pointer Events**: `none` (to avoid interfering with clicks).
- **Z-Index**: `20` (to stay above the cover and some overlays).
