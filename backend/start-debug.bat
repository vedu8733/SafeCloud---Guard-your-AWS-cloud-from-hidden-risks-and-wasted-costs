@echo off
echo Starting SafeCloud Backend with DEBUG logging...
echo.
echo This will enable detailed logging for the scanner service
echo.
set LOG_LEVEL=DEBUG
set NODE_ENV=development
echo Environment variables set:
echo LOG_LEVEL=%LOG_LEVEL%
echo NODE_ENV=%NODE_ENV%
echo.
echo Starting server...
npm start
pause
