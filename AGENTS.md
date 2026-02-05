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

## Database Migrations

Located in `server/migrations/`. Key migrations include:
- v2.15.0+ - Schema improvements
- v2.17.x - Foreign key constraints and indices
- v2.19.x - Library item improvements
- v2.26.0 - Authentication tables

Run migrations automatically on server startup.

## Related Documentation

- [Main Documentation](https://audiobookshelf.org/docs)
- [User Guides](https://audiobookshelf.org/guides)
- [API Documentation](https://api.audiobookshelf.org/)
- [Discord Community](https://discord.gg/HQgCbd6E75)
