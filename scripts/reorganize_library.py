import os
import shutil
import argparse
import logging
import sys
import re

# Supported audio extensions in Audiobookshelf
AUDIO_EXTENSIONS = {
    '.m4b', '.mp3', '.m4a', '.flac', '.opus', '.ogg', '.oga', 
    '.mp4', '.aac', '.wma', '.aiff', '.aif', '.wav', '.webm', 
    '.webma', '.mka', '.awb', '.caf', '.mpg', '.mpeg'
}

def clean_author_name(name):
    """Strips common suffixes from author names for cleaner folder names."""
    suffixes = [" Collection", " Anthology", " Series", " Books", " Works", " Complete", " (All Chaptered)"]
    clean = name.strip()
    for suffix in suffixes:
        if clean.lower().endswith(suffix.lower()):
            clean = clean[:-len(suffix)].strip()
    return clean

def clean_title(title):
    """
    Cleans a title/filename by removing common metadata suffixes.
    e.g. "1997 - A Spy in Europa (Hauenstein) 32k 00.51.22 {11.8mb}" -> "1997 - A Spy in Europa"
    """
    # Remove file extension if present
    base = os.path.splitext(title)[0]
    
    # Remove metadata in curly braces {11.8mb}
    base = re.sub(r'\{.*?\}', '', base)
    # Remove metadata in parentheses (Hauenstein)
    base = re.sub(r'\(.*?\)', '', base)
    # Remove bitrates like 32k, 128kbps
    base = re.sub(r'\b\d{1,3}\s?k(bps)?\b', '', base, flags=re.IGNORECASE)
    # Remove durations like 00.51.22 or 12.34
    base = re.sub(r'\b\d{1,2}[\.:]\d{2}([\.:]\d{2})?\b', '', base)
    
    # Clean up extra spaces and dashes
    base = base.replace('_', ' ').strip()
    base = re.sub(r'\s+-\s+', ' - ', base)
    base = re.sub(r'\s+', ' ', base)
    return base.strip(' -')

def get_target_name(rel_path, author_override=None, item_name=None):
    """
    Generates a flat target name from path parts and optionally an item name.
    """
    # 1. Determine Author
    path_parts = [p.strip() for p in rel_path.replace('\\', '/').split('/') if p.strip()]
    author = author_override or clean_author_name(path_parts[0])
    
    # 2. Collect segments
    # Start with author
    segments = [author]
    
    # Add intermediate path segments (excluding author and if they aren't redundant)
    for part in path_parts[1:]:
        clean_part = part
        if clean_part.lower().startswith(author.lower()):
            clean_part = clean_part[len(author):].strip(' -_')
        if clean_part:
            segments.append(clean_part)
            
    # Add the specific item name if we are splitting
    if item_name:
        clean_item = clean_title(item_name)
        if clean_item.lower().startswith(author.lower()):
            clean_item = clean_item[len(author):].strip(' -_')
        if clean_item:
            segments.append(clean_item)

    # 3. Final cleanup and deduplication
    final_segments = []
    for s in segments:
        s_clean = s.strip(' -_')
        if not s_clean: continue
        
        # Don't add if it's redundant with the previous segment
        if final_segments:
            prev = final_segments[-1].lower()
            curr = s_clean.lower()
            if curr == prev or curr.startswith(prev) or prev.endswith(curr):
                # If current is longer and starts with prev, replace prev
                if len(curr) > len(prev) and curr.startswith(prev):
                    final_segments[-1] = s_clean
                continue
        
        final_segments.append(s_clean)
        
    return " - ".join(final_segments)

def is_multi_work_dir(path):
    """
    Heuristic to detect if a folder contains multiple independent books.
    """
    try:
        items = os.listdir(path)
    except PermissionError:
        return False

    audio_files = [i for i in items if os.path.isfile(os.path.join(path, i)) and os.path.splitext(i)[1].lower() in AUDIO_EXTENSIONS]
    if len(audio_files) < 2:
        return False

    # Check for sequential track numbering (01, 02, Part 1...)
    # If most files start with a small number, it's likely a single book.
    numbered_count = 0
    for f in audio_files:
        if re.match(r'^(\d{1,3}|Part\s?\d+|Disc\s?\d+)\b', f, re.I):
            numbered_count += 1
            
    # If less than 50% are numbered, or they have very different names, treat as multi-work
    if numbered_count / len(audio_files) < 0.5:
        return True
        
    return False

