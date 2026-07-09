@echo off
title Dungeon Loop - Update
cd /d "%~dp0"
echo.
echo  ========================================
echo   Dungeon Loop - Offline Update
echo  ========================================
echo.
echo  Laedt die neueste Version von GitHub...
echo  (Internet noetig - danach wieder offline spielbar)
echo.

set "ZIP=dl-main.zip"
set "TMP=Dungeon-Loop-main"

powershell -NoProfile -Command "try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/Thcjk/Dungeon-Loop/archive/refs/heads/main.zip' -OutFile '%ZIP%' -UseBasicParsing; exit 0 } catch { Write-Host $_.Exception.Message; exit 1 }"
if errorlevel 1 (
  echo.
  echo  FEHLER: Download fehlgeschlagen.
  echo  Pruefe Internetverbindung oder lade ZIP manuell von:
  echo  https://github.com/Thcjk/Dungeon-Loop
  pause
  exit /b 1
)

powershell -NoProfile -Command "Expand-Archive -Path '%ZIP%' -DestinationPath '.' -Force"
if not exist "%TMP%" (
  echo  FEHLER: Entpacken fehlgeschlagen.
  del "%ZIP%" 2>nul
  pause
  exit /b 1
)

echo  Kopiere Dateien in diesen Ordner...
xcopy /E /Y /I "%TMP%\*" . >nul
rmdir /S /Q "%TMP%"
del "%ZIP%"

echo.
echo  Update fertig!
echo  Build: miniworld-v104 (ruhigere Welt-Grafik + Sounds)
echo.
echo  Starte das Spiel mit play.bat
echo.
pause
