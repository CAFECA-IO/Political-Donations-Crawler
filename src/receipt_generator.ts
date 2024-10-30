import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { createCanvas } from "canvas";

const getRecords = async (
  minId?: number,
  maxId?: number,
  type?: string,
  limit?: number
) => {
  const prisma = new PrismaClient();
  const whereCondition: any = {}; // Info: (20240911 - tzuhan) 動態構建 where 條件

  if (minId !== undefined) {
    whereCondition.id = { ...whereCondition.id, gte: minId }; // Info: (20240911 - tzuhan) 添加大於等於 minId 的條件
  }

  if (maxId !== undefined) {
    whereCondition.id = { ...whereCondition.id, lte: maxId }; // Info: (20240911 - tzuhan) 添加小於等於 maxId 的條件
  }

  if (type) {
    whereCondition.income_expenditure = { in: [type] }; // Info: (20240911 - tzuhan) 只查詢 income 或 expenditure 的記錄
  }

  const records = await prisma.income_expenditure.findMany({
    where: Object.keys(whereCondition).length ? whereCondition : undefined, // Info: (20240911 - tzuhan) 如果有條件則使用，否則不過濾
    take: limit, // Info: (20240911 - tzuhan) 限制返回的記錄數量
    orderBy: {
      id: "asc", // Info: (20240911 - tzuhan) 按照 ID 升序排序
    },
  });

  prisma.$disconnect();

  return records;
};

const wrapText = (
  context: any,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) => {
  let line = ""; // Info: (20240912 - tzuhan) 當前行的文字
  for (let i = 0; i < text.length; i++) {
    const testLine = line + text[i]; // Info: (20240912 - tzuhan) 將當前字元添加到測試行
    const metrics = context.measureText(testLine); // Info: (20240912 - tzuhan) 測量行寬
    const testWidth = metrics.width;

    if (testWidth > maxWidth && line.length > 0) {
      // Info: (20240912 - tzuhan) 如果當前行超過最大寬度，則繪製當前行並換行
      context.fillText(line, x, y);
      line = text[i]; // Info: (20240912 - tzuhan) 將當前字元作為新行的開始
      y += lineHeight; // Info: (20240912 - tzuhan) 換行
    } else {
      line = testLine; // Info: (20240912 - tzuhan) 不超過寬度，繼續添加字元到行
    }
  }
  // Info: (20240912 - tzuhan) 繪製最後一行
  context.fillText(line, x, y);
  return y; // Info: (20240912 - tzuhan) 返回新的 Y 座標
};

