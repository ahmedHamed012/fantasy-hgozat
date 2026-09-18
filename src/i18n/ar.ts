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
  'admin.dashboard.placeholder': 'إنشاء المباريات وشاشة المباراة المباشرة ستصل في المراحل التالية.',
  'admin.nav.players': 'إدارة اللاعبين',
  'admin.nav.matches': 'المباريات',
  'admin.nav.newMatch': '+ مباراة جديدة',

  // Matches
  'match.list.title': 'المباريات',
  'match.list.heading': 'المباريات',
  'match.list.new': '+ مباراة جديدة',
  'match.list.empty': 'لا توجد مباريات بعد. أنشئ أول مباراة للبدء.',
  'match.col.date': 'التاريخ',
  'match.col.title': 'العنوان',
  'match.col.status': 'الحالة',
  'match.col.players': 'اللاعبون',
  'match.col.actions': 'إجراءات',
  'match.status.DRAFT': 'مسودة',
  'match.status.LIVE': 'مباشر',
  'match.status.FINISHED': 'منتهية',
  'match.status.CANCELLED': 'ملغاة',
  'match.untitled': 'مباراة بدون عنوان',

  'match.new.title': 'مباراة جديدة',
  'match.new.heading': 'إنشاء مباراة',
  'match.field.date': 'التاريخ',
  'match.field.title': 'العنوان',
  'match.field.title.hint': 'اختياري',
  'match.new.create': 'إنشاء المباراة',
  'match.error.dateInvalid': 'الرجاء اختيار تاريخ صحيح.',
  'match.error.titleTooLong': 'العنوان طويل جدًا (100 حرف كحد أقصى).',

  'match.setup.title': 'إعداد المباراة',
  'match.setup.heading': 'إعداد المباراة',
  'match.setup.teamsHeading': 'توزيع الفرق',
  'match.setup.intro': 'اختر أ أو ب لكل لاعب. المباراة القياسية 5 ضد 5.',
  'match.setup.none': '—',
  'match.setup.save': 'حفظ الفرق',
  'match.setup.saved': 'تم حفظ الفرق.',
  'match.setup.start': 'بدء المباراة ▶',
  'match.setup.error.teams': 'يحتاج كل فريق إلى لاعب واحد على الأقل قبل البدء.',
  'match.setup.addPlayer': 'إضافة لاعب جديد',
  'match.setup.addPlayer.placeholder': 'اسم اللاعب الجديد',
  'match.setup.addPlayer.button': 'إضافة',
  'match.setup.addPlayer.failed': 'تعذّر إضافة اللاعب.',
  'match.setup.noPlayers': 'لا يوجد لاعبون نشطون. أضف لاعبًا أدناه.',
  'match.setup.hint5v5': 'المُوصى به: 5 ضد 5.',

  'match.details.title': 'تفاصيل المباراة',
  'match.details.goLive': 'فتح الشاشة المباشرة ▶',
  'match.details.editTeams': 'تعديل الفرق',
  'match.details.roster': 'التشكيلة',
  'match.details.empty': 'لا يوجد لاعبون معيّنون.',

  // Live match
  'live.title': 'مباراة مباشرة',
  'live.back': 'العودة للمباراة',
  'live.stat.goals': 'الأهداف',
  'live.stat.assists': 'التمريرات الحاسمة',
  'live.stat.saves': 'التصديات',
  'live.stat.ownGoals': 'أهداف عكسية',
  'live.decrease': 'إنقاص',
  'live.increase': 'زيادة',
  'live.finish': 'إنهاء المباراة',
  'live.finish.confirm': 'إنهاء المباراة؟ ستصبح الإحصائيات نهائية وتُحتسب النقاط وأفضل لاعب والترتيب.',
  'live.offline': 'فشل التحديث — تحقّق من الاتصال وأعد المحاولة.',

  // Cancel
  'match.cancel': 'إلغاء المباراة',
  'match.cancel.confirm': 'إلغاء هذه المباراة؟ لن تُحتسب في أي إحصائيات.',

  // Result
  'result.title': 'نتيجة المباراة',
  'result.view': 'عرض النتيجة',
  'result.finalScore': 'النتيجة النهائية',
  'result.motm': 'أفضل لاعب في المباراة',
  'result.motm.joint': 'أفضل لاعب (مشترك)',
  'result.col.player': 'اللاعب',
  'result.col.goals': 'هـ',
  'result.col.assists': 'ت',
  'result.col.saves': 'تص',
  'result.col.og': 'ع',
  'result.col.points': 'نقاط',
  'result.col.goals.full': 'الأهداف',
  'result.col.assists.full': 'التمريرات الحاسمة',
  'result.col.saves.full': 'التصديات',
  'result.newAchievements': 'إنجازات جديدة',
  'result.backToMatches': 'كل المباريات',

  // Players
  'player.list.title': 'اللاعبون',
  'player.list.heading': 'اللاعبون',
  'player.list.add': '+ إضافة لاعب',
  'player.list.empty': 'لا يوجد لاعبون بعد. أضف أول لاعب للبدء.',
  'player.list.count': '{count} لاعب',
  'player.filter.all': 'الكل',
  'player.filter.active': 'نشط',
  'player.filter.inactive': 'غير نشط',
  'player.col.player': 'اللاعب',
  'player.col.nickname': 'اللقب',
  'player.col.status': 'الحالة',
  'player.col.actions': 'إجراءات',
  'player.status.active': 'نشط',
  'player.status.inactive': 'غير نشط',
  'player.action.edit': 'تعديل',
  'player.action.deactivate': 'إلغاء التنشيط',
  'player.action.activate': 'تنشيط',
  'player.confirm.deactivate': 'إلغاء تنشيط هذا اللاعب؟ ستبقى جميع إحصائياته التاريخية.',

  'player.new.title': 'إضافة لاعب',
  'player.new.heading': 'إضافة لاعب',
  'player.edit.title': 'تعديل لاعب',
  'player.edit.heading': 'تعديل لاعب',
  'player.field.name': 'الاسم',
  'player.field.nickname': 'اللقب',
  'player.field.nickname.hint': 'اختياري',
  'player.field.avatarUrl': 'رابط الصورة الرمزية',
  'player.field.avatarUrl.hint': 'اختياري — رابط لصورة',
  'player.form.save': 'حفظ',
  'player.form.cancel': 'إلغاء',
  'player.error.nameRequired': 'الاسم مطلوب.',
  'player.error.nameTooLong': 'الاسم طويل جدًا (60 حرفًا كحد أقصى).',
  'player.error.nicknameTooLong': 'اللقب طويل جدًا (40 حرفًا كحد أقصى).',
  'player.error.avatarInvalid': 'يجب أن يكون رابط الصورة صحيحًا.',
  'player.error.avatarTooLong': 'رابط الصورة طويل جدًا.',

  // Errors
  'error.back': 'العودة للرئيسية',
};
