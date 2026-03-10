# UI Visual Indicators System

## Overview
Audiobookshelf uses a system of badges and icons to provide immediate visual feedback on the state and quality of library items. This documentation covers the resolution tiers and consolidation indicators.

1.  **Cover Size Badges**: Classified into BIG (>=1200px), MED (>=450px), and SML (<450px) tiers based on resolution.
2.  **Consolidation Indicators**: A yellow folder icon and "Not Consolidated" badge for items with disorganized folder structures.
3.  **Collection Badges**: Green, bolded badges at the top center of covers indicating associated collections.

---

## 1. Cover Badges (Centered)
Informational metadata is displayed as centered overlays at the bottom of covers for improved balance and readability.

### Size Tiers
The system classifies covers into three tiers:

| Tier | Range | Label | Color | Code |
| :--- | :--- | :--- | :--- | :--- |
| **BIG** | >= 1200px | BIG | Green | `bg-success` |
| **MED** | >= 450px | MED | Blue | `bg-info` |
| **SML** | < 450px | SML | Yellow | `bg-warning` |

### Stacking Logic
- **Single Badge**: Centered at the very bottom.
- **Dual Badges**: If both Duration and Size are present, the Size badge sits neatly above the Duration label.

---

## 2. Collection Badges
To provide immediate context on library organization, collection names are rendered directly on the cover.

- **Placement**: Top-center of the cover image.
- **Style**: Bold white text on a green (`bg-success`) background for high visibility.
- **Truncation**: Long names are automatically truncated at 90% of the cover width.

---

## 3. Consolidation Indicators
The **Consolidation** status indicates whether a book's folder structure matches the standard convention (`Author - Title`).

### The "Not Consolidated" Badge
- **Visibility**: Appears on book cards for items needing folder renaming or restructuring.
- **Functionality**: Provides a direct shortcut button to trigger the consolidation process.

---

## 4. UI Placement and Scaling
- **Responsiveness**: All badges use relative font sizes (`em`/`rem`) that scale with the component's `sizeMultiplier`.
- **Layering**: Badges use appropriate `z-index` (typically `z-20`) to stay above the cover image and progress bars while remaining below interactive menus.
