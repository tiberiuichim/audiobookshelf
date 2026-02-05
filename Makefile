SCRIPTS_DIR := scripts

.DEFAULT_GOAL := help

.PHONY: help db-dump-all db-dump-folders db-dump-items db-dump-books db-dump-feeds db-dump-settings db-summary frontend-start backend-start

help:
	@echo "Audiobookshelf Database Migration Tools"
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@echo "Targets:"
	@echo "  db-summary       - Run full summary of all Docker paths (quick overview)"
	@echo "  db-dump-all      - Alias for db-summary"
	@echo "  db-dump-folders  - Dump libraryFolders paths"
	@echo "  db-dump-items    - Dump libraryItems paths"
	@echo "  db-dump-books    - Dump books coverPaths"
	@echo "  db-dump-feeds    - Dump feeds URLs"
	@echo "  db-dump-settings - Dump settings JSON paths"

db-dump-folders:
	@bash $(SCRIPTS_DIR)/dump_library_folders.sh

db-dump-items:
	@bash $(SCRIPTS_DIR)/dump_library_items.sh

db-dump-books:
	@bash $(SCRIPTS_DIR)/dump_books.sh

db-dump-feeds:
	@bash $(SCRIPTS_DIR)/dump_feeds.sh

db-dump-settings:
	@bash $(SCRIPTS_DIR)/dump_settings.sh

db-summary:
	@bash $(SCRIPTS_DIR)/dump_all.sh

frontend-start:
	cd client && npm run dev3

backend-start:
	npm run dev
