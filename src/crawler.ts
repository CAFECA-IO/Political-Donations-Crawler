import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';

const searchKeyword = async (url: string, keyword: string) => {
  console.log('開始爬取資料...');
  const browser = await puppeteer.launch({ headless: false }); // 設置 headless: false 以便看到操作過程
  const page = await browser.newPage();

  // 設定下載目錄
  const downloadPath = path.resolve(__dirname, 'downloads');
  fs.mkdirSync(downloadPath, { recursive: true });

  // 使用 createCDPSession 設置下載行為
  const client = await page.createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath
  });

  await page.goto(url, { waitUntil: 'networkidle2' });

  const validateCodeSelector = 'body > ngb-modal-window > div > div > div.modal-body > div.form-inline > div > label > kbd'
  await page.waitForSelector(validateCodeSelector);

  // 獲取驗證碼文本
  const validateCode = await page.evaluate((selector) => {
    const element = document.querySelector(selector);
    if (element && element instanceof HTMLElement) {
      return element.innerText;
    }
    return ''; // 如果找不到元素，返回空字符串
  }, validateCodeSelector);

  // 輸入驗證碼並按下「同意」按鈕
  await page.keyboard.type(validateCode);
  
  const agreeButtonSelector = 'body > ngb-modal-window > div > div > div.modal-footer.p-0 > button';
  await page.click(agreeButtonSelector);
  
  // 等待「同意」按鈕消失
  await page.waitForSelector('button.btn-brown', { hidden: true, timeout: 0 });

  // 確保選舉查詢元素可見並點擊
  const electionSelector = 'body > app-root > app-home > div.grey.lighten-4.mb-4 > div > div:nth-child(1) > div:nth-child(3) > a';
  await page.click(electionSelector);

  // 等待搜索框出現
  await page.waitForSelector('input[placeholder="選舉名稱關鍵字"]');

  // 在搜索框中輸入關鍵字
  await page.type('input[placeholder="選舉名稱關鍵字"]', keyword);

  // 點擊搜索按鈕
  const searchButtonSelector = 'body > app-root > app-search-election > div > div.row.mb-3 > div > div > div > div.input-group > div > div > button';
  await page.click(searchButtonSelector);

  // 下載搜尋結果並解壓縮
  const downloadSelector = 'body > app-root > app-search-election > div > div:nth-child(2) > div > div > app-search-detail-table > div > div > div.row > div > div > table > tbody > tr > td:nth-child(6) > div > a';
  // 等待搜索結果出現並點擊
  await page.waitForSelector(downloadSelector);
  await page.click(downloadSelector);

  // 使用 setTimeout 增加延遲以確保下載完成
  await new Promise(resolve => setTimeout(resolve, 6000)); // 等待 6 秒

  // 解壓縮下載的文件
  const files = fs.readdirSync(downloadPath);
  for (const file of files) {
    if (file.endsWith('.zip')) {
      const filePath = path.join(downloadPath, file);
      fs.createReadStream(filePath)
        .pipe(unzipper.Extract({ path: downloadPath }))
        .on('close', () => {
          console.log(`已解壓縮文件: ${file}`);
        });
    }
  }

  await browser.close();
  console.log('爬取資料並解壓縮完成！');
};

// 使用範例
const url = 'https://ardata.cy.gov.tw/home';
const keyword = '113年總統、副總統選舉';
searchKeyword(url, keyword).catch(console.error);
