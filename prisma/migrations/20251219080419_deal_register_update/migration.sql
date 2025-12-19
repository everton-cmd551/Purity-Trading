/*
  Warnings:

  - You are about to alter the column `quantity` on the `Deal` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - Added the required column `expectedGrossMargin` to the `Deal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expectedMarginPercentage` to the `Deal` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Deal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "commodityId" TEXT NOT NULL,
    "commodityGrade" TEXT,
    "supplierId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "financierId" TEXT,
    "quantity" DECIMAL NOT NULL,
    "supplierPricePerTon" DECIMAL NOT NULL,
    "offtakePricePerTon" DECIMAL NOT NULL,
    "costValue" DECIMAL NOT NULL,
    "expectedSalesValue" DECIMAL NOT NULL,
    "expectedGrossMargin" DECIMAL NOT NULL,
    "expectedMarginPercentage" DECIMAL NOT NULL,
    "paymentTermsCustomer" INTEGER,
    "paymentTermsFinancier" INTEGER,
    "dealOwner" TEXT,
    "comments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Deal_commodityId_fkey" FOREIGN KEY ("commodityId") REFERENCES "Commodity" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Deal_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Deal_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Deal_financierId_fkey" FOREIGN KEY ("financierId") REFERENCES "Financier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Deal" ("commodityId", "costValue", "createdAt", "customerId", "date", "expectedSalesValue", "financierId", "id", "offtakePricePerTon", "quantity", "status", "supplierId", "supplierPricePerTon", "updatedAt") SELECT "commodityId", "costValue", "createdAt", "customerId", "date", "expectedSalesValue", "financierId", "id", "offtakePricePerTon", "quantity", "status", "supplierId", "supplierPricePerTon", "updatedAt" FROM "Deal";
DROP TABLE "Deal";
ALTER TABLE "new_Deal" RENAME TO "Deal";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
