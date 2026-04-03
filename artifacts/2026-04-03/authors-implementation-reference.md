# Authors Implementation Reference

**Date**: 2026-04-03  
**Purpose**: Document the current Authors implementation to serve as a reference for similar features (genres and tags)

## Overview

Authors in Audiobookshelf are first-class entities with their own database model, dedicated UI, and management features. They are associated with books through a many-to-many relationship and have their own detail pages, edit modals, and list views.

---

## 1. Database Models

### Author Model (`server/models/Author.js`)

**File**: `/mnt/docker/work/books/audiobookshelf/server/models/Author.js`

**Schema**:
```javascript
{
  id: UUID (Primary Key),
  name: STRING,
  lastFirst: STRING,  // Name in "Last, First" format for sorting
  asin: STRING,       // Amazon Standard Identification Number
  description: TEXT,
  imagePath: STRING,
  libraryId: UUID (Foreign Key to Library),
  createdAt: DATE,
  updatedAt: DATE
}
```

**Key Methods**:
- `getLastFirst(name)` - Converts name to "Last, First" format
- `checkExistsById(authorId)` - Check if author exists
- `getByNameAndLibrary(authorName, libraryId)` - Find author by name (case-insensitive)
- `getAllLibraryItemsForAuthor(authorId)` - Get all books by author
- `findOrCreateByNameAndLibrary(name, libraryId)` - Create author if doesn't exist
- `toOldJSON()` - Legacy JSON format for backward compatibility
- `toOldJSONExpanded(numBooks)` - Expanded JSON with book count
- `toJSONMinimal()` - Minimal JSON with just id and name

**Indexes**:
- name (COLLATE NOCASE)
- libraryId

**Relationships**:
- `belongsTo(Library)`
- `belongsToMany(Book, { through: BookAuthor })`

### BookAuthor Junction Model (`server/models/BookAuthor.js`)

**File**: `/mnt/docker/work/books/audiobookshelf/server/models/BookAuthor.js`

**Purpose**: Many-to-many relationship between Books and Authors

**Schema**:
```javascript
{
  id: UUID (Primary Key),
  bookId: UUID,
  authorId: UUID,
  createdAt: DATE
}
```

**Key Methods**:
- `removeByIds(authorId, bookId)` - Remove association
- `getCountForAuthor(authorId)` - Count books for an author

**Relationships**:
- Belongs to Book
- Belongs to Author
- Super Many-to-Many pattern for efficient queries

---

## 2. Backend API Routes

### API Routes (`server/routers/ApiRouter.js`)

**Base Path**: `/api/authors/:id`

| Method | Endpoint | Handler | Description |
|--------|----------|---------|-------------|
| GET | `/api/authors/:id` | AuthorController.findOne | Get author details (optional: `?include=items,series`) |
| PATCH | `/api/authors/:id` | AuthorController.update | Update author metadata |
| DELETE | `/api/authors/:id` | AuthorController.delete | Delete author |
| POST | `/api/authors/:id/match` | AuthorController.match | Quick match author metadata |
| GET | `/api/authors/:id/image` | AuthorController.getImage | Get author image |
| POST | `/api/authors/:id/image` | AuthorController.uploadImage | Upload author image from URL |
| DELETE | `/api/authors/:id/image` | AuthorController.deleteImage | Delete author image |
| GET | `/api/libraries/:id/authors` | LibraryController.getAuthors | Get all authors in library |
| DELETE | `/api/libraries/:id/authors/cleanup` | LibraryController.cleanupAuthorsWithNoBooks | Remove authors without books |

### AuthorController (`server/controllers/AuthorController.js`)

**Key Endpoints**:

#### findOne (GET /api/authors/:id)
- Supports `include` query parameter: `items` and `series`
- Returns author with numBooks count
- If `include=items`, returns library items by the author
- If `include=series`, groups items by series

#### update (PATCH /api/authors/:id)
- Updates: name, description, asin
- Merges authors if name changed to existing author name
- Updates metadata files on disk
- Emits socket events for real-time updates

#### delete (DELETE /api/authors/:id)
- Removes author from all books
- Deletes author image
- Updates filter data
- Emits socket events

#### match (POST /api/authors/:id/match)
- Quick match with online providers (Audible)
- Updates ASIN, description, and image
- Supports region-specific searches

