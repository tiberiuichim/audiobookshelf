# Clear Continue Listening (Reset Library Progress)

## Overview

A feature to reset all listening progress to 0 for all items in a specific library. This effectively clears the "Continue Listening" shelf for that library.

## Motivation

Users. especially those with large libraries, may want to start fresh or clear "clutter" from their "Continue Listening" shelves without individually modifying the progress of each book.

## UI/UX Design

- **Global Toolbar Addition**: A new action button is added to the application's global toolbar (`Appbar.vue`), positioned next to the "Update Library" button.
- **Iconography**: The standard Material Symbols icon `restart_alt` is used to imply "reset".
- **Confirmation Flow**: Due to the destructive nature of this action, a confirmation prompt is shown before the backend request is dispatched.

## Technical Implementation

- **Frontend**: A `resetLibraryProgress` action is triggered from the Appbar. A `DELETE` request is sent to a new `/api/me/library/:id/progress` endpoint.
- **Backend API**: The `MeController` handles the request. It:
  1. Validates the library's existence using `Library.checkExistsById`.
  2. Retrieves all `libraryItem.id`s and `mediaId`s belonging to the library.
  3. Filters the user's `mediaProgresses` to identify progress records matching the library's items.
  4. Deletes the matching `MediaProgress` database records and updates the user's cached progress array.
  5. Sends a `user_updated` socket event to notify the client and trigger an update of the user's progress state.
- **UI Refresh**: After the backend request succeeds, an event `refresh-library` is emitted on the global `$eventBus`. Components like `LazyBookshelf.vue` (for bookshelf view) and `BookShelfCategorized.vue` (for personalized home shelves) listen for this event and trigger a re-fetch of their data to immediately clear the "Continue Listening" section.

## Related Files

- `client/components/app/Appbar.vue`
- `client/components/app/LazyBookshelf.vue`
- `client/components/app/BookShelfCategorized.vue`
- `server/routers/ApiRouter.js`
- `server/controllers/MeController.js`
- `server/models/Library.js`
- `client/strings/en-us.json`
