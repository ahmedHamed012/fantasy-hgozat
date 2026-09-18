-- AlterTable
ALTER TABLE "players" ADD COLUMN     "price" INTEGER NOT NULL DEFAULT 20;

-- CreateTable
CREATE TABLE "fantasy_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fantasy_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fantasy_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "points" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fantasy_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fantasy_picks" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "matchParticipantId" TEXT NOT NULL,
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "fantasy_picks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fantasy_users_email_key" ON "fantasy_users"("email");

-- CreateIndex
CREATE INDEX "fantasy_entries_matchId_idx" ON "fantasy_entries"("matchId");

-- CreateIndex
CREATE INDEX "fantasy_entries_userId_idx" ON "fantasy_entries"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "fantasy_entries_userId_matchId_key" ON "fantasy_entries"("userId", "matchId");

-- CreateIndex
CREATE INDEX "fantasy_picks_entryId_idx" ON "fantasy_picks"("entryId");

-- CreateIndex
CREATE INDEX "fantasy_picks_matchParticipantId_idx" ON "fantasy_picks"("matchParticipantId");

-- CreateIndex
CREATE UNIQUE INDEX "fantasy_picks_entryId_matchParticipantId_key" ON "fantasy_picks"("entryId", "matchParticipantId");

-- AddForeignKey
ALTER TABLE "fantasy_entries" ADD CONSTRAINT "fantasy_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "fantasy_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fantasy_entries" ADD CONSTRAINT "fantasy_entries_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fantasy_picks" ADD CONSTRAINT "fantasy_picks_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "fantasy_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fantasy_picks" ADD CONSTRAINT "fantasy_picks_matchParticipantId_fkey" FOREIGN KEY ("matchParticipantId") REFERENCES "match_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

