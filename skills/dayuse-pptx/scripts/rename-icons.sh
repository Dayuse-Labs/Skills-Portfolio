#!/bin/bash
# rename-icons.sh — Normalize Figma-exported icon filenames
# Removes category prefixes (Property 1=, Indicators=, Navigation=)
# Replaces spaces with hyphens, lowercases everything
#
# Usage: bash scripts/rename-icons.sh
# Run from the dayuse-pptx skill root directory

set -e

ICON_DIR="assets/icons/UI_icon"

if [ ! -d "$ICON_DIR" ]; then
  echo "Error: $ICON_DIR not found. Run from the skill root directory."
  exit 1
fi

echo "=== Renaming UI icons in $ICON_DIR ==="
count=0

for file in "$ICON_DIR"/*.svg; do
  [ -f "$file" ] || continue

  basename=$(basename "$file")

  # Remove Figma prefixes: "Property 1=", "Indicators=", "Navigation="
  newname="$basename"
  newname=$(echo "$newname" | sed 's/^Property 1=//')
  newname=$(echo "$newname" | sed 's/^Indicators=//')
  newname=$(echo "$newname" | sed 's/^Navigation=//')

  # Replace spaces with hyphens
  newname=$(echo "$newname" | tr ' ' '-')

  # Lowercase
  newname=$(echo "$newname" | tr '[:upper:]' '[:lower:]')

  if [ "$basename" != "$newname" ]; then
    echo "  $basename → $newname"
    mv "$ICON_DIR/$basename" "$ICON_DIR/$newname"
    count=$((count + 1))
  fi
done

echo ""
echo "=== Renaming Marketing icons ==="
MKTG_DIR="assets/icons/Marketing_icon"

if [ -d "$MKTG_DIR" ]; then
  for file in "$MKTG_DIR"/*.svg; do
    [ -f "$file" ] || continue

    basename=$(basename "$file")

    # Replace spaces with hyphens, lowercase
    newname=$(echo "$basename" | tr ' ' '-' | tr '[:upper:]' '[:lower:]')

    if [ "$basename" != "$newname" ]; then
      echo "  $basename → $newname"
      mv "$MKTG_DIR/$basename" "$MKTG_DIR/$newname"
      count=$((count + 1))
    fi
  done
fi

echo ""
echo "=== Renaming Photos ==="
PHOTO_DIR="assets/photos"

if [ -d "$PHOTO_DIR" ]; then
  for file in "$PHOTO_DIR"/*; do
    [ -f "$file" ] || continue

    basename=$(basename "$file")

    # Replace spaces with hyphens (keep original case for photos)
    newname=$(echo "$basename" | tr ' ' '-')

    if [ "$basename" != "$newname" ]; then
      echo "  $basename → $newname"
      mv "$PHOTO_DIR/$basename" "$PHOTO_DIR/$newname"
      count=$((count + 1))
    fi
  done
fi

echo ""
echo "Done! Renamed $count files."
echo ""
echo "After renaming, update SKILL.md if referencing specific filenames."
