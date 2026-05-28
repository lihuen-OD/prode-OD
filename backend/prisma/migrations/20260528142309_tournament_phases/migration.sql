/*
  Warnings:

  - The values [SCHEDULED,LIVE] on the enum `MatchStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `paymentStatus` on the `User` table. All the data in the column will be lost.
  - Added the required column `predictionDeadline` to the `Match` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MatchPhase" AS ENUM ('GROUP', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL');

-- CreateEnum
CREATE TYPE "PredictionType" AS ENUM ('RESULT_1X2', 'QUALIFIER');

-- AlterEnum
BEGIN;
CREATE TYPE "MatchStatus_new" AS ENUM ('OPEN', 'LOCKED', 'FINISHED');
ALTER TABLE "public"."Match" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Match" ALTER COLUMN "status" TYPE "MatchStatus_new" USING ("status"::text::"MatchStatus_new");
ALTER TYPE "MatchStatus" RENAME TO "MatchStatus_old";
ALTER TYPE "MatchStatus_new" RENAME TO "MatchStatus";
DROP TYPE "public"."MatchStatus_old";
ALTER TABLE "Match" ALTER COLUMN "status" SET DEFAULT 'OPEN';
COMMIT;

-- DropIndex
DROP INDEX "User_paymentStatus_idx";

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "awayPlaceholder" TEXT,
ADD COLUMN     "awayScore" INTEGER,
ADD COLUMN     "homePlaceholder" TEXT,
ADD COLUMN     "homeScore" INTEGER,
ADD COLUMN     "phase" "MatchPhase" NOT NULL DEFAULT 'GROUP',
ADD COLUMN     "predictionDeadline" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "predictionType" "PredictionType" NOT NULL DEFAULT 'RESULT_1X2',
ADD COLUMN     "winnerTeamId" TEXT,
ALTER COLUMN "groupName" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "paymentStatus";

-- CreateIndex
CREATE INDEX "Match_predictionDeadline_idx" ON "Match"("predictionDeadline");

-- CreateIndex
CREATE INDEX "Match_phase_idx" ON "Match"("phase");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_winnerTeamId_fkey" FOREIGN KEY ("winnerTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
