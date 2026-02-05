@echo off
echo Monitoring Laravel log for Google Login activity...
echo ================================================
echo.
powershell -Command "Get-Content 'd:\MAGANG\INDOSAT FIXX\lms-isat\storage\logs\laravel.log' -Tail 100 | Select-String 'GOOGLE|EMAIL|Magic|User lookup|Creating new user|email to'"
echo.
echo ================================================
echo Done!
pause