### LibraryController.getAuthors 

**File**: `server/controllers/LibraryController.js` (lines 1021-1130)

**Query Parameters**:
- `limit` - Results per page
- `page` - Page number
- `sort` - Sort by: name, lastFirst, addedAt, updatedAt, numBooks
- `desc` - Sort descending (1 or 0)
- `filter` - Filter by first letter (e.g., `letter.A`, `letter.#` for non-Latin)
- `minified` - Return minified JSON

**Features**:
- Pagination support
- Letter-based filtering
- Permission-based filtering (non-admin users only see authors with books)
- Post-query sorting for numBooks

---

## 3. Frontend Components

### Author Detail Page (`client/pages/author/_id.vue`)

**Route**: `/author/:id`

**Features**:
- Fetches author data with `include=items,series`
- Displays author image, name, description
- Shows books by author (horizontal slider)
- Shows series by author (grouped)
- Edit button to open edit modal
- Socket listeners for real-time updates (`author_updated`, `author_removed`)

**Data Flow**:
```javascript
async asyncData({ store, app, params }) {
  const author = await app.$axios.$get(`/api/authors/${params.id}?include=items,series`)
  return { author }
}
```

### Author Card Component (`client/components/cards/AuthorCard.vue`)

**Purpose**: Displays author in bookshelf view

**Features**:
- Author image with fallback placeholder
- Name and numBooks overlay
- Hover effects (edit, quick match buttons)
- Unmatched badge (if no ASIN/description/image)
- Quick match functionality
- Responsive sizing

**Props**:
- `authorMount` - Author data object
- `width` - Card width
- `height` - Card height
- `nameBelow` - Show name below image

### Author Image Component (`client/components/covers/AuthorImage.vue`)

**Purpose**: Render author image with placeholder

**Features**:
- Placeholder SVG when no image
- WebP/JPEG support
- Responsive sizing
- Rounded corners
- Cover contain mode for aspect ratio handling

**Image URL**:
```javascript
`${routerBasePath}/api/authors/${authorId}/image?ts=${updatedAt}`
```

### Author Edit Modal (`client/components/modals/authors/EditModal.vue`)

**Features**:
- Edit name, ASIN, description
- Upload image from URL
- Remove image
- Quick match button
- Delete author button
- Form validation
- Toast notifications

**State Management**:
```javascript
show: {
  get() {
    return this.$store.state.globals.showEditAuthorModal
  },
  set(val) {
    this.$store.commit('globals/setShowEditAuthorModal', val)
  }
},
author() {
  return this.$store.state.globals.selectedAuthor
}
```

---

## 4. State Management

### Vuex Store - globals (`client/store/globals.js`)

**State**:
```javascript
showEditAuthorModal: false,
selectedAuthor: null
```

**Mutations**:
```javascript
showEditAuthorModal(state, author) {
  state.selectedAuthor = author
  state.showEditAuthorModal = true
},
setShowEditAuthorModal(state, val) {
  state.showEditAuthorModal = val
}
```

### Vuex Store - libraries (`client/store/libraries.js`)

**Filter Data Update** (lines 260-270):
```javascript
// Add/update book authors
if (mediaMetadata.authors?.length) {
  mediaMetadata.authors.forEach((author) => {
    const indexOf = state.filterData.authors.findIndex((au) => au.id === author.id)
    if (indexOf >= 0) {
      state.filterData.authors.splice(indexOf, 1, author)
    } else {
      state.filterData.authors.push(author)
      state.filterData.authors.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }
  })
}
```

**Filter Data Structure**:
```javascript
filterData: {
  authors: [{ id, name }],
  series: [{ id, name }],
  genres: [...],
  tags: [...],
  narrators: [...]
}
```

---

## 5. Navigation & Bookshelf Integration

### Authors Bookshelf Page (`client/pages/library/_library/bookshelf/_id.vue`)

**Route**: `/library/:libraryId/bookshelf/authors`

**Features**:
- Redirects podcast libraries to main library page
- Handles query params for filtering and sorting
- Settings persistence (authorFilterBy, authorSortBy, authorSortDesc)

### LazyBookshelf Component (`client/components/app/LazyBookshelf.vue`)

**Author-Specific Logic**:

