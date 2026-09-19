-- CreateTable
CREATE TABLE "fantasy_leagues" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fantasy_leagues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fantasy_league_members" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fantasy_league_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fantasy_leagues_code_key" ON "fantasy_leagues"("code");

-- CreateIndex
CREATE INDEX "fantasy_leagues_ownerId_idx" ON "fantasy_leagues"("ownerId");

-- CreateIndex
CREATE INDEX "fantasy_league_members_userId_idx" ON "fantasy_league_members"("userId");

-- CreateIndex
CREATE INDEX "fantasy_league_members_leagueId_idx" ON "fantasy_league_members"("leagueId");

-- CreateIndex
CREATE UNIQUE INDEX "fantasy_league_members_leagueId_userId_key" ON "fantasy_league_members"("leagueId", "userId");

-- AddForeignKey
ALTER TABLE "fantasy_leagues" ADD CONSTRAINT "fantasy_leagues_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "fantasy_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fantasy_league_members" ADD CONSTRAINT "fantasy_league_members_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "fantasy_leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fantasy_league_members" ADD CONSTRAINT "fantasy_league_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "fantasy_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

