# zhengkuo-behappy
A zhengkuo-behappy project for client and server apps

## frontent
/client 消災超度登記系統

## backend
/server 資料串接API

## dev:full in root folder
npm run dev:full

## look tree
tree -L 3 -I "node_modules|.git|dist" ./client > client-tree.txt
tree -L 2 -I "node_modules|.git|dist" ./server > server-tree.txt

# 上版
## 1. 切換到部署分支
git checkout zk-client-netlify

## 2. 重設為與 v0-13 相同的內容
git reset --hard zk-client-v1-1123

## 3. 推送覆蓋遠端（⚠️小心使用）
git push origin zk-client-netlify --force

## 把分支移回 reset 前的 commit
git reset --hard 9ac12b1
這樣 zk-client-netlify 就會恢復成 reset 前的內容。
若遠端也被 force push 過，需要推回去
git push origin zk-client-netlify --force