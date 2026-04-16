#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
PACKAGE_DIR="$DIST_DIR/design-md-extractor"
ZIP_FILE="$DIST_DIR/design-md-extractor-chrome-extension.zip"

echo "Cleaning dist directory..."
rm -rf "$DIST_DIR"

echo "Creating package directory..."
mkdir -p "$PACKAGE_DIR"

echo "Copying extension files..."
cp "$ROOT_DIR/manifest.json" "$PACKAGE_DIR/"
cp "$ROOT_DIR/package.json" "$PACKAGE_DIR/"
cp "$ROOT_DIR/README.md" "$PACKAGE_DIR/"
cp "$ROOT_DIR/MANUAL_INSTALL.md" "$PACKAGE_DIR/"
cp "$ROOT_DIR/options.html" "$PACKAGE_DIR/"
cp "$ROOT_DIR/options.css" "$PACKAGE_DIR/"
cp "$ROOT_DIR/popup.html" "$PACKAGE_DIR/"
cp "$ROOT_DIR/popup.css" "$PACKAGE_DIR/"
cp -R "$ROOT_DIR/src" "$PACKAGE_DIR/"

echo "Creating zip archive..."
(
  cd "$DIST_DIR"
  zip -qr "$(basename "$ZIP_FILE")" "$(basename "$PACKAGE_DIR")"
)

echo "Build complete."
echo "Directory: $PACKAGE_DIR"
echo "Archive:   $ZIP_FILE"
