@echo off
chcp 65001 > nul

REM ====================================
REM 安裝所有 npm 套件
REM Install all npm packages
REM ====================================

echo [1/6] Installing root directory packages...
echo 安裝根目錄套件...
call npm install
echo.

echo [2/6] Installing client packages...
echo 安裝 client 套件...
cd client
call npm install
cd ..
echo.

echo [2.1/6] Installing backend packages...
echo 安裝 backend 套件...
cd backend
call npm install
cd ..
echo.

echo [3/6] Installing docs packages...
echo 安裝 docs 套件...
cd docs
call npm install
cd ..
echo.

echo [4/6] Installing log-server packages...
echo 安裝 log-server 套件...
cd log-server
call npm install
cd ..
echo.

echo [5/6] Installing cms-server packages...
echo 安裝 cms-server 套件...
cd cms-server
call npm install
cd ..
echo.

echo [6/6] Installing rust-axum packages...
echo 安裝 rust-axum 套件...
cd rust-axum
call npm install
cd ..
echo.



echo ====================================
echo All packages installed successfully!
echo 所有套件安裝完成！
echo ====================================
pause