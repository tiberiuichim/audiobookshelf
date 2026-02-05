.PHONY: all library_folders library_items books feeds settings help

all: library_folders library_items books feeds settings
	@echo "=== Complete dump complete ==="

library_folders:
	@echo "Dumping library folders..."
	@bash dump_library_folders.sh

library_items:
	@echo "Dumping library items..."
	@bash dump_library_items.sh

books:
	@echo "Dumping books..."
	@bash dump_books.sh

feeds:
	@echo "Dumping feeds..."
	@bash dump_feeds.sh

settings:
	@echo "Dumping settings..."
	@bash dump_settings.sh

summary:
	@echo "Running full summary..."
	@bash dump_all.sh

help:
	@echo "Available targets:"
	@echo "  make all        - Run all dump scripts"
	@echo "  make summary    - Run the master summary script"
	@echo "  make library_folders - Dump libraryFolders table"
	@echo "  make library_items   - Dump libraryItems table"
	@echo "  make books       - Dump books table"
	@echo "  make feeds       - Dump feeds table"
	@echo "  make settings    - Dump settings table"
	@echo "  make help        - Show this help message"
