# M4B Conversion Specification

## Overview
Audiobookshelf provides a tool to merge audiobook audio tracks into a single M4B file. This specification documents the improvements made to this tool to support "Stream Copy" (no re-encode), preserving audio quality and significantly reducing processing time.

## Feature Goals
- Support merging multiple audio files (MP3, M4A, AAC) into a single M4B container.
- **Avoid re-encoding** when the source audio is already compatible (e.g., AAC in M4A/MP4 container) or when the user explicitly chooses "Copy".
- Preserving all metadata including:
    - Title, Artist, Album, etc.
    - Chapters (from library item metadata).
    - Cover art.

## Technical Details

### Backend Implementation
The logic resides in `server/utils/ffmpegHelpers.js` and `server/managers/AbMergeManager.js`.

#### FFmpeg Strategy for "Copy"
When `codec: 'copy'` is requested:
1.  **Concatenation**: If multiple files exist, they are concatenated using the `concat` demuxer in FFmpeg.
    - Command: `ffmpeg -f concat -safe 0 -i files.txt -c copy -f mp4 output.m4b`
2.  **Metadata and Cover Embedding**: The concatenated file is then processed to add the `ffmetadata` and cover art.
    - Command: `ffmpeg -i input.m4b -i metadata.txt -i cover.jpg -map 0:a -map 1 -map 2:v -c copy -disposition:v:0 attached_pic -f mp4 output_final.m4b`

### Frontend Implementation
The user interface is accessible via the **Manage** page of a book, under the **M4B Encoder** tool.

#### Options
- **Codec**: Options include `AAC`, `OPUS`, and `Copy`.
- **Bitrate**: Custom or presets (ignored for `Copy`).
- **Channels**: Custom or presets (ignored for `Copy`).

## Current Status
- [x] Initial specification.
- [x] Backend implementation for stream copy.
- [x] Verification.
