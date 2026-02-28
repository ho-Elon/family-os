@echo off
echo Copying latest files from Downloads...
for %%f in ("%USERPROFILE%\Downloads\index*.html") do set "LATEST_HTML=%%f"
copy "%LATEST_HTML%" "%~dp0index.html" /Y
for %%f in ("%USERPROFILE%\Downloads\quote*.js") do set "LATEST_QUOTE=%%f"
copy "%LATEST_QUOTE%" "%~dp0api\quote.js" /Y
for %%f in ("%USERPROFILE%\Downloads\meals*.js") do set "LATEST_MEALS=%%f"
copy "%LATEST_MEALS%" "%~dp0api\meals.js" /Y
cd /d "%~dp0"
git add .
git commit -m "update from Claude"
git push
echo Done! Check app.lengleng.com
pause