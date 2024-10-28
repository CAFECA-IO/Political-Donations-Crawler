import { PrismaClient } from "@prisma/client";

const clearReceiptSyncTable = async () => {
  const prisma = new PrismaClient();
  try {
    await prisma.receipt_sync.deleteMany({});
    // Deprecated: (20240914 - tzuhan) dev 用
    console.log("receipt_sync 表已清空。");
  } catch (error) {
    // Deprecated: (20240914 - tzuhan) dev 用
    console.error("清空 receipt_sync 表時發生錯誤:", error);
  } finally {
    await prisma.$disconnect();
  }
};

clearReceiptSyncTable();
