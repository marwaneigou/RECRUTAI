-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "cv_snapshot" JSONB,
ADD COLUMN     "match_analysis" TEXT,
ADD COLUMN     "match_calculated_at" TIMESTAMP(3),
ADD COLUMN     "match_gaps" JSONB,
ADD COLUMN     "match_score" INTEGER,
ADD COLUMN     "match_strengths" JSONB;
