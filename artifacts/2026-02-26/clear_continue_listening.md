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
- **Backend API**: The `MeController` handles the request. It retrieves all `libraryItem.id`s belonging to the library and filters the user's `mediaProgresses`. For all matching active progress items, the `MediaProgress` database records are deleted, and the user's cached progress array is updated. Removing the progress naturally resets the user's position to `0` and clears it from "Continue Listening".

## Related Files
- `client/components/app/Appbar.vue`
- `server/routers/ApiRouter.js`
- `server/controllers/MeController.js`
- `client/strings/en-us.json`
