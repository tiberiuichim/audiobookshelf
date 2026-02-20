# M4B Authoring Tool

## Overview
Audiobookshelf includes a built-in tool to merge multi-file audiobooks into a single M4B file. This tool is accessible via the **Manage** tab of any book.

## "Stream Copy" (Zero Re-encode)
The most significant improvement to the authoring tool is the **Stream Copy** (Codec: `Copy`) feature.

### Benefits
- **Quality Preservation**: Since the audio is not re-encoded, there is zero loss in audio quality during the merge.
- **Speed**: Processing time is reduced from minutes (for re-encoding) to seconds (for disk I/O).
- **CPU Efficiency**: Minimal processing power is required compared to transcoding.

### How it Works
1.  **Concatenation**: FFmpeg uses the `concat` demuxer to join the source files into a continuous stream without decoding them.
2.  **Container Swap**: The stream is wrapped into an MP4/M4B container.
3.  **Metadata Injection**: Chapters, title, artist, and cover art are injected in a secondary pass, again using `-c copy`.

## Feature Matrix

| Feature | Support |
| :--- | :--- |
| **Codecs** | AAC, OPUS, Copy (Stream Copy) |
| **Chapters** | Automatically generated from Library Item tracks |
| **Cover Art** | Embedded as a video stream (attached_pic) |
| **Metadata** | Title, Artist, Album, and Comment tags |

## Usage
1.  Navigate to a book with multiple audio files.
2.  Go to **Manage** -> **M4B Encoder**.
3.  Select **Codec: Copy**.
4.  Click **Merge**.
5.  Once complete, a new M4B file will appear in the "Files" tab, and you will be prompted to swap the library item to the new file (optional).

## Requirements
- Source files must be compatible with the M4B container (typically AAC/M4A/MP3).
- **Note**: While MP3 files can technically be copied into an M4B container, some players may have better compatibility if MP3s are transcoded to AAC.
