#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo ""
echo "  ========================================"
echo "   Dungeon Loop - Offline Update"
echo "  ========================================"
echo ""
echo "  Laedt die neueste Version von GitHub..."
echo ""

ZIP="dl-main.zip"
TMP="Dungeon-Loop-main"
URL="https://github.com/Thcjk/Dungeon-Loop/archive/refs/heads/main.zip"

if command -v curl >/dev/null 2>&1; then
  curl -fsSL "$URL" -o "$ZIP"
elif command -v wget >/dev/null 2>&1; then
  wget -q "$URL" -O "$ZIP"
else
  echo "  FEHLER: curl oder wget noetig."
  exit 1
fi

if command -v unzip >/dev/null 2>&1; then
  unzip -qo "$ZIP"
else
  python3 -c "import zipfile; zipfile.ZipFile('$ZIP').extractall('.')"
fi

rm -f "$ZIP"
cp -a "$TMP"/. .
rm -rf "$TMP"

echo ""
echo "  Update fertig! Build: miniworld-v100"
echo "  Starte mit ./play.sh"
echo ""
