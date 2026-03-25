@echo off
REM MotionBastard — One-click installer for Windows
REM Run this as Administrator

set INSTALL_DIR=C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\motion-ai-panel
set REPO_URL=https://github.com/BerlinKing/MotionBastard.git
set CSI_URL=https://raw.githubusercontent.com/nickvdh/cep-resources/main/CSInterface_12.js

echo.
echo  MotionBastard Installer
echo ==========================
echo.

REM 1. Clone repo
if exist "%INSTALL_DIR%" (
    echo Updating existing installation...
    cd /d "%INSTALL_DIR%"
    git pull origin main
) else (
    echo Installing to %INSTALL_DIR% ...
    git clone "%REPO_URL%" "%INSTALL_DIR%"
)

REM 2. Download CSInterface.js
echo Downloading Adobe CSInterface.js...
curl -sL "%CSI_URL%" -o "%INSTALL_DIR%\js\CSInterface.js"

REM 3. Enable unsigned extensions
echo Enabling unsigned CEP extensions...
reg add "HKCU\Software\Adobe\CSXS.12" /v PlayerDebugMode /t REG_DWORD /d 1 /f

echo.
echo Done! Now:
echo   1. Restart After Effects
echo   2. Go to Window - Extensions - Motion AI Assistant
echo   3. Click Settings - Paste your API key - Save
echo.
echo Get an API key at: https://openrouter.ai/settings/keys
echo.
pause
