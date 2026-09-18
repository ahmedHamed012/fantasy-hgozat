/**
 * Development seed.
 *
 * Creates the admin, the achievement catalog, a pool of players, and several
 * finished matches with varied stats — enough to demonstrate the leaderboard,
 * profiles, match history and badges immediately. Idempotent-by-reset: it
 * clears existing players/matches (NOT users) and rebuilds the demo data.
 *
 * Run: npm run db:seed   (or: npx prisma db seed)
 */
import { prisma } from '../src/lib/prisma';
import { AuthService } from '../src/services/authService';
import { AchievementService } from '../src/services/achievementService';
import { MatchService } from '../src/services/matchService';

const PLAYERS = [
  'Ahmed', 'Karim', 'Omar', 'Hassan', 'Ali', 'Youssef',
  'Mostafa', 'Amr', 'Mahmoud', 'Tarek', 'Sami', 'Nabil',
];

interface Line { name: string; team: 'A' | 'B'; g?: number; a?: number; s?: number; o?: number }

async function main() {
  // 1. Admin (from env, with dev fallbacks).
  const email = process.env.ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD ?? 'changeme123';
  const admin = await AuthService.upsertAdmin(email, password);
  console.log(`✓ Admin: ${admin.email}`);

  // 2. Achievement catalog.
  await AchievementService.ensureCatalog();
  console.log('✓ Achievement catalog synced');

  // 3. Reset demo data (keep users + catalog).
  await prisma.playerAchievement.deleteMany({});
  await prisma.matchEvent.deleteMany({});
  await prisma.matchParticipant.deleteMany({});
  await prisma.matchTeam.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.player.deleteMany({});

  // 4. Players.
  const players = new Map<string, string>();
  for (const name of PLAYERS) {
    const p = await prisma.player.create({ data: { name } });
    players.set(name, p.id);
  }
  console.log(`✓ ${players.size} players`);

  // 5. Finished matches. Ahmed scores in every match (→ On Fire after 5);
  //    match 2 gives him a hat trick; Hassan racks up saves for the Wall.
  const matches: { date: string; title: string; lines: Line[] }[] = [
    {
      date: '2026-08-14', title: 'Week 1',
      lines: [
        { name: 'Ahmed', team: 'A', g: 1, a: 1 }, { name: 'Karim', team: 'A', g: 2 },
        { name: 'Omar', team: 'A', s: 4 }, { name: 'Ali', team: 'A', a: 2 },
        { name: 'Youssef', team: 'A', g: 1 },
        { name: 'Hassan', team: 'B', s: 6 }, { name: 'Mostafa', team: 'B', g: 2, a: 1 },
        { name: 'Amr', team: 'B', g: 1 }, { name: 'Mahmoud', team: 'B', a: 1 },
        { name: 'Tarek', team: 'B', g: 1, o: 1 },
      ],
    },
    {
      date: '2026-08-21', title: 'Week 2',
      lines: [
        { name: 'Ahmed', team: 'A', g: 3, a: 1 }, { name: 'Omar', team: 'A', g: 1 },
        { name: 'Ali', team: 'A', s: 3 }, { name: 'Mostafa', team: 'A', a: 2 },
        { name: 'Sami', team: 'A', g: 1 },
        { name: 'Hassan', team: 'B', s: 10 }, { name: 'Karim', team: 'B', g: 2 },
        { name: 'Amr', team: 'B', a: 1 }, { name: 'Mahmoud', team: 'B', g: 1 },
        { name: 'Nabil', team: 'B', a: 1 },
      ],
    },
    {
      date: '2026-08-28', title: 'Week 3',
      lines: [
        { name: 'Ahmed', team: 'A', g: 2, a: 2 }, { name: 'Youssef', team: 'A', g: 1 },
        { name: 'Ali', team: 'A', g: 1 }, { name: 'Nabil', team: 'A', s: 5 },
        { name: 'Karim', team: 'A', a: 1 },
        { name: 'Mostafa', team: 'B', g: 2 }, { name: 'Omar', team: 'B', s: 4 },
        { name: 'Amr', team: 'B', g: 1, a: 1 }, { name: 'Sami', team: 'B', a: 4 },
        { name: 'Tarek', team: 'B', g: 1 },
      ],
    },
    {
      date: '2026-09-04', title: 'Week 4',
      lines: [
        { name: 'Ahmed', team: 'A', g: 2 }, { name: 'Mostafa', team: 'A', g: 1, a: 2 },
        { name: 'Mahmoud', team: 'A', s: 3 }, { name: 'Sami', team: 'A', g: 1 },
        { name: 'Amr', team: 'A', a: 1 },
        { name: 'Karim', team: 'B', g: 2, a: 1 }, { name: 'Hassan', team: 'B', s: 7 },
        { name: 'Ali', team: 'B', g: 1 }, { name: 'Youssef', team: 'B', a: 1 },
        { name: 'Omar', team: 'B', g: 1 },
      ],
    },
    {
      date: '2026-09-11', title: 'Week 5',
      lines: [
        { name: 'Ahmed', team: 'A', g: 2, a: 1 }, { name: 'Ali', team: 'A', g: 1 },
        { name: 'Karim', team: 'A', g: 1 }, { name: 'Omar', team: 'A', s: 6 },
        { name: 'Nabil', team: 'A', a: 2 },
        { name: 'Hassan', team: 'B', s: 5 }, { name: 'Mostafa', team: 'B', g: 2, a: 1 },
        { name: 'Tarek', team: 'B', g: 1 }, { name: 'Sami', team: 'B', a: 1 },
        { name: 'Mahmoud', team: 'B', g: 1 },
      ],
    },
  ];

  for (const m of matches) {
    const match = await prisma.match.create({
      data: {
        matchDate: new Date(m.date),
        title: m.title,
        status: 'LIVE',
        createdById: admin.id,
        teams: { create: [{ name: 'Team A', shortName: 'A' }, { name: 'Team B', shortName: 'B' }] },
      },
      include: { teams: true },
    });
    const teamA = match.teams.find((t) => t.shortName === 'A')!;
    const teamB = match.teams.find((t) => t.shortName === 'B')!;

    for (const line of m.lines) {
      const playerId = players.get(line.name);
      if (!playerId) throw new Error(`Unknown player in seed: ${line.name}`);
      await prisma.matchParticipant.create({
        data: {
          matchId: match.id,
          playerId,
          teamId: line.team === 'A' ? teamA.id : teamB.id,
          goals: line.g ?? 0,
          assists: line.a ?? 0,
          saves: line.s ?? 0,
          ownGoals: line.o ?? 0,
        },
      });
    }

    // Finish through the service so points, MOTM and achievements are computed.
    await MatchService.finish(match.id);
    console.log(`✓ ${m.title} finished`);
  }

  const badges = await prisma.playerAchievement.count();
  console.log(`✓ Seed complete — ${matches.length} matches, ${badges} badges unlocked`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
