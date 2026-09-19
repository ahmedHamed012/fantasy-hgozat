/**
 * Development seed.
 *
 * Creates the admin, achievement catalog, priced players, several finished
 * matches, a couple of upcoming (scheduled) matches for fantasy entry, plus a
 * demo fantasy user with a scored entry — enough to demo the whole app
 * (leaderboard, profiles, history, badges, fantasy) immediately. Resets
 * players/matches/fantasy on each run (keeps admin users).
 *
 * Run: npm run db:seed
 */
import { prisma } from '../src/lib/prisma';
import { AuthService } from '../src/services/authService';
import { AchievementService } from '../src/services/achievementService';
import { MatchService } from '../src/services/matchService';
import { FantasyService } from '../src/services/fantasyService';
import { FantasyLeagueService } from '../src/services/fantasyLeagueService';
import { hashPassword } from '../src/lib/password';

// name -> fantasy price (millions LE); cheapest 5 = 88M, so budget bites.
const PLAYERS: [string, number][] = [
  ['Ahmed', 32], ['Karim', 28], ['Omar', 26], ['Hassan', 30], ['Ali', 22], ['Youssef', 20],
  ['Mostafa', 27], ['Amr', 18], ['Mahmoud', 16], ['Tarek', 15], ['Sami', 24], ['Nabil', 19],
];

interface Line { name: string; team: 'A' | 'B'; g?: number; a?: number; s?: number; o?: number }