const generateAndSaveReceiptAsJPEG = async (record: any) => {
  console.log(`生成id: ${record.id} 交易的 JPEG 收據...`, record);

  // Info: (20240912 - tzuhan) 設定圖像大小
  const width = 600;
  const height = 800;

  // Info: (20240912 - tzuhan) 創建 Canvas
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");

  // Info: (20240912 - tzuhan) 設置背景顏色
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, width, height);

  // Info: (20240912 - tzuhan) 設置字體和樣式
  context.font = "14px Arial";
  context.fillStyle = "#000000";

  // Info: (20240912 - tzuhan) 畫表格邊框和標題
  const tableStartX = 50;
  const tableWidth = width - 100;
  const colWidth = tableWidth / 2;
  const rowHeight = 30;
  let currentY = 100;

  // Info: (20240912 - tzuhan) 繪製標題
  const drawMergedTitle = (title: string, y: number) => {
    // Info: (20240912 - tzuhan) 畫合併單元格的邊框
    context.strokeRect(tableStartX, y, tableWidth, rowHeight);
    // Info: (20240912 - tzuhan) 繪製標題文字
    context.fillText(
      title,
      tableStartX + tableWidth / 2 - context.measureText(title).width / 2,
      y + 20
    );
  };

  // Info: (20240912 - tzuhan) 繪製表格邊框和內容
  const drawTableRow = (label: string, value: string, y: number) => {
    const maxWidth = colWidth - 20; // Info: (20240912 - tzuhan) 單元格內容的最大寬度

    // Info: (20240912 - tzuhan) 測量標籤和內容的行數
    const labelLines = Math.ceil(context.measureText(label).width / maxWidth);
    const valueLines = Math.ceil(context.measureText(value).width / maxWidth);

    // Info: (20240912 - tzuhan) 取最大行數來計算行高
    const rowLineCount = Math.max(labelLines, valueLines);
    const dynamicRowHeight = rowLineCount * rowHeight;

    // Info: (20240912 - tzuhan) 左邊的標籤單元格
    context.strokeRect(tableStartX, y, colWidth, dynamicRowHeight);
    context.fillText(label, tableStartX + 10, y + 20);

    context.strokeRect(tableStartX + colWidth, y, colWidth, dynamicRowHeight);
    const wrappedY = wrapText(
      context,
      value,
      tableStartX + colWidth + 10,
      y + 20,
      colWidth - 20,
      20
    );

    return dynamicRowHeight; // Info: (20240912 - tzuhan) 更新 Y 座標
  };

  let dynamicRowHeight = rowHeight;
  if (record.income_expenditure === "income") {
    drawMergedTitle("擬參選人政治獻金受贈收據（金錢部分）", currentY);
    currentY += rowHeight;

    // Info: (20240912 - tzuhan) 捐贈者信息表格
    dynamicRowHeight = drawTableRow("支出/收入", "收入", currentY);
    currentY += dynamicRowHeight;
    dynamicRowHeight = drawTableRow("捐贈者姓名", record.donor_recipient, currentY);
    currentY += dynamicRowHeight;
    dynamicRowHeight = drawTableRow("身分證號碼", record.id_number || "N/A", currentY);
    currentY += dynamicRowHeight;
    dynamicRowHeight = drawTableRow("地址", record.address || "N/A", currentY);
    currentY += dynamicRowHeight;
    dynamicRowHeight = drawTableRow("電話號碼", record.contact_phone || "N/A", currentY);
    currentY += dynamicRowHeight;
    dynamicRowHeight = drawTableRow("捐贈金額", `新臺幣 ${record.income_amount} 元整`, currentY);
    currentY += dynamicRowHeight;
    dynamicRowHeight = drawTableRow("捐贈方式", record.donation_method, currentY);
    currentY += dynamicRowHeight;
    dynamicRowHeight = drawTableRow("存入專戶日期", record.deposit_date, currentY);
    currentY += dynamicRowHeight;
  } else if (record.income_expenditure === "expenditure") {
    drawMergedTitle("擬參選人政治支出收據", currentY);
    currentY += dynamicRowHeight;

    dynamicRowHeight = drawTableRow("支出/收入", "支出", currentY);
    currentY += dynamicRowHeight;
    dynamicRowHeight = drawTableRow("支出對象", record.donor_recipient, currentY);
    currentY += dynamicRowHeight;
    dynamicRowHeight = drawTableRow("地址", record.address || "N/A", currentY);
    currentY += dynamicRowHeight;
    dynamicRowHeight = drawTableRow("電話號碼", record.contact_phone || "N/A", currentY);
    currentY += dynamicRowHeight;
    dynamicRowHeight = drawTableRow(
      "支出金額",
      `新臺幣 ${record.expenditure_amount} 元整`,
      currentY
    );
    currentY += dynamicRowHeight;
    dynamicRowHeight = drawTableRow("支出用途", record.expenditure_purpose || "N/A", currentY);
    currentY += dynamicRowHeight;
    dynamicRowHeight = drawTableRow("交易日期", record.transaction_date, currentY);
    currentY += dynamicRowHeight;
    dynamicRowHeight = drawTableRow("返還/繳庫", record.return_treasury || "N/A", currentY);
    currentY += dynamicRowHeight;
  }

  // Info: (20240912 - tzuhan) 收支科目、金錢類等表格
  dynamicRowHeight = drawTableRow(
    "收支科目",
    record.income_expenditure_category || "N/A",
    currentY
  );
  currentY += dynamicRowHeight;
  dynamicRowHeight = drawTableRow("金錢類", record.monetary_type || "N/A", currentY);
  currentY += dynamicRowHeight;
  dynamicRowHeight = drawTableRow("更正註記", record.correction_note || "N/A", currentY);
  currentY += dynamicRowHeight;
  dynamicRowHeight = drawTableRow("資料更正日期", record.correction_date || "N/A", currentY);
  currentY += dynamicRowHeight;

  // Info: (20240912 - tzuhan) 擬參選人簽章
  drawMergedTitle("擬參選人", currentY);
  currentY += dynamicRowHeight;
  dynamicRowHeight = drawTableRow("候選人/政黨", record.candidate_party, currentY);
  currentY += dynamicRowHeight;
  dynamicRowHeight = drawTableRow("選舉名稱", record.election_name, currentY);
  currentY += dynamicRowHeight;
  dynamicRowHeight = drawTableRow("申報序號/年度", record.declaration_number_year, currentY);
  currentY += dynamicRowHeight;

  context.fillText(
    "擬參選人簽章：_________________",
    tableStartX + 10,
    currentY + 20
  );


  // Info: (20241028 - tzuhan) 根據收入或支出分類到相應資料夾，並按候選人分開
  const folderType = record.income_expenditure === "income" ? "收入" : "支出";
  const candidateFolder = record.candidate_party || "unknown_candidate";
  const outputDir = path.join(__dirname, "收據", folderType, candidateFolder);

  // Info: (20241028 - tzuhan) 確保資料夾存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const jpegPath = path.join(
    outputDir,
    `receipt_${record.income_expenditure}_${record.id}.jpeg`
  );

  // Info: (20241028 - tzuhan) 保存圖像為 JPEG
  const buffer = canvas.toBuffer("image/jpeg");
  fs.writeFileSync(jpegPath, buffer);

  // Info: (20241028 - tzuhan) Deprecated: (20240914 - tzuhan) dev 用
  console.log(`JPEG 收據已保存至: ${jpegPath}`);
};

