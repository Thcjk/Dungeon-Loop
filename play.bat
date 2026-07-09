@echo off
title Dungeon Loop
cd /d "%~dp0"
echo.
echo  ========================================
echo   Dungeon Loop - Offline Edition
echo  ========================================
echo.
echo  Starte lokalen Server auf http://localhost:8080
echo  Druecke Strg+C zum Beenden.
echo.

where python >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:8080
  python -m http.server 8080
  goto :end
)

where py >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:8080
  py -m http.server 8080
  goto :end
)

echo  FEHLER: Python nicht gefunden.
echo  Installiere Python von https://python.org
echo  Oder starte manuell: python -m http.server 8080
pause

:end
