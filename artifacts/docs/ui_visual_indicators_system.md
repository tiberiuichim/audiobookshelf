# UI Visual Indicators System

## Overview
Audiobookshelf uses a system of badges and icons to provide immediate visual feedback on the state and quality of library items. This documentation covers the resolution tiers and consolidation indicators.

## 1. Cover Size Badges
To help users identify high-quality artwork, every book cover can display a resolution badge.

### Size Tiers
The system classifies covers into three tiers based on the natural width or height (whichever is larger):

| Tier | Range | Label | Color | Code |
| :--- | :--- | :--- | :--- | :--- |
| **BIG** | >= 1200px | BIG | Green | `bg-success` |
| **MED** | >= 450px | MED | Blue | `bg-info` |
| **SML** | < 450px | SML | Yellow | `bg-warning` |

### Implementation
- **Server-Side Detection**: Dimensions are detected using `ffprobe` when a cover is uploaded or scanned and stored in the database (`coverWidth`, `coverHeight`).
- **Client-Side Fallback**: If server data is missing, the UI calculates the tier using the browser's `naturalWidth`/`naturalHeight` once the image loads.
- **Visuals**: The badge is a small, semi-transparent pill in the bottom-right corner of the cover.

---

## 2. Consolidation Indicators
The **Consolidation** status indicates whether a book's folder structure matches the standard Audiobookshelf convention (`Author - Title`).

### The "Not Consolidated" Badge
- **Visibility**: Appears on the book card in the bookshelf view for items that are not in the standard format.
- **Criteria**:
    - The folder name does not match the sanitized metadata (`Author - Title`).
    - The item is located in a subfolder deeper than the library root (e.g., `Author/Title/Book`).
    - The item is a single file in the root (requires a folder).
- **Functionality**:
    - Acts as a warning that the folder structure is disorganized.
    - Provides a **direct shortcut** button to trigger the consolidation process for that item.

### Tooltips and Detail view
- In the **Book Details** page, a yellow folder icon appears next to the title if the item is not consolidated.
- Hovering over the icon provides the "Not Consolidated" description.

---

## 3. UI Placement and Scaling
- **Responsiveness**: All badges use font sizes that scale with the `sizeMultiplier` of the component, ensuring they remain legible whether the cover is a tiny thumbnail or a large hero image.
- **Layering**: Badges are placed with specific `z-index` values to ensure they stay above the cover image but do not block interactive elements like the "Play" button or selection checkboxes.
