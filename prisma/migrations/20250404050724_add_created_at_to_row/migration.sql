/*
  Warnings:

  - Made the column `updatedAt` on table `Row` required. This step will fail if there are existing NULL values in that column.

*/
-- 1. Set default value
ALTER TABLE "Row" ALTER COLUMN "updatedAt" SET DEFAULT now();

-- 2. Backfill existing nulls (if any)
UPDATE "Row" SET "updatedAt" = now() WHERE "updatedAt" IS NULL;

-- 3. Now safely enforce NOT NULL
ALTER TABLE "Row" ALTER COLUMN "updatedAt" SET NOT NULL;
