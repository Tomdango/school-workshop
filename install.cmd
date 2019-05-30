@echo off

reg Query "HKLM\Hardware\Description\System\CentralProcessor\0" | find /i "x86" > NUL && set OS=32BIT || set OS=64BIT

IF %OS%==32BIT (
    .\runtime\x86\npm install
)
IF %OS%==64BIT (
    .\runtime\x64\npm install
)
