-- CreateTable
CREATE TABLE "receipt_sync" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startId" INTEGER NOT NULL,
    "endId" INTEGER NOT NULL,
    "syncTime" DATETIME NOT NULL
);
