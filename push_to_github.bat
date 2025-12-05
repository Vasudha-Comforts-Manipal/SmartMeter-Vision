@echo off
echo ========================================
echo Pushing SmartMeter Vision to GitHub
echo ========================================
echo.

cd /d "f:\Project\PC-WEB\smartmeter-vision"

echo [1/6] Checking git status...
git status
echo.

echo [2/6] Adding all files...
git add -A
echo.

echo [3/6] Checking what will be committed...
git status --short
echo.

echo [4/6] Committing changes...
git commit -m "Update SmartMeter Vision with latest features and improvements"
echo.

echo [5/6] Setting branch to main...
git branch -M main
echo.

echo [6/6] Pushing to GitHub...
git push -u origin main --force
echo.

echo ========================================
echo Done! Check GitHub: https://github.com/GlT-ignore/SmartMeter-Vision
echo ========================================
pause
