# UI Enhancements

## 1. Home View Header Shortcuts

Add navigation buttons next to specific shelf headlines on the Home view that link to the full library pages with appropriate sorting.

### Shelves and Targets

| Shelf ID | Headline | Target Page | Sort Criteria |
| :--- | :--- | :--- | :--- |
| `recently-added` | Recently Added | `/library/:id/bookshelf` | `addedAt` Descending |
| `recent-series` | Recent Series | `/library/:id/bookshelf/series` | `addedAt` Descending |
| `newest-authors` | Newest Authors | `/library/:id/bookshelf/authors` | `addedAt` Descending |

### Implementation Details

- **Component**: `client/components/app/BookShelfRow.vue`
- **Trigger**: New button next to the `h2` title in the `categoryPlacard`.
- **Action**:
  1. Update Vuex store settings for the specific sort (e.g., `orderBy` for library, `seriesSortBy` for series, `authorSortBy` for authors).
  2. Navigate to the target page.
