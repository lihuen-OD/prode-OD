-- CreateEnum
DO $$
BEGIN
  CREATE TYPE "MatchPhase" AS ENUM ('GROUP', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$
BEGIN
  CREATE TYPE "PredictionType" AS ENUM ('RESULT_1X2', 'QUALIFIER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterEnum
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'MatchStatus' AND e.enumlabel = 'SCHEDULED'
  ) THEN
    CREATE TYPE "MatchStatus_new" AS ENUM ('OPEN', 'LOCKED', 'FINISHED');
    ALTER TABLE "public"."Match" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "Match" ALTER COLUMN "status" TYPE "MatchStatus_new" USING (
      CASE "status"::text
        WHEN 'SCHEDULED' THEN 'OPEN'
        WHEN 'LIVE' THEN 'LOCKED'
        ELSE "status"::text
      END::"MatchStatus_new"
    );
    ALTER TYPE "MatchStatus" RENAME TO "MatchStatus_old";
    ALTER TYPE "MatchStatus_new" RENAME TO "MatchStatus";
    DROP TYPE "public"."MatchStatus_old";
    ALTER TABLE "Match" ALTER COLUMN "status" SET DEFAULT 'OPEN';
  ELSE
    ALTER TABLE "Match" ALTER COLUMN "status" SET DEFAULT 'OPEN';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    ALTER TABLE "Match" ALTER COLUMN "status" SET DEFAULT 'OPEN';
END $$;

-- DropIndex
DROP INDEX IF EXISTS "User_paymentStatus_idx";

-- AlterTable
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "awayPlaceholder" TEXT;
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "awayScore" INTEGER;
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "homePlaceholder" TEXT;
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "homeScore" INTEGER;
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "phase" "MatchPhase" NOT NULL DEFAULT 'GROUP';
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "predictionDeadline" TIMESTAMP(3);
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "predictionType" "PredictionType" NOT NULL DEFAULT 'RESULT_1X2';
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "winnerTeamId" TEXT;
ALTER TABLE "Match" ALTER COLUMN "groupName" DROP NOT NULL;
ALTER TABLE "Match" ALTER COLUMN "status" SET DEFAULT 'OPEN';

UPDATE "Match"
SET "predictionDeadline" = "matchDate" - INTERVAL '5 minutes'
WHERE "predictionDeadline" IS NULL;

ALTER TABLE "Match" ALTER COLUMN "predictionDeadline" SET NOT NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Match_predictionDeadline_idx" ON "Match"("predictionDeadline");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Match_phase_idx" ON "Match"("phase");

-- AddForeignKey
DO $$
BEGIN
  ALTER TABLE "Match" ADD CONSTRAINT "Match_winnerTeamId_fkey" FOREIGN KEY ("winnerTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
