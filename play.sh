#!/usr/bin/env bash
cd "$(dirname "$0")"
echo ""
echo "  ========================================"
echo "   Dungeon Loop - Offline Edition"
echo "  ========================================"
echo ""
echo "  Server: http://localhost:8080"
echo "  Beenden: Strg+C"
echo ""

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
  echo "  Installiere Python oder starte manuell:"
  echo "  python3 -m http.server 8080"
  exit 1
fi
