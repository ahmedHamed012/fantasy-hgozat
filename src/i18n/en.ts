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
    'Player management, match creation and the live match screen arrive in the next phases.',

  // Errors
  'error.back': 'Back to home',
};
