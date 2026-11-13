@echo off
title Homey Pro 3D Dashboard Server
cd /d "%~dp0"
echo Starte Homey Pro 3D Dashboard Server auf http://localhost:8765/ ...
node server.js
pause
