/**
 * Arabic translation dictionary. Same keys as en.ts (the English dictionary is
 * the source of truth for the key set). Rendered right-to-left.
 */
export const ar: Record<string, string> = {
  // App / chrome
  'app.name': 'الدوري الأسبوعي',
  'lang.name': 'العربية',
  'lang.switchTo': 'English',

  // Nav
  'nav.leaderboard': 'الترتيب',
  'nav.admin': 'الإدارة',
  'nav.login': 'دخول المشرف',
  'nav.logout': 'تسجيل الخروج',

  // Footer
  'footer.text': '⚽ الدوري الأسبوعي · {year}',

  // Home
  'home.hero.title': '⚽ الدوري الأسبوعي',
  'home.hero.subtitle':
    'حوّل مباريات الخماسي الأسبوعية إلى منافسة تمتد طوال الموسم. سجّل الأهداف والتمريرات الحاسمة والتصديات والنقاط والترتيب والأوسمة — تلقائيًا.',
  'home.cta.leaderboard': 'عرض الترتيب',
  'home.cta.login': 'دخول المشرف',
  'home.feature.fast.title': 'تسجيل مباشر سريع',
  'home.feature.fast.text': 'اضغط أزرار + / − أثناء المباراة. تُحدَّث نتيجة كل فريق تلقائيًا.',
  'home.feature.points.title': 'النقاط والترتيب',
  'home.feature.points.text': 'كل هدف وتمريرة حاسمة وتصدٍّ يتحول إلى نقاط وإلى ترتيب عام مباشر.',
  'home.feature.badges.title': 'الأوسمة',
  'home.feature.badges.text': 'هاتريك، حائط صدّ، صانع ألعاب — تُفتح الإنجازات مع تألق اللاعبين.',

  // Auth
  'auth.login.title': 'دخول المشرف',
  'auth.login.heading': 'دخول المشرف',
  'auth.login.subtitle': 'سجّل الدخول لإدارة اللاعبين والمباريات.',
  'auth.login.email': 'البريد الإلكتروني',
  'auth.login.password': 'كلمة المرور',
  'auth.login.submit': 'تسجيل الدخول',
  'auth.error.invalidInput': 'الرجاء إدخال بريد إلكتروني وكلمة مرور صحيحين.',
  'auth.error.invalidCredentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',

  // Admin
  'admin.dashboard.title': 'لوحة التحكم',
  'admin.dashboard.heading': 'لوحة تحكم المشرف',
  'admin.dashboard.welcome': 'مرحبًا، {email}.',
  'admin.dashboard.placeholder': 'إدارة اللاعبين وإنشاء المباريات وشاشة المباراة المباشرة ستصل في المراحل التالية.',

  // Errors
  'error.back': 'العودة للرئيسية',
};
