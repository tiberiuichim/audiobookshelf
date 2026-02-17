# Cover Size Badge Specification

## Overview
A new badge is displayed on book covers to indicate the resolution of the cover image. This helps users identifying high-quality covers (e.g., Audible's 2400x2400 format).

## Logic
The badge is determined client-side once the image has loaded, using the `naturalWidth` and `naturalHeight` properties of the `HTMLImageElement`.

### Size Tiers
| Tier | Criteria | Label | Color |
| :--- | :--- | :--- | :--- |
| **Big** | Width or Height >= 2400px | BIG | Success (Green) |
| **Medium** | Width or Height >= 1200px | MED | Info (Blue) |
| **Small** | Width or Height < 1200px | SML | Warning (Yellow) |

## Implementation Details
- **Component**: `BookCover.vue` (and other cover components as needed).
- **Detection**: `imageLoaded` event captures dimensions.
- **UI**: Absolute positioned badge in the bottom-right corner.
- **Responsiveness**: Font size and padding scale with the `sizeMultiplier` of the cover component.
