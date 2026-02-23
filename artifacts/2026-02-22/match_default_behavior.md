# Match Default Behavior Update

## Problem Description
Previously, selecting a match in the Edit Modal's Match tab would open a detailed review screen allowing the user to cherry-pick which specific metadata fields to update. When users know a match is correct, they usually want to apply everything quickly, which took extra clicks.

## Implementation Details

### Updated Components
1. **`BookMatchCard.vue`**:
   - The card itself now acts as an immediate trigger to apply the match.
   - The `select` event emitted when clicking the card itself represents this "Direct Apply" action.
   - Added a new `Review & Edit` button that appears when hovering over the card. This button emits a new `review` event to preserve the old cherry-picking functionality.

2. **`Match.vue` (Edit Modal Tab)**:
   - Contains new mapping logic `applyMatch` triggered by the `@select` event on the card.
   - Extracts parsing logic into `parseMatchData` for shared mapping of properties like series, tags, and narrators safely.
   - `applyMatch` forcefully sets all `selectedMatchUsage` checkbox fields to `true` and triggers `submitMatchUpdate`.
   - `submitMatchUpdate` now takes an optional boolean flag `closeOnSuccess` which resolves to closing the modal (emitting `@close` to the parent `EditModal.vue`) entirely instead of redirecting the user back to the 'details' tab.

## Future Considerations
- Allow configuring the default apply behavior in the settings, giving users the choice to swap the direct click action to "Review & Edit" if they prefer being cautious.
