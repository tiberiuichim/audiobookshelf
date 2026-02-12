import os
import shutil
import argparse
import logging
import re
import sys

def get_base_name(name):
    """
    Identifies the 'base' name of a folder by stripping trailing part/track identifiers
    and handling redundant title repetitions.
    """
    # 1. Clean trailing garbage and separators
    base = re.sub(r'[^a-zA-Z0-9\]\)]+$', '', name).strip()
    
    # 2. Strip common part/track suffixes
    patterns = [
        r'\s+Part\s?\d+$',
        r'\s+CD\s?\d+$',
        r'\s+Disc\s?\d+$',
        r'\s+Disk\s?\d+$',
        r'\s+\d+(?:-\d+)?$',
        r'\s+-\s+\d+(?:-\d+)?$'
    ]
    
    changed = True
    while changed:
        old_base = base
        for pattern in patterns:
            base = re.sub(pattern, '', base, flags=re.IGNORECASE).strip()
        changed = old_base != base

    # 3. Handle redundancy: "Title - Title" or "Title - 1356 - 1356"
    # Bernard Cornwell case: "BERNARD CORNWELL ~ [Grail Quest 04] - 1356 - 1356"
    parts = [p.strip() for p in base.split(' - ') if p.strip()]
    if len(parts) > 1:
        last = parts[-1].lower()
        for i in range(len(parts) - 1):
            if parts[i].lower() == last:
                # If we find a repeat, the base is everything up to that repeat
                return " - ".join(parts[:i+1])
                
    return base

def merge_folders(root, dry_run=False):
    root = os.path.abspath(root)
    if not os.path.exists(root):
        logging.error(f"Root path does not exist: {root}")
        return

    try:
        folders = [f for f in os.listdir(root) if os.path.isdir(os.path.join(root, f))]
    except Exception as e:
        logging.error(f"Failed to list directory {root}: {e}")
        return
    
    groups = {} # base_name -> list of original_folder_names
    
    for f in folders:
        base = get_base_name(f)
        if base:
            if base not in groups:
                groups[base] = []
            groups[base].append(f)
            
    # Only keep groups that actually have more than one folder to merge
    merge_groups = {k: v for k, v in groups.items() if len(v) > 1}
    
    if not merge_groups:
        logging.info("No split folder groups detected.")
        return

    logging.info(f"Found {len(merge_groups)} groups to merge.")
    
    for base, originals in merge_groups.items():
        target_dir = os.path.join(root, base)
        logging.info(f"GROUP: '{base}' ({len(originals)} parts)")
        
        for folder in sorted(originals):
            src_path = os.path.join(root, folder)
            logging.info(f"  - MERGE: '{folder}' -> '{base}'")
            
            if not dry_run:
                if not os.path.exists(target_dir):
                    os.makedirs(target_dir)
                
                try:
                    for item in os.listdir(src_path):
                        src_item = os.path.join(src_path, item)
                        dst_item = os.path.join(target_dir, item)
                        
                        # Handle name collisions (e.g. multiple 'cover.jpg' or 'track.mp3')
                        if os.path.exists(dst_item):
                            # Extract the part identifier from the folder name to make file unique
                            part_id = folder[len(base):].strip(' -_')
                            name, ext = os.path.splitext(item)
                            new_name = f"{name} ({part_id}){ext}"
                            dst_item = os.path.join(target_dir, new_name)
                            logging.debug(f"    Collision: Renaming '{item}' to '{new_name}'")
                        
                        shutil.move(src_item, dst_item)
                    
                    # Cleanup the now empty source folder
                    os.rmdir(src_path)
                except Exception as e:
                    logging.error(f"    Operation failed for '{folder}': {e}")

    if dry_run:
        logging.info("Dry run complete. No files were moved.")
    else:
        logging.info("Merge operations completed successfully.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Merge split audiobook part-folders into single folders.")
    parser.add_argument("path", help="Root directory containing the split folders")
    parser.add_argument("--dry-run", action="store_true", help="Show planned merges without executing")
    parser.add_argument("--verbose", action="store_true", help="Show detailed collision info")
    
    args = parser.parse_args()
    
    log_level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(level=log_level, format='%(levelname)s: %(message)s', handlers=[logging.StreamHandler(sys.stdout)])
    
    merge_folders(args.path, args.dry_run)