def is_book_dir(path):
    """
    Checks if a directory is a single book folder.
    """
    try:
        items = os.listdir(path)
    except PermissionError:
        return False

    audio_files = [i for i in items if os.path.isfile(os.path.join(path, i)) and os.path.splitext(i)[1].lower() in AUDIO_EXTENSIONS]
    subdirs = [i for i in items if os.path.isdir(os.path.join(path, i))]
    
    if audio_files:
        # A folder with audio is a book if it's NOT a multi-work container
        if is_multi_work_dir(path):
            return False
            
        # Also check if it has deeper books
        non_cd_subdirs = [s for s in subdirs if not s.lower().startswith(('cd', 'disc', 'disk'))]
        for s in non_cd_subdirs:
            # Recursive check: if a subdirectory has audio, this folder might just be a container
            if any(os.path.splitext(f)[1].lower() in AUDIO_EXTENSIONS for dp, dn, filenames in os.walk(os.path.join(path, s)) for f in filenames):
                return False
        return True
        
    if subdirs:
        # Check if it's a multi-disc book (only CD subfolders containing audio)
        audio_subdirs = []
        for s in subdirs:
            s_path = os.path.join(path, s)
            if any(os.path.splitext(f)[1].lower() in AUDIO_EXTENSIONS for dp, dn, filenames in os.walk(s_path) for f in filenames):
                audio_subdirs.append(s)
        
        if audio_subdirs and all(s.lower().startswith(('cd', 'disc', 'disk')) for s in audio_subdirs):
            return True
            
    return False

def migrate(root, dry_run=False, split=False):
    root = os.path.abspath(root)
    if not os.path.exists(root):
        logging.error(f"Root path does not exist: {root}")
        return

    logging.info(f"Scanning library at: {root}")
    
    book_dirs = []
    multi_work_dirs = []
    
    for dirpath, dirnames, filenames in os.walk(root):
        if dirpath == root:
            continue
            
        rel_path = os.path.relpath(dirpath, root)
        
        if split and is_multi_work_dir(dirpath):
            logging.debug(f"Found multi-work directory: {rel_path}")
            multi_work_dirs.append(dirpath)
            dirnames[:] = [] # Stop recursion
        elif is_book_dir(dirpath):
            logging.debug(f"Found book directory: {rel_path}")
            book_dirs.append(dirpath)
            dirnames[:] = [] # Stop recursion

    moves = [] # List of (src, dst, is_file)

    # 1. Plan Moves for Multi-Work files
    for mw_path in multi_work_dirs:
        rel_path = os.path.relpath(mw_path, root)
        files = [f for f in os.listdir(mw_path) if os.path.isfile(os.path.join(mw_path, f)) and os.path.splitext(f)[1].lower() in AUDIO_EXTENSIONS]
        
        for f in files:
            src = os.path.join(mw_path, f)
            # Create a target folder name for this specific file
            target_name = get_target_name(rel_path, item_name=f)
            target_dir = os.path.join(root, target_name)
            dst = os.path.join(target_dir, f)
            moves.append((src, dst, True))

    # 2. Plan Moves for Book Folders
    for book_path in book_dirs:
        rel_path = os.path.relpath(book_path, root)
        target_name = get_target_name(rel_path)
        target_path = os.path.join(root, target_name)
        
        if os.path.abspath(book_path) == os.path.abspath(target_path):
            continue
            
        moves.append((book_path, target_path, False))

    logging.info(f"Planned operations: {len(moves)}")

    # Execute moves
    successful_moves = 0
    for src, dst, is_file_move in moves:
        src_rel = os.path.relpath(src, root)
        dst_rel = os.path.relpath(dst, root)
        
        if os.path.exists(dst):
            if os.path.abspath(src) == os.path.abspath(dst):
                continue
            logging.warning(f"Conflict: Target already exists: {dst_rel}. Skipping {src_rel}")
            continue
            
        logging.info(f"PLAN: '{src_rel}' -> '{dst_rel}'")
        if not dry_run:
            try:
                if is_file_move:
                    os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.move(src, dst)
                successful_moves += 1
            except Exception as e:
                logging.error(f"Failed to move '{src_rel}': {e}")

    if not dry_run:
        logging.info("Cleaning up empty directories...")
        for dirpath, dirnames, filenames in os.walk(root, topdown=False):
            if dirpath == root: continue
            try:
                if not os.listdir(dirpath):
                    os.rmdir(dirpath)
            except: pass
    else:
        logging.info(f"Dry run complete. {len(moves)} operations would be performed.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Reorganize library to a flat structure.")
    parser.add_argument("path", help="Root directory of the library")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--verbose", action="store_true")
    parser.add_argument("--split", action="store_true", help="Split folders with multiple independent books")
    parser.add_argument("--log-file", help="Path to a file to write logs to")
    
    args = parser.parse_args()
    
    log_level = logging.DEBUG if args.verbose else logging.INFO
    handlers = [logging.StreamHandler(sys.stdout)]
    if args.log_file: handlers.append(logging.FileHandler(args.log_file))
    logging.basicConfig(level=log_level, format='%(levelname)s: %(message)s', handlers=handlers)
    
    migrate(args.path, args.dry_run, args.split)
