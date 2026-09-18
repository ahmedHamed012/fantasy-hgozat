/**
 * English translation dictionary.
 *
 * Flat, dotted keys keep lookups simple and make missing-key detection easy.
 * Placeholders use {name} syntax and are filled by the translator's params.
 * Player names and other user data are NOT translated — only UI chrome.
 */
export const en: Record<string, string> = {
  // App / chrome
  'app.name': 'Weekly Football',
  'lang.name': 'English',
  'lang.switchTo': 'العربية',

  // Nav
  'nav.leaderboard': 'Leaderboard',
  'nav.admin': 'Admin',
  'nav.login': 'Admin login',
  'nav.logout': 'Log out',

  // Footer
  'footer.text': '⚽ Weekly Football · {year}',

  // Home
  'home.hero.title': '⚽ Weekly Football',
  'home.hero.subtitle':
    'Turn your weekly 5-a-side matches into a season-long competition. Track goals, assists, saves, points, rankings and badges — automatically.',
  'home.cta.leaderboard': 'View leaderboard',
  'home.cta.login': 'Admin login',
  'home.feature.fast.title': 'Fast live scoring',
  'home.feature.fast.text': 'Tap + / − counters during the match. Team scores update on their own.',
  'home.feature.points.title': 'Points & rankings',
  'home.feature.points.text': 'Every goal, assist and save becomes points and a live global leaderboard.',
  'home.feature.badges.title': 'Badges',
  'home.feature.badges.text': 'Hat tricks, walls, playmakers — achievements unlock as players perform.',

  // Auth
  'auth.login.title': 'Admin login',
  'auth.login.heading': 'Admin login',
  'auth.login.subtitle': 'Sign in to manage players and matches.',
  'auth.login.email': 'Email',
  'auth.login.password': 'Password',
  'auth.login.submit': 'Log in',
  'auth.error.invalidInput': 'Please enter a valid email and password.',
  'auth.error.invalidCredentials': 'Invalid email or password.',

  // Admin
  'admin.dashboard.title': 'Dashboard',
  'admin.dashboard.heading': 'Admin dashboard',
  'admin.dashboard.welcome': 'Welcome, {email}.',
  'admin.dashboard.placeholder':
    'Match creation and the live match screen arrive in the next phases.',
  'admin.nav.players': 'Manage players',
  'admin.nav.matches': 'Matches',
  'admin.nav.newMatch': '+ New match',

  // Matches
  'match.list.title': 'Matches',
  'match.list.heading': 'Matches',
  'match.list.new': '+ New match',
  'match.list.empty': 'No matches yet. Create your first match to get started.',
  'match.col.date': 'Date',
  'match.col.title': 'Title',
  'match.col.status': 'Status',
  'match.col.players': 'Players',
  'match.col.actions': 'Actions',
  'match.status.DRAFT': 'Draft',
  'match.status.LIVE': 'Live',
  'match.status.FINISHED': 'Finished',
  'match.status.CANCELLED': 'Cancelled',
  'match.untitled': 'Untitled match',

  'match.new.title': 'New match',
  'match.new.heading': 'Create match',
  'match.field.date': 'Date',
  'match.field.title': 'Title',
  'match.field.title.hint': 'Optional',
  'match.new.create': 'Create match',
  'match.error.dateInvalid': 'Please pick a valid date.',
  'match.error.titleTooLong': 'Title is too long (max 100).',

  'match.setup.title': 'Match setup',
  'match.setup.heading': 'Match setup',
  'match.setup.teamsHeading': 'Assign teams',
  'match.setup.intro': 'Tap A or B for each player. A standard match is 5 vs 5.',
  'match.setup.none': '—',
  'match.setup.save': 'Save teams',
  'match.setup.saved': 'Teams saved.',
  'match.setup.start': 'Start match ▶',
  'match.setup.error.teams': 'Each team needs at least one player before starting.',
  'match.setup.addPlayer': 'Add new player',
  'match.setup.addPlayer.placeholder': 'New player name',
  'match.setup.addPlayer.button': 'Add',
  'match.setup.addPlayer.failed': 'Could not add player.',
  'match.setup.noPlayers': 'No active players. Add one below.',
  'match.setup.hint5v5': 'Recommended: 5 vs 5.',

  'match.details.title': 'Match details',
  'match.details.goLive': 'Open live screen ▶',
  'match.details.editTeams': 'Edit teams',
  'match.details.roster': 'Roster',
  'match.details.empty': 'No players assigned.',

  // Live match
  'live.title': 'Live match',
  'live.back': 'Back to match',
  'live.stat.goals': 'Goals',
  'live.stat.assists': 'Assists',
  'live.stat.saves': 'Saves',
  'live.stat.ownGoals': 'Own goals',
  'live.decrease': 'Decrease',
  'live.increase': 'Increase',
  'live.finish': 'Finish match',
  'live.finish.soon': 'Finishing arrives in the next phase.',
  'live.offline': 'Update failed — check connection and retry.',

  // Players
  'player.list.title': 'Players',
  'player.list.heading': 'Players',
  'player.list.add': '+ Add player',
  'player.list.empty': 'No players yet. Add your first player to get started.',
  'player.list.count': '{count} player(s)',
  'player.filter.all': 'All',
  'player.filter.active': 'Active',
  'player.filter.inactive': 'Inactive',
  'player.col.player': 'Player',
  'player.col.nickname': 'Nickname',
  'player.col.status': 'Status',
  'player.col.actions': 'Actions',
  'player.status.active': 'Active',
  'player.status.inactive': 'Inactive',
  'player.action.edit': 'Edit',
  'player.action.deactivate': 'Deactivate',
  'player.action.activate': 'Activate',
  'player.confirm.deactivate': 'Deactivate this player? They keep all historical stats.',

  'player.new.title': 'Add player',
  'player.new.heading': 'Add player',
  'player.edit.title': 'Edit player',
  'player.edit.heading': 'Edit player',
  'player.field.name': 'Name',
  'player.field.nickname': 'Nickname',
  'player.field.nickname.hint': 'Optional',
  'player.field.avatarUrl': 'Avatar URL',
  'player.field.avatarUrl.hint': 'Optional — link to an image',
  'player.form.save': 'Save',
  'player.form.cancel': 'Cancel',
  'player.error.nameRequired': 'Name is required.',
  'player.error.nameTooLong': 'Name is too long (max 60).',
  'player.error.nicknameTooLong': 'Nickname is too long (max 40).',
  'player.error.avatarInvalid': 'Avatar must be a valid URL.',
  'player.error.avatarTooLong': 'Avatar URL is too long.',

  // Errors
  'error.back': 'Back to home',
};
