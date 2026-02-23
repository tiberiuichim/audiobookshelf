# Batch Reset Metadata Implementation Status

## Completed
- [x] Specification created (`artifacts/2026-02-15/batch_reset.md`)
- [x] Backend logic implemented in `server/controllers/LibraryItemController.js` (`batchResetMetadata`)
- [x] API route registered in `server/routers/ApiRouter.js` (`POST /api/items/batch/reset-metadata`)
- [x] Frontend UI updated in `client/components/app/Appbar.vue` (Menu item + Handler)

## Verification
- Syntax checked for backend files.
- Manual verification required by user:
    1. Select multiple books/library items.
    2. Click the context menu (three dots) in the selection bar.
    3. Click "Reset Metadata".
    4. Confirm the dialog.
    5. Verify items are re-scanned and metadata reset.

## Note
- Localization string for confirmation message is currently hardcoded in English.
