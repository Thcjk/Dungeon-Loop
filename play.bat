@echo off
setlocal EnableDelayedExpansion
title Dungeon Loop
cd /d "%~dp0"

if /i "%~1"=="update" goto :do_update

echo.
echo  ========================================
echo   Dungeon Loop - Offline Edition
echo   Build: miniworld-v104
echo  ========================================
echo.
echo  Ordner: %~dp0
echo  Server: http://localhost:8080
echo  Beenden: Strg+C
echo.

if not exist "index.html" (
  echo  FEHLER: index.html nicht gefunden.
  echo  Starte play.bat im Dungeon-Loop Ordner.
  pause
  exit /b 1
)

if not exist "assets\miniworld\Ground\Grass.png" (
  echo  ========================================
  echo   NEUE VERSION VERFUEGBAR
  echo  ========================================
  echo.
  echo  Welt-Grafiken fehlen in diesem Ordner.
  echo  Einmal Update noetig ^(Internet^), danach offline.
  echo.
  choice /C JN /N /M "  Jetzt updaten? [J/N] "
  if errorlevel 2 (
    echo.
    echo  Update uebersprungen. Spiel startet ohne neue Grafiken.
    echo  Spaeter: play.bat update   oder   UPDATE.bat
    echo.
    timeout /t 4 >nul
    goto :start_server
  )
  call "%~f0" update
  if errorlevel 1 pause
  exit /b %errorlevel%
)

goto :start_server

:do_update
echo.
echo  ========================================
echo   Dungeon Loop - Update
echo  ========================================
echo.
echo  Laedt neueste Version von GitHub...
echo.

set "ZIP=%TEMP%\dl-loop.zip"
set "TMP=%TEMP%\Dungeon-Loop-main"

del "%ZIP%" 2>nul
rmdir /S /Q "%TMP%" 2>nul

powershell -NoProfile -Command "try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/Thcjk/Dungeon-Loop/archive/refs/heads/main.zip' -OutFile '%ZIP%' -UseBasicParsing; exit 0 } catch { Write-Host $_.Exception.Message; exit 1 }"
if errorlevel 1 (
  echo.
  echo  FEHLER: Download fehlgeschlagen.
  echo  Internet noetig. Oder ZIP manuell laden:
  echo  https://github.com/Thcjk/Dungeon-Loop
  exit /b 1
)

powershell -NoProfile -Command "Expand-Archive -Path '%ZIP%' -DestinationPath '%TEMP%' -Force"
if not exist "%TMP%" (
  echo  FEHLER: Entpacken fehlgeschlagen.
  del "%ZIP%" 2>nul
  exit /b 1
)

echo  Kopiere Dateien...
xcopy /E /Y /I "%TMP%\*" "%~dp0" >nul
rmdir /S /Q "%TMP%" 2>nul
del "%ZIP%" 2>nul

echo.
echo  Update fertig! Build: miniworld-v104
echo.
if /i not "%~1"=="update" goto :start_server
exit /b 0

:start_server
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
pause

:end
endlocal
