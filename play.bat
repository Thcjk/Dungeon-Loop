@echo off
title Dungeon Loop
cd /d "%~dp0"
echo.
echo  ========================================
echo   Dungeon Loop - Offline Edition
echo   Build: miniworld-v100
echo  ========================================
echo.
echo  Ordner: %~dp0
echo  Server: http://localhost:8080
echo  Beenden: Strg+C
echo.

if not exist "assets\miniworld\Ground\Grass.png" (
  echo  WARNUNG: Welt-Grafiken fehlen!
  echo  Bitte update-offline.bat ausfuehren oder ZIP neu laden.
  echo.
)

if not exist "index.html" (
  echo  FEHLER: index.html nicht gefunden.
  echo  Starte play.bat im Dungeon-Loop Ordner.
  pause
  exit /b 1
)

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
