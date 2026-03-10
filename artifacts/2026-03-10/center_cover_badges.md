# Feature Specification: Center-Aligned Cover Badges

## Overview

This specification covers the UX improvement of centering cover-related informational badges (Cover Size and Duration) at the bottom of book and series covers across the application.

## 1. Motivation

Previously, cover-related badges were aligned to the bottom-right corner. Centering them provides a more balanced aesthetic, particularly for standard book aspect ratios, and improves readability by keeping important metadata in a consistent focal point.

## 2. Implementation Details

### Cover Size & Duration Badges

The layout was updated in three primary components to ensure consistency across the bookshelf, item details, and series views.

#### [MODIFY] [BookCover.vue](file:///mnt/docker/work/books/audiobookshelf/client/components/covers/BookCover.vue)
- Used in the **Library Item Details** page.
- Changed alignment classes from `right-1` to `left-1/2 -translate-x-1/2`.
- Added `whiteSpace: 'nowrap'` to prevent text wrapping on narrow covers.

#### [MODIFY] [LazyBookCard.vue](file:///mnt/docker/work/books/audiobookshelf/client/components/cards/LazyBookCard.vue)
- Used in the **Library Bookshelf** (Grid View).
- Updated the `:style` binding for `coverBadge` and `durationPretty` divs.
- Replaced `right: 0.375em` with `left: 50%` and `transform: translateX(-50%)`.
- Included `whiteSpace: 'nowrap'` for consistent rendering.

#### [MODIFY] [LazySeriesCard.vue](file:///mnt/docker/work/books/audiobookshelf/client/components/cards/LazySeriesCard.vue)
- Used for **Series** entries in the bookshelf.
- Centered the `totalDurationPretty` badge using `left-1/2 -translate-x-1/2` Tailwind utility classes.

## 3. Visual Stacking

The logic for vertical stacking remains preserved:
- If **only** a duration or size badge is present, it sits at `bottom-1` (or `0.375em`).
- If **both** are present, the Cover Size badge is automatically bumped up (to `bottom-5` or `1.4em`) to sit neatly above the centered duration.

## 4. Verification

- [x] Verified centering on standard book covers in library grid view.
- [x] Verified centering on the single item details page cover overlay.
- [x] Verified centering on series group covers.
- [x] Confirmed that narrow covers do not cause badge text to wrap onto multiple lines.
