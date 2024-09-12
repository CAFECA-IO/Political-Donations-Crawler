import { PrismaClient } from "@prisma/client";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";

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

const generateAndSaveReceipt = async (record: any) => {
  console.log(
    `生成id: ${record.id} 交易的 PDF 收據..., typeof record: ${typeof record}, record: `,
    record
  );

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const fontBytes = fs.readFileSync(
    path.join(__dirname, "assets/fonts/source_han_sans_tw_regular.otf")
  );
  const customFont = await pdfDoc.embedFont(fontBytes);

  const page = pdfDoc.addPage([600, 800]);
  const { width, height } = page.getSize();
  const fontSize = 10;

  let currentY = height - 50;
  const tableStartX = 50;
  const tableWidth = width - 100;
  const colWidth = tableWidth / 2;
  const rowHeight = 25;

  // Info: (20240911 - tzuhan) 繪製單元格的邊框
  const drawCellBorder = (
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    page.drawRectangle({
      x,
      y,
      width,
      height,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });
  };

  // Info: (20240911 - tzuhan) 合併標題的單元格
  const drawMergedTitle = (title: string, y: number) => {
    drawCellBorder(tableStartX, y, tableWidth, rowHeight); // Info: (20240911 - tzuhan) 繪製整行的邊框
    page.drawText(title, {
      x: tableStartX + tableWidth / 2 - 100, // Info: (20240911 - tzuhan) 調整標題位置，使其居中
      y: y + 8,
      size: 12,
      font: customFont,
      color: rgb(0, 0, 0),
    });
  };

  let fields: { label: string; value: string }[] = [];
  if (record.income_expenditure === "income") {
    // Info: (20240911 - tzuhan) 第一行標題合併（捐贈者信息）
    drawMergedTitle("擬參選人政治獻金受贈收據（金錢部分）", currentY);
    currentY -= rowHeight;

    // Info: (20240911 - tzuhan) 第一個表格：捐贈者信息
    fields = [
      { label: "支出/收入", value: "收入" },
      { label: "捐贈者姓名", value: record.donor_recipient },
      { label: "身分證號碼", value: record.id_number || "N/A" },
      { label: "地址", value: record.address || "N/A" },
      { label: "電話號碼", value: record.contact_phone || "N/A" },
      { label: "捐贈金額", value: `新臺幣 ${record.income_amount} 元整` },
      { label: "捐贈方式", value: record.donation_method },
      { label: "存入專戶日期", value: record.deposit_date },
    ];
  } else if (record.income_expenditure === "expenditure") {
    // Info: (20240911 - tzuhan) 第一行標題合併（捐贈者信息）
    drawMergedTitle("擬參選人政治支出收據", currentY);
    currentY -= rowHeight;

    fields = [
      { label: "支出/收入", value: "支出" },
      // Info: (20240911 - tzuhan) { label: "應揭露之支出對象", value: record.disclosed_recipient || "否" },
      { label: "支出對象", value: record.donor_recipient },
      { label: "地址", value: record.address || "N/A" },
      { label: "電話號碼", value: record.contact_phone || "N/A" },
      { label: "支出金額", value: `新臺幣 ${record.expenditure_amount} 元整` },
      { label: "支出用途", value: record.expenditure_purpose || "N/A" },
      { label: "交易日期", value: record.transaction_date },
      { label: "返還/繳庫", value: record.return_treasury || "N/A" },
    ];
  }

  fields = [
    ...fields,
    { label: "收支科目", value: record.income_expenditure_category || "N/A" },
    { label: "金錢類", value: record.monetary_type || "N/A" },
    /** Info: (20240911 - tzuhan) 以下欄位暫時不顯示
    { label: "內部人員姓名", value: record.recipient_internal_name || "N/A" },
    { label: "內部人員職稱", value: record.recipient_internal_title || "N/A" },
    { label: "政黨內部人員姓名", value: record.party_internal_name || "N/A" },
    { label: "政黨內部人員職稱", value: record.party_internal_title || "N/A" },
    { label: "關係", value: record.relationship || "N/A" },
    */
    { label: "更正註記", value: record.correction_note || "N/A" },
    { label: "資料更正日期", value: record.correction_date || "N/A" },
  ];

  fields.forEach((field) => {
    drawCellBorder(tableStartX, currentY, colWidth, rowHeight);
    page.drawText(`${field.label}:`, {
      x: tableStartX + 5,
      y: currentY + 8,
      size: fontSize,
      font: customFont,
      color: rgb(0, 0, 0),
    });

    drawCellBorder(tableStartX + colWidth, currentY, colWidth, rowHeight);
    page.drawText(field.value, {
      x: tableStartX + colWidth + 5,
      y: currentY + 8,
      size: fontSize,
      font: customFont,
      color: rgb(0, 0, 0),
    });

    currentY -= rowHeight;
  });

  // Info: (20240911 - tzuhan) 空一行作為分隔
  currentY -= rowHeight;

  // Info: (20240911 - tzuhan) 第二行標題合併（參選人信息）
  drawMergedTitle("擬參選人", currentY);
  currentY -= rowHeight;

  // Info: (20240911 - tzuhan) 第二個表格：參選人資訊
  const candidateFields = [
    { label: "候選人/政黨", value: record.candidate_party },
    { label: "選舉名稱", value: record.election_name },
    { label: "申報序號/年度", value: record.declaration_number_year },
  ];

  candidateFields.forEach((field) => {
    drawCellBorder(tableStartX, currentY, colWidth, rowHeight);
    page.drawText(`${field.label}:`, {
      x: tableStartX + 5,
      y: currentY + 8,
      size: fontSize,
      font: customFont,
      color: rgb(0, 0, 0),
    });

    drawCellBorder(tableStartX + colWidth, currentY, colWidth, rowHeight);
    page.drawText(field.value, {
      x: tableStartX + colWidth + 5,
      y: currentY + 8,
      size: fontSize,
      font: customFont,
      color: rgb(0, 0, 0),
    });

    currentY -= rowHeight;
  });

  // Info: (20240911 - tzuhan) 添加簽名區域
  drawCellBorder(tableStartX, currentY, colWidth * 2, rowHeight);
  page.drawText("擬參選人簽章：_________________", {
    x: tableStartX + 5,
    y: currentY + 8,
    size: fontSize,
    font: customFont,
    color: rgb(0, 0, 0),
  });

  // Info: (20240911 - tzuhan) 保存收據
  const outputDir = path.join(__dirname, "receipts");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const outputPath = path.join(outputDir, `receipt_${record.income_expenditure
    
  }_${record.id}.pdf`);
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);

  console.log(`收入收據已保存至: ${outputPath}`);
};


// Info: (20240911 - tzuhan) 新增 ReceiptSync 資料表的記錄
const recordSyncStatus = async (prisma: PrismaClient, startId: number, endId: number) => {
  await prisma.receipt_sync.create({
    data: {
      startId,
      endId,
      syncTime: new Date(),
    },
  });
};

// Info: (20240911 - tzuhan) 批次處理函數，每次處理1000筆記錄
const batchProcessReceipts = async (batchSize = 1000) => {
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
      await generateAndSaveReceipt(record);
    }

    // Info: (20240911 - tzuhan) 記錄同步狀態
    await recordSyncStatus(prisma, startId, endId);
    lastProcessedId = endId;

    console.log(`已處理記錄範圍: ${startId} - ${endId}`);

    // Info: (20240911 - tzuhan) 每批次後休息 1 分鐘
    await new Promise((resolve) => setTimeout(resolve, 60000));
  }

  console.log("所有資料處理完畢。");
  prisma.$disconnect();
};

// Info: (20240911 - tzuhan) 啟動批次處理
batchProcessReceipts();


