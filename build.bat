@echo off
set PATH=D:\msys64\mingw64\bin;%PATH%
set CC=gcc.exe
set TARGET_CC=gcc.exe
set TARGET_AR=ar.exe
set MSYS2_PATH_TYPE=inherit
cargo %*