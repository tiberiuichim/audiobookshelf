import os
import sys
import argparse

def get_longest_common_prefix(strings):
    if not strings:
        return ""
    prefix = strings[0]
    for s in strings[1:]:
        while not s.startswith(prefix):
            prefix = prefix[:-1]
            if not prefix:
                return ""
    return prefix

def remove_prefix(directory, prefix=None, dry_run=True):
    # Get all directories in the target directory
    items = [d for d in os.listdir(directory) if os.path.isdir(os.path.join(directory, d))]
    
    if not items:
        print(f"No directories found in {directory}")
        return

    if prefix is None:
        prefix = get_longest_common_prefix(items)
        if not prefix:
            print("No common prefix found.")
            return

    print(f"Prefix to remove: '{prefix}'")
    
    # Filter items that have the prefix
    items_to_rename = [d for d in items if d.startswith(prefix)]
    
    if not items_to_rename:
        print("No items found with the specified prefix.")
        return

    print(f"Found {len(items_to_rename)} items to rename.")
    
    renamed_count = 0
    for old_name in items_to_rename:
        # Initial removal
        new_name = old_name[len(prefix):]
        
        # Clean up leading dashes, spaces, or dots that often separate prefixes
        new_name = new_name.lstrip(" -.")
        
        if not new_name:
            print(f"Skipping '{old_name}' because it would result in an empty name.")
            continue

        old_path = os.path.join(directory, old_name)
        new_path = os.path.join(directory, new_name)
        
        if os.path.exists(new_path):
            print(f"Error: Cannot rename '{old_name}' to '{new_name}' because the destination already exists.")
            continue

        if dry_run:
            print(f"[DRY RUN] Would rename: '{old_name}' -> '{new_name}'")
        else:
            try:
                os.rename(old_path, new_path)
                print(f"Renamed: '{old_name}' -> '{new_name}'")
                renamed_count += 1
            except OSError as e:
                print(f"Error renaming '{old_name}': {e}")

    if not dry_run:
        print(f"Successfully renamed {renamed_count} directories.")
    else:
        print("Dry run complete. No changes were made. Run without --dry-run to apply changes.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Remove a common prefix from directories.")
    parser.get_default('dry_run')
    parser.add_argument("directory", help="The directory containing the folders to rename.")
    parser.add_argument("--prefix", help="The prefix to remove. If not provided, it will be auto-detected.")
    parser.add_argument("--apply", action="store_true", help="Apply the changes (default is dry run).")
    
    args = parser.parse_args()
    
    target_dir = os.path.abspath(args.directory)
    if not os.path.isdir(target_dir):
        print(f"Error: {target_dir} is not a directory.")
        sys.exit(1)
        
    remove_prefix(target_dir, args.prefix, dry_run=not args.apply)
