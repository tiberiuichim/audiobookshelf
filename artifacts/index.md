# Artifacts Index

This index provides a quick reference for specification and documentation files in the `artifacts/` folder.

| Date | File | Summary |
| :--- | :--- | :--- |
| **2026-02-05** | [local_migration.md](2026-02-05/local_migration.md) | Specification for migrating an Audiobookshelf database from Docker to a local environment, remapping absolute paths. |
| **2026-02-06** | [move-to-library-specification.md](2026-02-06/move-to-library-specification.md) | Documentation for the "Move to Library" feature, supporting single and batch moves between compatible libraries. |
| **2026-02-11** | [recursive_libraries.md](2026-02-11/recursive_libraries.md) | Specification for a Python utility (`reorganize_library.py`) to flatten deeply nested library structures. |
| **2026-02-12** | [book-merge.md](2026-02-12/book-merge.md) | Implementation plan and walkthrough for merging multiple library items (e.g., individual files) into a single book item. |
| **2026-02-13** | [consolidate.md](2026-02-13/consolidate.md) | Specification for the "Consolidate" feature, renaming book folders to `Author - Book Name` and moving them to the library root. |
| **2026-02-14** | [implementation_plan.md](2026-02-14/implementation_plan.md) | Implementation plan for the "Reset Metadata" feature, detailing backend and frontend changes. |
| **2026-02-14** | [m4b_conversion.md](2026-02-14/m4b_conversion.md) | Specification for improvements to the M4B merge tool, adding "Stream Copy" support to avoid re-encoding. |
| **2026-02-14** | [reset_metadata_specification.md](2026-02-14/reset_metadata_specification.md) | Detailed specification for the "Reset Metadata" feature, including metadata file deletion and re-scanning logic. |
| **2026-02-15** | [badge.md](2026-02-15/badge.md) | Specification for a client-side cover size badge indicating image resolution tiers. |
| **2026-02-15** | [batch_reset.md](2026-02-15/batch_reset.md) | Specification for the "Batch Reset Metadata" feature for multiple selected items. |
| **2026-02-15** | [batch_reset_implementation_status.md](2026-02-15/batch_reset_implementation_status.md) | Implementation status checklist for the "Batch Reset Metadata" feature. |
| **2026-02-15** | [consolidation_badge.md](2026-02-15/consolidation_badge.md) | Specification for the "Not Consolidated" badge and library-wide status update tool. |
| **2026-02-15** | [reset_filters_on_library_switch.md](2026-02-15/reset_filters_on_library_switch.md) | Specification for automatically resetting library filters when switching between libraries. |
| **2026-02-15** | [select_all.md](2026-02-15/select_all.md) | Specification for the `Ctrl+A` / `Cmd+A` keyboard shortcut to select all library items. |
| **2026-02-17** | [badge.md](2026-02-17/badge.md) | Revised specification for the cover size badge using server-side dimension detection and storage. |
| **2026-02-17** | [consolidate_singles.md](2026-02-17/consolidate_singles.md) | Expansion of the "Consolidate" feature to support single-file books by moving them into new folders. |
| **2026-02-17** | [ui_enhancements.md](2026-02-17/ui_enhancements.md) | Specification for "View All" shortcuts on Home view shelves with specific sorting. |
| **2026-02-20** | [promote_file_to_book.md](2026-02-20/promote_file_to_book.md) | Specification for "promoting" files from an existing book into a standalone library item, including a "Split Book" wizard. |
| **2026-02-20** | [move_to_library_keyboard_shortcuts.md](2026-02-20/move_to_library_keyboard_shortcuts.md) | Specification for keyboard-shortcut-enabled library buttons in the "Move to Library" dialog. |
| **2026-02-22** | [centralized_keyboard_shortcuts.md](2026-02-22/centralized_keyboard_shortcuts.md) | Specification for centralizing keyboard shortcut definitions into a single configuration file. |
| **2026-02-22** | [match_default_behavior.md](2026-02-22/match_default_behavior.md) | Specification for the new default "Direct Apply" match behavior and Review & Edit button. |
| **2026-02-22** | [player_keyboard_shortcuts.md](2026-02-22/player_keyboard_shortcuts.md) | Specification for new player keyboard shortcuts including major skip and chapter jumps. |
| **General** | [docs/consolidate_feature.md](docs/consolidate_feature.md) | Comprehensive documentation for the "Consolidate" feature, including conflict resolution and technical details. |
| **General** | [docs/item_restructuring_guide.md](docs/item_restructuring_guide.md) | Guide for Moving, Merging, and Splitting (Promoting) library items. |
| **General** | [docs/metadata_management_tools.md](docs/metadata_management_tools.md) | Documentation for Reset Metadata and Batch Reset operations. |
| **General** | [docs/ui_visual_indicators_system.md](docs/ui_visual_indicators_system.md) | Overview of the badge system (Cover Size, Consolidation Status). |
| **General** | [docs/library_maintenance_and_migration.md](docs/library_maintenance_and_migration.md) | Technical guide for database path migration and library flattening. |
| **General** | [docs/m4b_authoring_tool.md](docs/m4b_authoring_tool.md) | Documentation for the M4B merge tool and Stream Copy feature. |
| **General** | [docs/ux_power_user_shortcuts.md](docs/ux_power_user_shortcuts.md) | Overview of keyboard shortcuts, navigation logic, and batch actions. |
