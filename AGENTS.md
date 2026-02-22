# Audiobookshelf Development Project

## Overview

This is a **local development deployment** of [Audiobookshelf](https://audiobookshelf.org/) - a self-hosted audiobook and podcast server. The project is cloned from the original repository and configured for personal enhancements and development.

## Repository Configuration

- **Original Remote**: `origin` (git@github.com:advplyr/audiobookshelf.git)
- **Personal Remote**: `tibi` (git@github.com:tiberiuichim/audiobookshelf.git)
- **Default Branch**: Typically `master` or `main`
- **Development Scope**: Personal enhancements only - no contributions back to original repo

## Technology Stack

### Backend

- **Runtime**: Node.js (v20)
- **Framework**: Express.js with Socket.IO
- **Database**: SQLite3 with Sequelize ORM
- **Key Libraries**:
  - `axios` - HTTP client
  - `passport` - Authentication
  - `socket.io` - WebSocket support
  - `sequelize` - ORM
  - `nodemailer` - Email notifications

### Frontend

- **Framework**: Nuxt.js (Vue.js)
- **State Management**: Vuex
- **CSS**: Custom styles with PostCSS
- **Internationalization**: i18n support (36+ languages)

## Project Structure

```
audiobookshelf/
├── client/                 # Nuxt.js frontend application
│   ├── assets/            # Static assets (CSS, images)
│   ├── components/        # Vue components
│   ├── layouts/           # Page layouts
│   ├── middleware/        # Route middleware
│   ├── mixins/            # Reusable Vue mixins
│   ├── pages/             # Application pages
│   ├── plugins/           # Vue plugins
│   ├── static/            # Static files
│   ├── store/             # Vuex stores
│   └── strings/           # i18n translations
├── server/                # Node.js backend
│   ├── auth/             # Authentication strategies
│   ├── controllers/      # API controllers
│   ├── finders/          # Metadata finders
│   ├── libs/             # Utility libraries
│   ├── managers/         # Business logic managers
│   ├── migrations/       # Database migrations
│   ├── models/           # Sequelize models
│   ├── objects/          # Domain objects
│   ├── providers/        # External service providers
│   ├── routers/          # Express routers
│   ├── scanner/          # Library scanning logic
│   └── utils/            # Utility functions
├── data/                 # Local test data (ignored by git)
├── docs/                 # API documentation (OpenAPI)
├── images/               # Project images
├── index.js             # Application entry point
├── prod.js              # Production entry point
└── package.json         # Dependencies and scripts
```

## Key Features

- Self-hosted audiobook and podcast server
- Multi-user support with custom permissions
- Progress syncing across devices
- Automatic library detection and scanning
- Chromecast support
- RSS feeds for podcasts and audiobooks
- Chapter editing and lookup
- Audio file merging (m4b)
- Metadata embedding
- Ebook support (EPUB, PDF, CBR, CBZ)
- Backup and restore functionality

## Development Commands

```bash
# Install dependencies
npm ci                    # Root dependencies
cd client && npm ci       # Client dependencies

# Build client
npm run client           # Build production client
cd client && npm run generate  # Generate static files

# Run development server
npm run dev              # Nodemon with file watching on port 3333
cd client && npm run dev # Live reload client on port 3000

# Run production
npm start               # Start production server
npm run prod            # Build client and start production

# Testing
npm run test            # Run unit tests with Mocha
npm run coverage        # Run tests with code coverage

# Docker
docker buildx build --platform linux/amd64,linux/arm64 -t advplyr/audiobookshelf
```

## Local Development Setup

1. **Node.js v20** and **FFmpeg** are required
2. Create `dev.js` in root directory for local configuration (see `.devcontainer/dev.js` for example)
3. Default development ports:

- Server: `3333`
- Client (dev): `3000`

4. Access the running instance directly on `localhost:3333`

## Important Notes

- This is a **local deployment** - no reverse proxy or deployment configuration is needed
- All changes are committed to the **tibi** remote: `git push tibi <branch>`
- The `data/` directory contains test audiobooks and is git-ignored
- Database is SQLite-based, stored in config location (not in repo)
- Client must be regenerated after frontend changes: `(cd client; npm run generate)`

## API Documentation

OpenAPI documentation available at `docs/openapi.json`

## Code Style

- JavaScript (ES6+)
- Vue.js components with Composition API where applicable
- Sequelize models for database operations
- No comments in code unless explicitly requested

### UI Components & Modals

- **Modals**: Do **NOT** use `<ui-modal>`. The correct component for creating modals in this project is `<modals-modal>`.
  - When creating a new modal, it must be imported/registered in `client/layouts/default.vue` (e.g., `<modals-my-new-modal />`).
  - The modal title should be placed inside a `<template #outer>` slot, following the design pattern of other modals.
  - State for whether the modal is open or closed should be managed in `client/store/globals.js` and toggled via a Vuex mutation.

## Database Migrations

Located in `server/migrations/`. Key migrations include:

- v2.15.0+ - Schema improvements
- v2.17.x - Foreign key constraints and indices
- v2.19.x - Library item improvements
- v2.26.0 - Authentication tables

Run migrations automatically on server startup.

## Portable Database Setup

The database uses **relative paths** for portability. When moving the entire project folder:

### Path Structure

| Data Type    | Database Path                | Actual Location                |
| ------------ | ---------------------------- | ------------------------------ |
| Audiobooks   | `audiobooks/`                | `./data/audiobooks/`           |
| Cover images | `metadata/metadata/items/`   | `./metadata/metadata/items/`   |
| Backups      | `metadata/metadata/backups/` | `./metadata/metadata/backups/` |

### Migration Script

Run the migration script to convert absolute Docker paths to relative paths:

```bash
./scripts/migrate_to_relative_paths.sh
```

This script:

1. Creates a backup at `config/absdatabase.sqlite.backup`
2. Converts `libraryFolders.path` to relative paths
3. Converts `libraryItems.path` and `relPath` to relative paths
4. Converts `books.coverPath` to relative paths
5. Updates `settings.backupPath` in JSON configuration
6. Creates necessary directory structure

### Directory Structure (Created by Migration)

```
data/
  audiobooks/
metadata/
  metadata/
    items/
    backups/
    cache/
    logs/
    streams/
config/
  absdatabase.sqlite
  absdatabase.sqlite.backup
```

### Starting the Server

```bash
cd /mnt/docker/work/books/audiobookshelf
npm run dev
```

The server will resolve all paths relative to the current working directory.

## Artifact Specifications

Each new feature or major change should be documented in an artifact specification file. These files serve as the planning and record of implementation for the feature.

### Organization

- **Location**: All artifact specifications are stored in the `artifacts/` directory.
- **Index**: You can look up previous artifact specification files in `artifacts/index.md`.
- **Dated Folders**: Specifications **MUST** be placed in a subfolder named by the current date (e.g., `artifacts/YYYY-MM-DD/`).
- **CRITICAL**: Do **NOT** create specification files directly in the `artifacts/` root. Always use the dated folder.
- **Filename**: Use descriptive names for the specification files (e.g., `move-to-library-specification.md`).

### Managing Folders

A `Makefile` is provided in the `artifacts/` directory to quickly set up the folder for the current day. **AI Assistants should always run this command first** if the today folder does not exist:

```bash
cd artifacts
make  # Runs the 'today' target to create the dated folder (e.g. artifacts/2026-02-17)
```

### Purpose

Artifact specifications should serve as a source of truth for the feature's lifecycle. A high-quality specification includes:

1.  **Detailed Overview**: Clear summary of the user-facing functionality.
2.  **API & Data Contracts**: Explicit documentation of new endpoints (methods, paths, payloads) and schema changes.
3.  **Traceability (Files Modified)**: A table of all files touched in the implementation, categorized (e.g., Backend, Frontend, Docs).
4.  **Architectural Decisions**: Explanation of *why* certain patterns were used (e.g., shared utility functions, state management choices).
5.  **Localization**: Tracking of new string keys or translation updates.
6.  **Verification Plan**: Concrete testing steps (manual or automated) to verify the implementation.
7.  **Limitations & Future Work**: Explicitly stating what is *not* supported or known edge cases that weren't addressed.

### Best Practices

- **Use for Every Feature**: For *every* new feature or significant development, start by creating a specification file in today's dated folder.
- **Initialization**: Always run `make` (or `make today`) in the `artifacts/` directory before starting work on a new specification to ensure the correct dated folder exists.
- **Relevant Naming**: Name the specification file according to the task/feature (e.g., `feature_name_specification.md`).
- **Update as you go**: The artifact should be updated during implementation if the plan changes.
- **Be Specific**: Avoid vague descriptions. If a function is moved to a controller, name the function and the controller.
- **Use Tables**: Tables are great for listing files or comparing before/after states.
- **Include Code Snippets**: For API definitions or complex logic flows, short code/JSON snippets are highly encouraged.

## Related Documentation

- [Main Documentation](https://audiobookshelf.org/docs)
- [User Guides](https://audiobookshelf.org/guides)
- [API Documentation](https://api.audiobookshelf.org/)
- [Discord Community](https://discord.gg/HQgCbd6E75)
