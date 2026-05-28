-- Allow knockout matches to be created before real teams are known.
ALTER TABLE "Match" ALTER COLUMN "homeTeamId" DROP NOT NULL;
ALTER TABLE "Match" ALTER COLUMN "awayTeamId" DROP NOT NULL;

-- Keep group metadata only for group-stage matches and keep prediction type aligned.
UPDATE "Match"
SET
  "groupName" = NULL,
  "predictionType" = 'QUALIFIER'
WHERE "phase" <> 'GROUP';

UPDATE "Match"
SET "predictionType" = 'RESULT_1X2'
WHERE "phase" = 'GROUP';

-- Backfill per-match deadlines safely from the stored UTC match date.
UPDATE "Match"
SET "predictionDeadline" = "matchDate" - INTERVAL '5 minutes'
WHERE "predictionDeadline" IS NULL;
