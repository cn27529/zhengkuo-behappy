@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo 安裝根目錄套件...
call npm install

echo 安裝 client 套件...
cd client
call npm install
cd ..

echo 安裝 docs 套件...
cd docs
call npm install
cd ..

echo 安裝 log-server 套件...
cd log-server
call npm install
cd ..

echo 安裝 server 套件...
cd server
call npm install
cd ..

echo 安裝 rust-axum 套件...
cd rust-axum
call npm install
cd ..

echo 所有套件安裝完成！
pause