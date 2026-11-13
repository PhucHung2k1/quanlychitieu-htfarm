@echo off
chcp 65001 > nul
title HT FARM Quan Ly Chi Tieu - Quick Production Deploy
echo ========================================================
echo   HT FARM Quan Ly Chi Tieu - Deploy nhanh len Production
echo   Domain : https://chitieu.htfarm.vn
echo ========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\deploy-production.ps1" %*
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if "%EXIT_CODE%"=="0" (
    echo [THANH CONG] Da deploy ban moi len https://chitieu.htfarm.vn
) else (
    echo [THAT BAI] Deploy dung lai voi ma loi %EXIT_CODE%. Vui long kiem tra log o tren.
)
echo.
pause
exit /b %EXIT_CODE%
