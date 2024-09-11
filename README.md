# Political-Donations-Crawler
政治捐款爬蟲是一個自動化工具，用於從政府公開的資料來源中收集政治捐款的收支數據。本政治捐款爬蟲關鍵字為“113年總統、副總統選舉”，此份文件將說明如何完成政治捐款爬蟲的環境準備與部署使用。

## 部署流程
1. [環境準備](#環境準備)
2. [安裝流程](#安裝流程)
3. [啟動指令](#啟動指令)

### 環境準備
請確保您的系統滿足以下最低要求：
- Ubuntu 22.04
- 1 Core CPU
- 2 GB Ram
- 20 GB Disk Space

### 安裝流程

#### 設置編譯環境
- 安裝 Git

#### 使用 sudo 在根目錄下創建一個 workspace 目錄
```bash
sudo mkdir /workspace
```

#### 將 /workspace 的所有者更改為當前用戶
```bash
sudo chown -R ${user} /workspace
```

#### 進入 workspace 目錄
```bash
cd /workspace
```

#### 從 GitHub 下載專案
```bash
git clone https://github.com/CAFECA-IO/Political-Donations-Crawler
```

#### 進入 Political-Donations-Crawler 專案目錄
```bash
cd Political-Donations-Crawler
```

#### 安裝專案所需的函式庫 
```bash
npm install
```

#### 建立資料庫及資料表
```bash
npx prisma migrate reset
```


#### 不需另外設定 .env
本專案 db 會存於專案目錄下的 prisma 資料夾中，不需另外設定 .env 中的 DATABASE_URL

### 啟動指令
- 1. 啟動爬蟲
```bash
npm run start:crawler
```
此指令會執行 crawler.ts 檔案，自動於[監察院政治獻金公開查閱平台](https://ardata.cy.gov.tw/home)中之「選舉查詢」輸入關鍵字「113年總統、副總統選舉」查詢，並將查詢結果之「會計報告書下載」.CSV 壓縮檔
下載及解壓縮存入專案目錄下的  src/downloads 資料夾中。成功執行後會看到「爬取資料並解壓縮完成！」提示。

- 2. 匯入爬蟲資料
```bash
npm run start:import
```
資料庫使用 sqlite，此指令會執行 import_csv.ts 檔案，將 src/downloads 資料夾中的 incomes.csv 及 expenditures.csv 檔案資料解析後存入至專案目錄下的 prisma 資料夾中的 db 中。會先執行「支出資料」再執行「收入資料」，成功解析完成後會看到「支出資料匯入完成」、「收入資料匯入完成」提示。

解析完成後即可於 donations.db 中查看資料庫的資料。