**Empty Message** (line 113):
```javascript
if (this.page === 'authors') return this.$strings.MessageNoAuthors
```

**Fetch Logic** (lines 514-519):
```javascript
} else if (this.page === 'authors') {
  searchParams.set('sort', this.authorSortBy)
  searchParams.set('desc', this.authorSortDesc ? 1 : 0)
  if (this.authorFilterBy && this.authorFilterBy !== 'all') {
    searchParams.set('filter', this.authorFilterBy)
  }
}
```

**Entity Name Detection** (line 22):
```javascript
if (this.entityName === 'authors') return Vue.extend(AuthorCard)
```

**Socket Event Handlers**:
- `authorAdded` - Reset entities
- `authorUpdated` - Update entity in place
- `authorRemoved` - Remove entity from list

### BookShelfToolbar (`client/components/app/BookShelfToolbar.vue`)

**Author View Detection** (line 293):
```javascript
return this.page === 'authors'
```

**Features**:
- Letter-based filtering (A-Z, #)
- Sorting by name, lastFirst, addedAt, updatedAt, numBooks
- Cleanup button for admins

---

## 6. Book Model Integration

### Book Model (`server/models/Book.js`)

**Author Management** (lines 464-506):
```javascript
async updateAuthorsFromRequest(authors, libraryId) {
  // Find authors to remove
  const authorsRemoved = this.authors.filter(au => !authorsCleaned.includes(au.name.toLowerCase()))
  
  // Find new authors to add
  const newAuthorNames = authors.filter(a => !this.authors.some(au => au.name.toLowerCase() === a.toLowerCase()))
  
  // Remove old associations
  for (const author of authorsRemoved) {
    await bookAuthorModel.removeByIds(author.id, this.id)
  }
  
  // Add new associations
  for (const authorName of newAuthorNames) {
    const author = await authorModel.findOrCreateByNameAndLibrary(authorName, libraryId)
    await bookAuthorModel.create({ bookId: this.id, authorId: author.id })
  }
}
```

**Computed Properties**:
```javascript
get authorName() {
  return this.authors.map(au => au.name).join(', ')
}

get authorNameLF() {
  return this.authors.map(au => parseNameString.nameToLastFirst(au.name)).join(', ')
}
```

### LibraryItem Model (`server/models/LibraryItem.js`)

**Author Sorting Fields** (lines 751-790):
```javascript
authorNamesFirstLast: DataTypes.STRING,
authorNamesLastFirst: DataTypes.STRING

// Indexes for sorting
{
  fields: ['libraryId', 'mediaType', { name: 'authorNamesFirstLast', collate: 'NOCASE' }]
},
{
  fields: ['libraryId', 'mediaType', { name: 'authorNamesLastFirst', collate: 'NOCASE' }]
}
```

**Author Query Support** (lines 568-574):
```javascript
static async getForAuthor(author, user = null) {
  const { libraryItems } = await libraryFilters.getLibraryItemsForAuthor(author, user, undefined, undefined)
  return libraryItems
}
```

---

## 7. Real-Time Updates

### Socket Events

**Author Events**:
- `author_updated` - Emitted when author data changes
- `author_removed` - Emitted when author is deleted

**Usage Example**:
```javascript
// AuthorDetail page
mounted() {
  this.$root.socket.on('author_updated', this.authorUpdated)
  this.$root.socket.on('author_removed', this.authorRemoved)
},
beforeDestroy() {
  this.$root.socket.off('author_updated', this.authorUpdated)
  this.$root.socket.off('author_removed', this.authorRemoved)
}
```

---

## 8. Key Implementation Patterns

### 1. Author Creation
Authors are created automatically when a book's metadata includes an author that doesn't exist:
```javascript
const author = await authorModel.findOrCreateByNameAndLibrary(authorName, libraryId)
```

### 2. Author Merge
When updating an author name to match an existing author, the system automatically merges them:
- Transfers all book associations
- Deletes the old author
- Updates metadata files
- Emits appropriate socket events

### 3. Lazy Loading
Authors are paginated in the bookshelf view:
- `limit` and `page` parameters control pagination
- Card components are mounted dynamically as user scrolls
- Efficient memory management with component destruction

### 4. Filter Data Management
Authors are maintained in the library's filter data:
- Updated when library items are added/updated
- Sorted alphabetically
- Used for filter dropdowns
- Persisted per-library

### 5. Image Caching
Author images are cached:
- Cache key includes `updatedAt` timestamp
- WebP support with fallback to JPEG
- Responsive image sizing
- Cover background blur for extreme aspect ratios

---

## 9. File Paths Summary

### Backend
- Model: `server/models/Author.js`
- Junction Model: `server/models/BookAuthor.js`
- Controller: `server/controllers/AuthorController.js`
- Routes: `server/routers/ApiRouter.js` (lines 231-237)
- Library Controller: `server/controllers/LibraryController.js` (getAuthors: 1021-1130, cleanupAuthors: 1518-1558)

### Frontend
- Detail Page: `client/pages/author/_id.vue`
- Bookshelf Page: `client/pages/library/_library/bookshelf/_id.vue`
- Card Component: `client/components/cards/AuthorCard.vue`
- Image Component: `client/components/covers/AuthorImage.vue`
- Edit Modal: `client/components/modals/authors/EditModal.vue`
- Bookshelf Container: `client/components/app/LazyBookshelf.vue`
- Toolbar: `client/components/app/BookShelfToolbar.vue`
- Mixin: `client/mixins/bookshelfCardsHelpers.js`

### State Management
- globals.js: `client/store/globals.js` (lines 18-24, 196-201)
- libraries.js: `client/store/libraries.js` (filter data: 260-270)

---

## 10. Translation Strings

Key translation strings used for authors:
- `LabelAuthors` - "Authors"
- `LabelBooks` - "Books"
- `LabelSeries` - "Series"
- `LabelDescription` - "Description"
- `LabelName` - "Name"
- `LabelImageURLFromTheWeb` - "Image URL from the web"
- `HeaderUpdateAuthor` - "Update Author"
- `ButtonQuickMatch` - "Quick Match"
- `ButtonRemove` - "Remove"
- `ButtonSave` - "Save"
- `MessageNoAuthors` - "No authors found"
- `MessageConfirmRemoveAuthor` - "Confirm remove author {0}"
- `ToastAuthorUpdateSuccess` - "Author updated successfully"
- `ToastAuthorRemoveSuccess` - "Author removed successfully"
- `ToastAuthorNotFound` - "Author {0} not found"

---

## 11. Differences for Genres & Tags Implementation

For genres and tags, the key differences from authors would be:

### Similarities
- Letter-based filtering
- Pagination and lazy loading
- Sort by name, numBooks
- Edit modals
- Real-time updates via sockets

### Differences
1. **Database Model**: Authors have their own table with relationships; genres/tags may be stored differently
2. **Relationships**: Authors use a many-to-many junction table; genres/tags might be stored as JSON arrays
3. **Metadata Sources**: Authors have external metadata providers (Audible); genres/tags may not
4. **Images**: Authors have author images; genres/tags typically don't
5. **Detail Pages**: Authors have dedicated detail pages with books; genres/tags might use filter views instead

### Recommendations for Genres/Tags
- Consider whether to create separate tables or use JSON arrays in Book model
- Implement similar filtering and sorting UI
- Add to filter data similar to authors
- Consider reusing LazyBookshelf architecture
- Use similar socket event patterns for updates
- May not need full detail pages - could use filtered bookshelf views

---

## 12. Testing & Verification

To verify authors are working correctly:

1. **View Authors**:
   - Navigate to `/library/:id/bookshelf/authors`
   - Verify authors display with images and book counts
   - Test letter filtering (A-Z, #)
   - Test sorting by name, numBooks, etc.

2. **Author Details**:
   - Click author card to view detail page
   - Verify books and series display correctly
   - Test edit functionality
   - Test quick match feature

3. **Edit Modal**:
   - Update author name (test merge functionality)
   - Update description and ASIN
   - Upload/remove images
   - Delete author

4. **Integration**:
   - Create new books with authors
   - Verify authors appear in filter data
   - Test author search
   - Verify socket updates work in real-time

---

## Conclusion

The Authors implementation provides a robust foundation with:
- Proper database relationships
- Efficient pagination and lazy loading
- Real-time updates
- External metadata integration
- Comprehensive UI components
- State management integration

Use this as a reference template for implementing similar features for genres and tags.