async function main() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD ?? 'changeme123';
  const admin = await AuthService.upsertAdmin(email, password);
  console.log(`✓ Admin: ${admin.email}`);

  await AchievementService.ensureCatalog();
  console.log('✓ Achievement catalog synced');

  // Reset demo data (keep admin users + catalog).
  await prisma.fantasyPick.deleteMany({});
  await prisma.fantasyEntry.deleteMany({});
  await prisma.fantasyUser.deleteMany({});
  await prisma.playerAchievement.deleteMany({});
  await prisma.matchEvent.deleteMany({});
  await prisma.matchParticipant.deleteMany({});
  await prisma.matchTeam.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.player.deleteMany({});

  const players = new Map<string, string>();
  for (const [name, price] of PLAYERS) {
    const p = await prisma.player.create({ data: { name, price } });
    players.set(name, p.id);
  }
  console.log(`✓ ${players.size} players (priced)`);

  async function createMatch(date: string, title: string, lines: Line[], finish: boolean) {
    const match = await prisma.match.create({
      data: {
        matchDate: new Date(date),
        title,
        status: finish ? 'LIVE' : 'DRAFT',
        createdById: admin.id,
        teams: { create: [{ name: 'Team A', shortName: 'A' }, { name: 'Team B', shortName: 'B' }] },
      },
      include: { teams: true },
    });
    const teamA = match.teams.find((t) => t.shortName === 'A')!;
    const teamB = match.teams.find((t) => t.shortName === 'B')!;
    for (const line of lines) {
      const playerId = players.get(line.name);
      if (!playerId) throw new Error(`Unknown player: ${line.name}`);
      await prisma.matchParticipant.create({
        data: {
          matchId: match.id, playerId, teamId: line.team === 'A' ? teamA.id : teamB.id,
          goals: line.g ?? 0, assists: line.a ?? 0, saves: line.s ?? 0, ownGoals: line.o ?? 0,
        },
      });
    }
    if (finish) await MatchService.finish(match.id);
    return match.id;
  }

  // ---- Finished matches (Ahmed scores every week; wk2 hat trick; Hassan Wall)
  const finished: { date: string; title: string; lines: Line[] }[] = [
    { date: '2026-08-14', title: 'Week 1', lines: [
      { name: 'Ahmed', team: 'A', g: 1, a: 1 }, { name: 'Karim', team: 'A', g: 2 }, { name: 'Omar', team: 'A', s: 4 }, { name: 'Ali', team: 'A', a: 2 }, { name: 'Youssef', team: 'A', g: 1 },
      { name: 'Hassan', team: 'B', s: 6 }, { name: 'Mostafa', team: 'B', g: 2, a: 1 }, { name: 'Amr', team: 'B', g: 1 }, { name: 'Mahmoud', team: 'B', a: 1 }, { name: 'Tarek', team: 'B', g: 1, o: 1 },
    ] },
    { date: '2026-08-21', title: 'Week 2', lines: [
      { name: 'Ahmed', team: 'A', g: 3, a: 1 }, { name: 'Omar', team: 'A', g: 1 }, { name: 'Ali', team: 'A', s: 3 }, { name: 'Mostafa', team: 'A', a: 2 }, { name: 'Sami', team: 'A', g: 1 },
      { name: 'Hassan', team: 'B', s: 10 }, { name: 'Karim', team: 'B', g: 2 }, { name: 'Amr', team: 'B', a: 1 }, { name: 'Mahmoud', team: 'B', g: 1 }, { name: 'Nabil', team: 'B', a: 1 },
    ] },
    { date: '2026-08-28', title: 'Week 3', lines: [
      { name: 'Ahmed', team: 'A', g: 2, a: 2 }, { name: 'Youssef', team: 'A', g: 1 }, { name: 'Ali', team: 'A', g: 1 }, { name: 'Nabil', team: 'A', s: 5 }, { name: 'Karim', team: 'A', a: 1 },
      { name: 'Mostafa', team: 'B', g: 2 }, { name: 'Omar', team: 'B', s: 4 }, { name: 'Amr', team: 'B', g: 1, a: 1 }, { name: 'Sami', team: 'B', a: 4 }, { name: 'Tarek', team: 'B', g: 1 },
    ] },
    { date: '2026-09-04', title: 'Week 4', lines: [
      { name: 'Ahmed', team: 'A', g: 2 }, { name: 'Mostafa', team: 'A', g: 1, a: 2 }, { name: 'Mahmoud', team: 'A', s: 3 }, { name: 'Sami', team: 'A', g: 1 }, { name: 'Amr', team: 'A', a: 1 },
      { name: 'Karim', team: 'B', g: 2, a: 1 }, { name: 'Hassan', team: 'B', s: 7 }, { name: 'Ali', team: 'B', g: 1 }, { name: 'Youssef', team: 'B', a: 1 }, { name: 'Omar', team: 'B', g: 1 },
    ] },
    { date: '2026-09-11', title: 'Week 5', lines: [
      { name: 'Ahmed', team: 'A', g: 2, a: 1 }, { name: 'Ali', team: 'A', g: 1 }, { name: 'Karim', team: 'A', g: 1 }, { name: 'Omar', team: 'A', s: 6 }, { name: 'Nabil', team: 'A', a: 2 },
      { name: 'Hassan', team: 'B', s: 5 }, { name: 'Mostafa', team: 'B', g: 2, a: 1 }, { name: 'Tarek', team: 'B', g: 1 }, { name: 'Sami', team: 'B', a: 1 }, { name: 'Mahmoud', team: 'B', g: 1 },
    ] },
  ];
  const finishedIds: string[] = [];
  for (const m of finished) finishedIds.push(await createMatch(m.date, m.title, m.lines, true));
  console.log(`✓ ${finished.length} finished matches`);

  // ---- Upcoming (scheduled/DRAFT) matches for fantasy entry -----------------
  const scheduled: { date: string; title: string; lines: Line[] }[] = [
    { date: '2026-09-25', title: 'Week 6', lines: [
      { name: 'Ahmed', team: 'A' }, { name: 'Omar', team: 'A' }, { name: 'Ali', team: 'A' }, { name: 'Sami', team: 'A' }, { name: 'Amr', team: 'A' },
      { name: 'Hassan', team: 'B' }, { name: 'Karim', team: 'B' }, { name: 'Mostafa', team: 'B' }, { name: 'Youssef', team: 'B' }, { name: 'Tarek', team: 'B' },
    ] },
    { date: '2026-10-02', title: 'Week 7', lines: [
      { name: 'Ahmed', team: 'A' }, { name: 'Karim', team: 'A' }, { name: 'Hassan', team: 'A' }, { name: 'Nabil', team: 'A' }, { name: 'Mahmoud', team: 'A' },
      { name: 'Omar', team: 'B' }, { name: 'Mostafa', team: 'B' }, { name: 'Ali', team: 'B' }, { name: 'Sami', team: 'B' }, { name: 'Youssef', team: 'B' },
    ] },
  ];
  for (const m of scheduled) await createMatch(m.date, m.title, m.lines, false);
  console.log(`✓ ${scheduled.length} scheduled matches (open for fantasy)`);

  // ---- Demo fantasy user + a scored entry on Week 1 -------------------------
  const fanEmail = 'fan@example.com';
  const fanPassword = 'fanpass123';
  const fan = await prisma.fantasyUser.create({
    data: { email: fanEmail, displayName: 'Demo Fan', passwordHash: await hashPassword(fanPassword) },
  });
  // Build a valid squad from Week 1's participants within budget.
  const wk1 = await prisma.matchParticipant.findMany({
    where: { matchId: finishedIds[0] },
    include: { player: true },
    orderBy: { player: { price: 'asc' } },
  });
  const squad = wk1.slice(0, FantasyService.squadSize); // cheapest 5 -> within budget
  const captain = squad.reduce((best, p) =>
    (p.goals * 3 + p.assists * 2 + p.saves * 2 - p.ownGoals * 2) >
    (best.goals * 3 + best.assists * 2 + best.saves * 2 - best.ownGoals * 2) ? p : best, squad[0]);
  const entry = await prisma.fantasyEntry.create({ data: { userId: fan.id, matchId: finishedIds[0] } });
  await prisma.fantasyPick.createMany({
    data: squad.map((p) => ({ entryId: entry.id, matchParticipantId: p.id, isCaptain: p.id === captain.id })),
  });
  const picks = await prisma.fantasyPick.findMany({
    where: { entryId: entry.id }, include: { participant: { include: { player: true } } },
  });
  await prisma.fantasyEntry.update({ where: { id: entry.id }, data: { points: FantasyService.computePoints(picks) } });
  console.log(`✓ Demo fantasy user: ${fanEmail} / ${fanPassword} (with a scored Week 1 entry)`);

  // Second demo user + a shared league (so standings have >1 member).
  const rival = await prisma.fantasyUser.create({
    data: { email: 'rival@example.com', displayName: 'Rival', passwordHash: await hashPassword('rivalpass123') },
  });
  const rivalSquad = [wk1[0], wk1[1], wk1[2], wk1[3], wk1[5]]; // slightly different, within budget
  const rivalCaptain = rivalSquad.reduce((best, p) =>
    (p.goals * 3 + p.assists * 2 + p.saves * 2 - p.ownGoals * 2) >
    (best.goals * 3 + best.assists * 2 + best.saves * 2 - best.ownGoals * 2) ? p : best, rivalSquad[0]);
  const rEntry = await prisma.fantasyEntry.create({ data: { userId: rival.id, matchId: finishedIds[0] } });
  await prisma.fantasyPick.createMany({
    data: rivalSquad.map((p) => ({ entryId: rEntry.id, matchParticipantId: p.id, isCaptain: p.id === rivalCaptain.id })),
  });
  const rPicks = await prisma.fantasyPick.findMany({
    where: { entryId: rEntry.id }, include: { participant: { include: { player: true } } },
  });
  await prisma.fantasyEntry.update({ where: { id: rEntry.id }, data: { points: FantasyService.computePoints(rPicks) } });

  const league = await FantasyLeagueService.createLeague(fan.id, 'Friends League');
  await FantasyLeagueService.joinByCode(rival.id, league.code);
  console.log(`✓ Demo league "Friends League" (code ${league.code}) — fan + rival`);

  const badges = await prisma.playerAchievement.count();
  console.log(`✓ Seed complete — ${finished.length} finished + ${scheduled.length} scheduled matches, ${badges} badges`);
}

main()
  .catch((err) => { console.error('Seed failed:', err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