// Info: (20240911 - tzuhan) 新增 ReceiptSync 資料表的記錄
const recordSyncStatus = async (
  prisma: PrismaClient,
  startId: number,
  endId: number
) => {
  await prisma.receipt_sync.create({
    data: {
      startId,
      endId,
      syncTime: new Date(),
    },
  });
};

// Info: (20240911 - tzuhan) 批次處理函數，每次處理1000筆記錄
const batchProcessReceipts = async (batchSize = 1000, restTime = 5000) => {
  const prisma = new PrismaClient();

  const lastSyncRecord = await prisma.receipt_sync.findFirst({
    orderBy: { endId: "desc" },
  });
  let lastProcessedId = lastSyncRecord?.endId || 0; // Info: (20240911 - tzuhan) 從已同步的最大 endId 開始處理

  // Info: (20240911 - tzuhan) 找到資料庫中最新的 income_expenditure id
  const latestRecord = await prisma.income_expenditure.findFirst({
    orderBy: { id: "desc" },
  });
  const maxId = latestRecord?.id || 0;

  while (lastProcessedId < maxId) {
  const records = await prisma.income_expenditure.findMany({
    where: { id: { gt: lastProcessedId } },
    orderBy: { id: "asc" },
    take: batchSize,
  });

  if (records.length === 0) break;

  const startId = records[0].id;
  const endId = records[records.length - 1].id;

  // Info: (20240911 - tzuhan) 處理並保存收據
  for (let record of records) {
    await generateAndSaveReceiptAsJPEG(record);
  }

  // Info: (20240911 - tzuhan) 記錄同步狀態
  await recordSyncStatus(prisma, startId, endId);
  lastProcessedId = endId;

  // Deprecated: (20240914 - tzuhan) dev 用
  console.log(`已處理記錄範圍: ${startId} - ${endId}`);

  // Info: (20240911 - tzuhan) 每批次後休息 1 分鐘
  await new Promise((resolve) => setTimeout(resolve, restTime));
  }

  console.log("所有資料處理完畢。");
  prisma.$disconnect();
};

// Info: (20240911 - tzuhan) 啟動批次處理
batchProcessReceipts();

