@echo off
cd C:\Programming\Projects\ment\ment\backend
echo === Running Biome CI for backend ===
npx -y @biomejs/biome@latest ci .
echo.
cd C:\Programming\Projects\ment\ment\frontend-app
echo === Running Biome CI for frontend-app ===
npx -y @biomejs/biome@latest ci .
