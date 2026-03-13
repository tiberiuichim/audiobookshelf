# Audio File Integrity Validation Feature

## Overview

Add FFmpeg-based audio file validation to check if audio tracks are corrupted/broken. Users can validate individual tracks or all tracks at once. Validation results are cached to avoid repeated processing.

## API & Data Contracts

### New Backend Endpoint

**Route:** `GET /api/items/:id/validate/:fileid`

**Request:**
- `id` - Library item ID
- `fileid` - File inode (ino)

**Response:**
```json
{
  "valid": true,
  "message": "Audio file is valid"
}
```
OR
```json
{
  "valid": false,
  "error": "Error details from FFmpeg"
}
```

### Batch Validation Endpoint

**Route:** `POST /api/items/:id/validate`

**Request:**
```json
{
  "fileIds": ["ino1", "ino2", ...]
}
```

**Response:**
```json
{
  "results": [
    { "ino": "ino1", "valid": true },
    { "ino": "ino2", "valid": false, "error": "..." }
  ]
}
```

## Files Modified

| Layer | File | Changes |
|-------|------|---------|
| Backend | `server/controllers/LibraryItemController.js` | Add `validateAudioFile` and `validateAudioFiles` methods |
| Backend | `server/routers/ApiRouter.js` | Add new routes |
| Frontend | `client/components/tables/TracksTable.vue` | Add validation column, validate all button |
| Frontend | `client/components/tables/AudioTracksTableRow.vue` | Add validation status display |
| Frontend | `client/strings/en-us.json` | Add localization strings |
| Config | `package.json` | Version bump if needed |

## Implementation Details

### Backend Implementation

1. **FFmpeg validation command:**
   ```
   ffmpeg -v error -stats -i <file_path> -f null -
   ```

2. **Caching strategy:** Store validation results in memory (per server instance). Cache key is `libraryItemId + fileIno`. Cache TTL: 1 hour.

3. **In-memory cache structure:**
   ```javascript
   const validationCache = new Map(); // Key: `${itemId}:${ino}`, Value: { valid, error?, timestamp }
   ```

### Frontend Implementation

1. **Tracks Table Column:** Add new column showing validation status icon (checkmark for valid, warning for invalid)

2. **Validate All Button:** Admin-only button in table header to trigger batch validation

3. **Status Icons:**
   - Gray circle: Not validated
   - Green checkmark: Valid
   - Red warning: Invalid

### Localization Strings

```json
{
  "ButtonValidateAll": "Validate All",
  "ButtonValidateAudioFile": "Validate",
  "LabelValidationStatus": "Status",
  "ToastAudioFileValid": "Audio file is valid",
  "ToastAudioFileInvalid": "Audio file is invalid",
  "ToastAudioFilesValidated": "Validated {count} audio files"
}
```

## Limitations & Future Work

- Cache is per-server instance (not shared across multiple server instances)
- No persistent storage of validation results (would require database migration)
- Future: Add option to auto-validate on library scan
- Future: Add validation history tracking
