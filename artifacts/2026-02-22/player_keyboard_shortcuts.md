# Player Keyboard Shortcuts Specification

## Overview
This feature introduces new keyboard shortcuts to the audio player, enabling improved playback control for power users. This expands on the existing standard keyboard interactions to include dedicated major jumps (60 seconds) and chapter navigation mapping.

## New Keyboard Shortcuts

The following hotkey definitions have been added or updated in the `AudioPlayer` context:

| Context | Action | Shortcut | Description |
| :--- | :--- | :--- | :--- |
| AudioPlayer | `JUMP_FORWARD_ALT` | `Shift + Right Arrow` | Alternative shortcut for the user's standard jump forward amount. |
| AudioPlayer | `JUMP_BACKWARD_ALT` | `Shift + Left Arrow` | Alternative shortcut for the user's standard jump backward amount. |
| AudioPlayer | `JUMP_FORWARD_MAJOR` | `Ctrl + Shift + Right Arrow` | Hardcoded 60-second jump forward. |
| AudioPlayer | `JUMP_BACKWARD_MAJOR`| `Ctrl + Shift + Left Arrow` | Hardcoded 60-second jump backward. |
| AudioPlayer | `NEXT_CHAPTER` | `Shift + Up Arrow` | Skips directly to the start of the next chapter. |
| AudioPlayer | `PREV_CHAPTER` | `Shift + Down Arrow` | Skips back to the previous chapter mark (or restarts the chapter). |
| AudioPlayer | `INCREASE_PLAYBACK_RATE` | `]` (BracketRight) | Previously `Shift + Up Arrow`. Now moved to accommodate chapter navigation. |
| AudioPlayer | `DECREASE_PLAYBACK_RATE` | `[` (BracketLeft) | Previously `Shift + Down Arrow`. Now moved to accommodate chapter navigation. |

## Implementation Details

### Modifier Parsing
- Upgraded the hotkey parsing logic within `getHotkeyName(e)` in `client/layouts/default.vue` and `client/pages/share/_slug.vue` to actively capture `ctrlKey` and `altKey` modifier combinations, aligning with the pattern used elsewhere in the UI.

### Player Core
- `jumpForwardMajor` and `jumpBackwardMajor` logic was integrated directly into `client/components/player/PlayerUi.vue` using its `seek` primitive capability, computing relative to the local `currentTime` and `duration`.
- Mapped the chapter navigation constants (`NEXT_CHAPTER` and `PREV_CHAPTER`) directly to existing handler functions (`goToNext()` and `prevChapter()`), keeping modifications self-contained.

## Files Modified
| File Location | Category | Reason for Change |
| :--- | :--- | :--- |
| `AGENTS.md` | **Documentation** | Document how AI agents can lookup previous artifact specifications in `artifacts/index.md`. |
| `artifacts/docs/ux_power_user_shortcuts.md` | **Documentation** | Added Audio Player Shortcuts section. |
| `client/plugins/constants.js` | **Frontend** | Add `BracketLeft` and `BracketRight` to KeyNames registry; redefine `Hotkeys.AudioPlayer` with the new combinations. |
| `client/components/player/PlayerUi.vue` | **Frontend** | Implement the jump magnitude logic and intercept the actual shortcut emissions. |
| `client/layouts/default.vue` | **Frontend** | Add robust modifier flag interpretation in the main view wrapper. |
| `client/pages/share/_slug.vue` | **Frontend** | Replicate the exact same modifier key evaluation logic for the standalone unauthenticated player widget. |

## Edge Cases Addressed
- **Duration Boundary checks**: Hardcoded jumps (60 sec) use bounds checking to prevent seeking below position 0, or past the overall duration of the target media.
- **Playback Rate Shortcut conflict**: Addressed by cleanly replacing the default array to brackets `[` and `]` making intuitive sense for increasing and decreasing numeric magnitudes.
