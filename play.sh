#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

do_update() {
  echo ""
  echo "  ========================================"
  echo "   Dungeon Loop - Update"
  echo "  ========================================"
  echo ""
  local zip="/tmp/dl-loop.zip"
  local tmp="/tmp/Dungeon-Loop-main"
  local url="https://github.com/Thcjk/Dungeon-Loop/archive/refs/heads/main.zip"
  rm -f "$zip"
  rm -rf "$tmp"
  if command -v curl >/dev/null 2>&1; then curl -fsSL "$url" -o "$zip"
  elif command -v wget >/dev/null 2>&1; then wget -q "$url" -O "$zip"
  else echo "  FEHLER: curl oder wget noetig."; return 1; fi
  if command -v unzip >/dev/null 2>&1; then unzip -qo "$zip" -d /tmp
  else python3 -c "import zipfile; zipfile.ZipFile('$zip').extractall('/tmp')"; fi
  cp -a "$tmp"/. "$ROOT/"
  rm -f "$zip"
  rm -rf "$tmp"
  echo ""
  echo "  Update fertig! Build: miniworld-v102"
  echo ""
}

if [ "${1:-}" = "update" ]; then
  do_update
  exit 0
fi

echo ""
echo "  ========================================"
echo "   Dungeon Loop - Offline Edition"
echo "   Build: miniworld-v102"
echo "  ========================================"
echo ""
echo "  Ordner: $ROOT"
echo "  Server: http://localhost:8080"
echo "  Beenden: Strg+C"
echo ""

if [ ! -f "index.html" ]; then
  echo "  FEHLER: index.html nicht gefunden."
  exit 1
fi

if [ ! -f "assets/miniworld/Ground/Grass.png" ]; then
  echo "  NEUE VERSION VERFUEGBAR - Welt-Grafiken fehlen."
  read -r -p "  Jetzt updaten? [j/N] " ans
  if [[ "$ans" =~ ^[jJyY]$ ]]; then
    do_update
  else
    echo "  Update uebersprungen. Spaeter: ./play.sh update"
  fi
fi

open_browser() {
  sleep 1
  if command -v xdg-open >/dev/null 2>&1; then xdg-open "http://localhost:8080"
  elif command -v open >/dev/null 2>&1; then open "http://localhost:8080"
  fi
}

if command -v python3 >/dev/null 2>&1; then
  open_browser &
  exec python3 -m http.server 8080
elif command -v python >/dev/null 2>&1; then
  open_browser &
  exec python -m http.server 8080
else
  echo "  FEHLER: Python nicht gefunden."
  exit 1
fi
