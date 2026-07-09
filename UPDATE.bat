@echo off
title Dungeon Loop - Update
cd /d "%~dp0"
call "%~dp0play.bat" update
exit /b %errorlevel%
