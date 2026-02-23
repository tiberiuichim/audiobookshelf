# Local Database Migration Specification

## Overview

This document specifies the automatic path migration process for transferring an Audiobookshelf database from a Docker deployment to a local development environment.

## Problem Statement

The source database was created in a Docker container environment with hardcoded absolute paths. These paths must be automatically detected and remapped to match the local development environment structure.

## Source Database

- **Location**: `/mnt/docker/work/books/audiobookshelf/config/absdatabase.sqlite`
- **Version**: 2.32.1 (from settings)

## Identified Path References

### 1. libraryFolders Table

**Table**: `libraryFolders` **Columns with paths**: `path`

**Sample data**: | id | path | libraryId | |----|------|-----------| | 9f980819-1371-4c8f-9e7d-a6cbe9ae1ba7 | /audiobooks | a04cbf28-7eb6-4c87-b3e3-421ad8b35923 | | 43bf8c8d-07b6-4828-848f-8bb1e3dcca04 | /libraries/books | dad4448d-77c2-481e-9212-1ffcb4272932 |

**Migration strategy**:

- Map each unique library folder path to a corresponding local path
- Preserve the folder structure within each library

### 2. libraryItems Table

**Table**: `libraryItems` **Columns with paths**: `path`, `relPath`

**Sample data**: | id | path | relPath | title | |----|------|---------|-------| | 6ec745f9-608e-4556-8f78-b36e2682069b | /audiobooks/A Beginner's Guide to Forever.m4b | A Beginner's Guide to Forever.m4b | A Beginner's Guide to Forever |

**Migration strategy**:

- The `path` column contains full absolute paths from Docker root
- The `relPath` column contains paths relative to library folder (less likely to need migration)
- Update `path` to use local library folder mappings

### 3. books Table

**Table**: `books` **Columns with paths**: `coverPath`

**Sample data**: | id | coverPath | |----|-----------| | 68f4e9ca-c8e9-46a1-b667-7b0a409dd72d | /metadata/items/6ec745f9-608e-4556-8f78-b36e2682069b/cover.jpg |

**Migration strategy**:

- `coverPath` points to `/metadata/items/{libraryItemId}/cover.jpg`
- May need remapping if local `metadata` directory differs from Docker

### 4. feeds Table

**Table**: `feeds` **Columns with paths**: `serverAddress`, `feedURL`, `imageURL`, `siteURL`, `coverPath`

**Migration strategy**:

- `serverAddress`: The Docker container's server URL (e.g., `http://audiobookshelf:8080`)
- `feedURL`, `imageURL`, `siteURL`: URLs containing the server address
- `coverPath`: Local file path to feed cover images

### 5. settings Table

**Table**: `settings` **Key with paths**: `server-settings` (JSON value)

**Path settings in JSON**:

- `backupPath`: Docker path (e.g., `/metadata/backups`)
- Potentially others in nested JSON structure

## Migration Input/Output

### Input Mapping Format

```yaml
# path-mapping.yaml
libraries:
  /audiobooks: /home/user/audiobooks
  /libraries/books: /home/user/libraries/books
metadata:
  source: /metadata
  target: /home/user/audiobookshelf/metadata
server:
  docker_host: http://audiobookshelf:8080
  local_host: http://localhost:3333
```

### Output

- Modified SQLite database with all paths updated
- Migration log with changes made
- Backup of original database

## Validation Requirements

1. **Path format validation**: Ensure all updated paths follow local filesystem conventions
2. **Referential integrity**: Verify libraryItems reference valid libraryFolderIds
3. **URL validation**: Ensure feed URLs use correct local server address
4. **File existence check** (optional): Verify that mapped paths exist locally

## Implementation Phases

### Phase 1: Path Discovery

- [ ] Scan all tables for path-like values
- [ ] Identify all unique paths requiring migration
- [ ] Categorize paths by type (library folders, metadata, URLs)

### Phase 2: Mapping Configuration

- [ ] Create mapping configuration file
- [ ] Define library folder path mappings
- [ ] Define metadata path mappings
- [ ] Define server URL mappings

### Phase 3: Migration Script

- [ ] Implement path update logic for each table
- [ ] Implement URL update logic for feeds
- [ ] Implement settings path updates
- [ ] Add transaction safety with rollback capability

### Phase 4: Validation

- [ ] Run validation checks on migrated database
- [ ] Generate migration report
- [ ] Test database with local Audiobookshelf instance

## Related Files

- **Source database**: `/mnt/docker/work/books/audiobookshelf/config/absdatabase.sqlite`
- **Client config**: `/mnt/docker/work/books/audiobookshelf/client/nuxt.config.js`
- **Server config**: `/mnt/docker/work/books/audiobookshelf/server/Server.js`
- **Database models**: `/mnt/docker/work/books/audiobookshelf/server/models/`
