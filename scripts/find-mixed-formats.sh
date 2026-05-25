#!/usr/bin/env bash
# find-mixed-formats.sh
# Finds book folders that contain both MP3 and M4B/M4A files.
# Usage: ./scripts/find-mixed-formats.sh [search_root]
#   search_root defaults to ./data

set -euo pipefail

ROOT="${1:-./data}"
ROOT="$(realpath "$ROOT")"

if [[ ! -d "$ROOT" ]]; then
  echo "Error: '$ROOT' is not a directory." >&2
  exit 1
fi

# Colours
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
BOLD='\033[1m'
RESET='\033[0m'

found=0

echo -e "\n${BOLD}Scanning:${RESET} $ROOT\n"
echo -e "${BOLD}$(printf '%-6s  %-5s  %s' 'M4Bs' 'MP3s' 'Folder')${RESET}"
echo "────────────────────────────────────────────────────────────────────────"

# We only look one level deep per library subfolder (library/author-book/).
# Adjust -maxdepth if your layout is deeper.
while IFS= read -r -d '' dir; do
  m4b_count=$(find "$dir" -maxdepth 1 -iname "*.m4b" -o -iname "*.m4a" 2>/dev/null | wc -l)
  mp3_count=$(find "$dir" -maxdepth 1 -iname "*.mp3" 2>/dev/null | wc -l)

  if (( m4b_count > 0 && mp3_count > 0 )); then
    rel="${dir#$ROOT/}"

    # Colour-code by which format dominates
    if (( m4b_count > mp3_count )); then
      label="${CYAN}chapter-M4Bs + whole-MP3${RESET}"
    elif (( mp3_count > m4b_count )); then
      label="${YELLOW}whole-M4B + chapter-MP3s${RESET}"
    else
      label="${RED}equal count — review manually${RESET}"
    fi

    echo -e "$(printf '%-6d  %-5d' "$m4b_count" "$mp3_count")  ${GREEN}$rel${RESET}  ($label)"
    (( found++ )) || true
  fi
done < <(find "$ROOT" -mindepth 1 -maxdepth 3 -type d -print0 | sort -z)

echo "────────────────────────────────────────────────────────────────────────"
if (( found == 0 )); then
  echo -e "\n${GREEN}No mixed-format folders found.${RESET}\n"
else
  echo -e "\n${BOLD}Found ${RED}$found${RESET}${BOLD} folder(s) with both M4B/M4A and MP3 files.${RESET}\n"
fi
