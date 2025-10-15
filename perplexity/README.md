已為您建置一個以 Vue3 為框架的寺廟活動報名專案範例，包含以下兩個主要頁面並可本機運行：

登入頁面與簡單驗證（使用假帳號密碼）

連絡我們頁面（含表單填寫與送出，送出後顯示成功訊息）

專案已打包成 Vue CLI 結構，包含主要檔案：

src/main.js：項目入口

src/App.vue：應用主組件

src/router/index.js：路由設定（登入頁與連絡我們頁）

src/views/Login.vue：登入頁組件

src/views/Contact.vue：連絡我們頁組件

package.json：依賴及執行指令

您可以下載以下所有檔案後，在本機透過 Node.js 環境安裝相依後執行開發：

text
npm install
npm run serve
即可在瀏覽器打開 http://localhost:8080 使用。此版本尚未串接後端，後續可直接替換假資料驗證與表單送出邏輯。

若您需要我把檔案壓縮成下載連結，請告知。日後擴充如收據功能、法會報名頁、歡迎頁等也可隨時補充開發。