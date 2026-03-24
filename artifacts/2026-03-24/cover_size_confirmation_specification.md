# Cover Size Confirmation Dialog for Book Matching

## Overview

When matching a book and accepting a match, the system currently overwrites the existing cover without checking if the new cover has sufficient resolution. Users want to be informed when a matched cover would be smaller than their current cover, and given a choice to accept or reject the cover update.

## Problem Statement

Users may have high-quality covers (e.g., from Audible at1200px+) that could be overwritten by lower-resolution covers from metadata providers. This is especially problematic when:
- The existing cover is BIG (≥1200px) and the match cover is MED/SML
- The user has manually curated high-quality covers
- Automatic matching would degrade cover quality

## Solution

Before applying a match with a cover, compare the incoming cover dimensions with the existing cover dimensions. If the new cover is smaller, display a confirmation dialog with side-by-side previews allowing the user to:
1. **Replace Anyway** - Proceed with the smaller cover
2. **Keep Existing Cover** - Apply all other metadata but keep existing cover
3. **Cancel** - Abort the match operation entirely

## Implementation Details

### Cover Size Tier Logic

Using the existing tier system from the cover badge feature:

| Tier | Condition | Badge |
| :--- | :--- | :--- |
| **BIG** | Width or Height ≥ 1200px | Green `bg-success` |
| **MED** | Width or Height ≥ 450px | Blue `bg-info` |
| **SML** | Width or Height < 450px | Yellow `bg-warning` |

A cover is considered "smaller" if:
- Current is BIG and match is MED or SML
- Current is MED and match is SML

### Frontend Changes

#### 1. `Match.vue` - Modified `applyMatch` and `submitMatchUpdate` Methods

**File:** `client/components/modals/item/tabs/Match.vue`

Added methods:
- `checkCoverSizeBeforeApply(matchCoverUrl)` - Checks if cover dimensions should be compared and shows modal if needed
- `loadRemoteImageDimensions(url)` - Loads remote image to get dimensions
- `getCoverTier(width, height)` - Returns BIG/MED/SML for given dimensions
- `compareCoverTiers(tier1, tier2)` - Compares two tier values

#### 2. New Modal Component: `ConfirmCoverSizeModal.vue`

**File:** `client/components/modals/ConfirmCoverSizeModal.vue`

A dedicated modal for cover size comparison with:
- Side-by-side cover preview (current vs. matched)
- Size tier badges (BIG/MED/SML)
- Dimension labels
- Three action buttons: Cancel, Keep Existing, Replace Anyway

#### 3. Registered Modal in `default.vue`

**File:** `client/layouts/default.vue`

Added `<modals-confirm-cover-size-modal />` to the modal section.

#### 4. Added State to `globals.js` Store

**File:** `client/store/globals.js`

```javascript
showConfirmCoverSizeModal: false,
confirmCoverSizeOptions: null,
```

Mutations:
- `setShowConfirmCoverSizeModal(state, val)`
- `setConfirmCoverSizeModal(state, options)`

#### 5. Localization Strings

**File:** `client/strings/en-us.json`

```json
{
  "MessageCoverSizeConfirmation": "Cover Size Confirmation",
  "MessageCoverSmallerThanCurrent": "The matched cover is smaller than your current cover. Would you like to keep your existing cover?",
  "LabelMatched": "Matched",
  "ButtonKeepExisting": "Keep Existing",
  "ButtonReplaceAnyway": "Replace Anyway"
}
```

### Flow

1. **Direct Match (applyMatch)**: When user clicks on a match from search results:
   - Parse match data
   - Check if cover exists andbook has existing cover with dimensions
   - Load remote image dimensions
   - Compare tiers
   - If remote cover is smaller, show confirmation modal

2. **Review & Edit (submitMatchUpdate)**: When user submits from Review & Edit mode:
   - Check if cover isselected in match payload
   - Same dimension comparison logic as above

### Edge Cases

1. **No existing cover**: Skip dimension check, apply match cover directly
2. **No stored dimensions for existing cover**: Skip dimension check
3. **CORS failure on remote image**: Proceed anyway, don't block matching
4. **Network timeout loading remote image (5s)**: Proceed anyway
5. **User unchecks "Cover" in match selection**: Skip dimension check (user already opted out)
6. **Match result has no cover URL**: Skip dimension check

### Files Modified

| Category | File | Change |
| :--- | :--- | :--- |
| **Frontend** | `client/components/modals/item/tabs/Match.vue` | Add dimension check logic |
| **Frontend** | `client/components/modals/ConfirmCoverSizeModal.vue` | New modal component |
| **Frontend** | `client/layouts/default.vue` | Register modal |
| **Frontend** | `client/store/globals.js` | Add modal state |
| **Frontend** | `client/strings/en-us.json` | Add localization strings |

### Verification Plan

1. **Test with existing BIG cover**: Match with SML cover → Dialog should appear with side-by-side preview
2. **Test with existing MED cover**: Match with BIG cover → No dialog, proceed
3. **Test with no existing cover**: Match → No dialog, proceed
4. **Test CORS failure**: Block image URL → Should proceed anyway after timeout
5. **Test "Review & Edit" mode**: Submit with smaller cover → Dialog should appear
6. **Test "Keep Existing" choice**: Cover should not change, other metadata applied
7. **Test "Replace Anyway" choice**: Cover should be replaced
8. **Test podcast matching**: Should work same as books

### Future Enhancements

- **User Preference**: Add a setting to disable the cover size check for users who always want the matched cover
- **Image pre-fetch performance**: Pre-fetch dimensions when search results are displayed to avoid loading delay during match confirmation
- **Batch quick match covers**: Extend this feature to respect cover size preferences during batch operations