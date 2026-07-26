// ─────────────────────────────────────────────────────────────────────────
// Unified i18n for Bookshelf.
//
// One flat key namespace for the whole UI. `en` and `uk` are the reference
// dictionaries; every other language is generated to match these keys. Any
// missing key in a language falls back to English (see getT).
//
// Dynamic strings use {placeholder} tokens — render them with fmt():
//   fmt(t.noResultsFor, { query })   →  "\"foo\" gave no results"
//
// RTL languages (Arabic, Hebrew, Persian) are listed in RTL_LANGS; App sets
// document dir accordingly.
// ─────────────────────────────────────────────────────────────────────────

export const RTL_LANGS = new Set(['ar', 'he', 'fa'])

// Languages with a complete translation (drives the "Full UI translation"
// note and ordering in Settings). Filled as translations land below.
export const TRANSLATED = new Set([
  'uk', 'en', 'de', 'fr', 'es', 'it', 'pt', 'pl', 'nl', 'sv',
  'no', 'da', 'fi', 'cs', 'ro', 'hu', 'el', 'tr', 'ru', 'ar', 'he', 'fa',
])

// Interpolate {tokens} in a template with values from `vars`.
export function fmt(template, vars = {}) {
  if (!template) return ''
  return template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : `{${k}}`))
}

const en = {
  // ── Navigation / sidebar ──
  allBooks: 'All Books', read: 'Read', reading: 'Reading', readLater: 'Read Later',
  library: 'Library', analytics: 'Analytics', statistics: 'Statistics',
  experimental: 'Experimental', quotes: 'Quotes', settings: 'Settings', shelves: 'Shelves',
  betaBadge: 'BETA',

  // ── Topbar / list ──
  addBook: '+ Add Book', searchPlaceholder: 'Search book, author...',
  sortByDate: 'By date added', sortByRating: 'By rating', sortByTitle: 'By title (A-Z)',
  sortByAuthor: 'By author', sortByYear: 'By year written',
  totalBooks: 'Total Books', readCount: 'Read', readingNow: 'Reading Now',
  empty: 'Nothing here yet', emptyHint: 'Add your first book!',
  noResults: 'Nothing found', noResultsFor: '"{query}" gave no results',
  deleteConfirm: 'Delete this book?',

  // ── Status badges / options ──
  statusRead: '✅ Read', statusReading: '📖 Reading', statusReadLater: '🔖 Read Later',
  statusReadingNow: '📖 Reading now',

  // ── Book detail (ViewModal) ──
  bookDetails: 'Book Details', readingProgress: 'Reading progress', pages: 'pages',
  pageAbbr: 'p.', save: 'Save', language: 'Language', year: 'Year', pgLabel: 'Pages',
  quotesFromBook: 'Quotes from this book', delete: 'Delete', close: 'Close', edit: 'Edit',
  pagesTotalSuffix: '/ {total} pages', quotePageRef: 'p. {page}',
  quotesFromBookN: 'Quotes from this book ({n})',
  pageProgress: 'p. {cur} / {total}', ratingOutOf: '{rating}/10',

  // ── Add/Edit book modal ──
  langOther: 'Other', editBookTitle: 'Edit Book', addBookTitle: 'Add Book',
  tabSearch: '🔍 Search', tabManual: '✏️ Manual',
  pickCoverFirstSave: 'Save the book first, then change the cover',
  titleRequiredAlert: 'Enter the book title',
  searchNoResultsPrefix: 'Nothing found — try another query or',
  addManuallyLink: 'add manually', searchPrompt: 'Enter a book title or author',
  searchHint: 'Press Enter or wait 0.5 sec', searchViaSource: 'Search via {source}...',
  chooseArrow: 'Choose →', pagesShortSuffix: ' · {n} pp.',
  labelCover: 'Cover', coverUploadTooltip: 'Click to upload a photo',
  emojiHide: 'Hide ▲', emojiMore: 'More ▼', ownPhoto: '📷 Own photo',
  labelTitleRequired: 'Title *', placeholderTitle: 'Book title',
  labelAuthor: 'Author', placeholderAuthor: 'Author name',
  labelGenre: 'Genre', placeholderGenre: 'Sci-fi, novel...',
  labelStatus: 'Status', labelYearRead: 'Year read',
  labelTotalPages: 'Total pages', labelCurrentPage: 'Current page', labelProgress: 'Progress',
  labelRating: 'Rating', labelReadingLanguage: 'Reading language',
  languageNotSpecified: '— Not specified —',
  labelTags: 'Tags', placeholderTags: 'Add tags with Enter...',
  labelComment: 'Comment / notes', placeholderComment: 'Impressions, thoughts, favorite quotes...',
  cancel: 'Cancel', saveBtn: '💾 Save', addBtn: '➕ Add',

  // ── Changelog ──
  whatsNew: "What's new", changelogCurrent: 'Current', gotIt: 'Got it',

  // ── Quotes ──
  pickBookAlert: 'Choose a book', enterQuoteAlert: 'Enter the quote text',
  deleteQuoteConfirm: 'Delete this quote?', experimentalFeature: '✨ Experimental feature',
  addQuoteBtn: '+ Add Quote', noQuotesTitle: 'No quotes yet',
  noQuotesHint: 'Press "+ Add Quote" to save an important passage from a book',
  editQuoteTitle: 'Edit Quote', newQuoteTitle: 'New Quote',
  labelBookRequired: 'Book *', chooseBookOption: '— Choose a book —',
  labelQuoteTextRequired: 'Quote text *', placeholderQuoteText: 'Paste or type the quote text...',
  labelPage: 'Page', labelNote: 'Note', placeholderNote: 'Comment on the quote...',
  quotePageInline: ' · p. {page}',

  // ── Settings ──
  language: 'Interface Language', languageDesc: 'Choose the display language of the app',
  appearance: 'Appearance', about: 'About', version: 'Version',
  builtWith: 'Made with ❤️ using Electron + React + SQLite', saved: '✓ Saved',
  themeTitle: 'Theme', themeDark: 'Dark', themeLight: 'Light', themeSystem: 'System',
  dataTitle: 'Data', exportJSON: 'Export Library (JSON)',
  exportDesc: 'Save all books, quotes and shelves to a file for transfer',
  exportBtn: '📤 Export', importBtn: '📥 Import',
  importDesc: 'Load library from a previously saved JSON file',
  importWarning: 'Existing books are not deleted — new ones are added alongside',
  analyticsTitle: 'Developer Analytics',
  analyticsDesc: "App usage statistics — no personal data. Helps understand what works and what doesn't.",
  analyticsBtn: '📊 Export Analytics',
  analyticsNote: 'File contains: feature click counts, daily activity, library stats. No personal data.',
  success: '✓ Done', error: 'Error', checking: 'Checking...', checked: '✓ Checked',
  updateDevMode: 'Not available in dev mode', checkUpdateBtn: '🔄 Check for updates',
  fullUITranslation: 'Full UI translation', uiInEnglish: 'UI displayed in English',
  searchLanguagePlaceholder: 'Search language...', openFullLog: '📄 Open full log',
  importSuccess: '{success}: added {count} books', errorWithDetail: '{error}: {detail}',

  // ── Shelves ──
  myShelves: 'My Shelves', noShelvesYet: 'No shelves yet.\nClick + to create one',
  selectShelf: 'Select a shelf', selectShelfHint: 'or create a new one with +',
  shelfSortAdded: 'By date added', shelfSortTitle: 'By title A-Z', shelfSortAuthor: 'By author',
  shelfSortRating: 'By rating', shelfSortYear: 'By year',
  addBookToShelfBtn: '+ Add book', shelfEmpty: 'Shelf is empty',
  shelfEmptyHint: 'Click "+ Add book" to fill it',
  editShelfTitle: 'Edit Shelf', newShelfTitle: 'New Shelf',
  labelName: 'Name', placeholderShelfName: 'Shelf name...', labelIcon: 'Icon', labelColor: 'Color',
  create: 'Create', searchByTitleAuthor: 'Search by title or author...',
  allBooksOnShelf: 'All books are already on this shelf', addBookRowArrow: 'Add →',
  deleteShelfConfirmTitle: 'Delete shelf?',
  deleteShelfConfirmBody: 'Shelf "{name}" will be deleted. Books will remain in the library.',
  addToShelf: 'Add to "{name}"', noResultsForQuery: 'No results for "{query}"',
  shelfBooksCount: '{n} books',

  // ── Stats ──
  avgRating: 'Avg Rating', booksReadStat: 'Books Read', pagesReadStat: 'Pages Read',
  today: 'Today', thisWeek: 'This Week', thisYear: 'This Year', allTime: 'All Time',
  languagesReading: 'Reading Languages', byYear: 'By Year', quotesSaved: 'Quotes Saved',
  statBooksAbbr: 'bk.', statPagesAbbr: 'pp.',

  // ── Update banner ──
  updateDownloadBtn: '⬇ Download', updateLaterBtn: 'Later',
  updateDownloading: 'Downloading update...', updateReadyRestartHint: 'Restart to install',
  updateClosing: 'Closing...', updateRestartBtn: '🔄 Restart',
  updateAvailable: 'Update {version} available', updateReady: 'Version {version} ready',
}

const uk = {
  allBooks: 'Всі книги', read: 'Прочитані', reading: 'Читаю зараз', readLater: 'Read Later',
  library: 'Бібліотека', analytics: 'Аналітика', statistics: 'Статистика',
  experimental: 'Експеримент', quotes: 'Цитати', settings: 'Налаштування', shelves: 'Полиці',
  betaBadge: 'BETA',

  addBook: '+ Додати книгу', searchPlaceholder: 'Пошук книги, автора...',
  sortByDate: 'За датою додавання', sortByRating: 'За оцінкою', sortByTitle: 'За назвою (А-Я)',
  sortByAuthor: 'За автором', sortByYear: 'За роком написання',
  totalBooks: 'Всього книг', readCount: 'Прочитано', readingNow: 'Читаю зараз',
  empty: 'Тут ще нічого нема', emptyHint: 'Додай свою першу книгу!',
  noResults: 'Нічого не знайдено', noResultsFor: '"{query}" не дав результатів',
  deleteConfirm: 'Видалити цю книгу?',

  statusRead: '✅ Прочитав', statusReading: '📖 Читаю', statusReadLater: '🔖 Read Later',
  statusReadingNow: '📖 Читаю зараз',

  bookDetails: 'Деталі книги', readingProgress: 'Прогрес читання', pages: 'сторінок',
  pageAbbr: 'стор.', save: 'Зберегти', language: 'Мова', year: 'Рік', pgLabel: 'Сторінок',
  quotesFromBook: 'Цитати з цієї книги', delete: 'Видалити', close: 'Закрити', edit: 'Редагувати',
  pagesTotalSuffix: '/ {total} сторінок', quotePageRef: 'стор. {page}',
  quotesFromBookN: 'Цитати з цієї книги ({n})',
  pageProgress: 'стор. {cur} / {total}', ratingOutOf: '{rating}/10',

  langOther: 'Інша', editBookTitle: 'Редагувати книгу', addBookTitle: 'Додати книгу',
  tabSearch: '🔍 Пошук', tabManual: '✏️ Вручну',
  pickCoverFirstSave: 'Спочатку збережи книгу, потім зміни обкладинку',
  titleRequiredAlert: 'Вкажи назву книги',
  searchNoResultsPrefix: 'Нічого не знайдено — спробуй інший запит або',
  addManuallyLink: 'додай вручну', searchPrompt: 'Введи назву книги або автора',
  searchHint: 'Натисни Enter або зачекай 0.5 сек', searchViaSource: 'Пошук через {source}...',
  chooseArrow: 'Обрати →', pagesShortSuffix: ' · {n} стор.',
  labelCover: 'Обкладинка', coverUploadTooltip: 'Клікни щоб завантажити фото',
  emojiHide: 'Сховати ▲', emojiMore: 'Ще ▼', ownPhoto: '📷 Своє фото',
  labelTitleRequired: 'Назва *', placeholderTitle: 'Назва книги',
  labelAuthor: 'Автор', placeholderAuthor: "Ім'я автора",
  labelGenre: 'Жанр', placeholderGenre: 'Фантастика, роман...',
  labelStatus: 'Статус', labelYearRead: 'Рік прочитання',
  labelTotalPages: 'Всього сторінок', labelCurrentPage: 'Поточна сторінка', labelProgress: 'Прогрес',
  labelRating: 'Оцінка', labelReadingLanguage: 'Мова читання',
  languageNotSpecified: '— Не вказано —',
  labelTags: 'Теги', placeholderTags: 'Додай теги через Enter...',
  labelComment: 'Коментар / нотатки', placeholderComment: 'Враження, думки, улюблені цитати...',
  cancel: 'Скасувати', saveBtn: '💾 Зберегти', addBtn: '➕ Додати',

  whatsNew: 'Що нового', changelogCurrent: 'Поточна', gotIt: 'Зрозуміло',

  pickBookAlert: 'Обери книгу', enterQuoteAlert: 'Введи текст цитати',
  deleteQuoteConfirm: 'Видалити цю цитату?', experimentalFeature: '✨ Експериментальна функція',
  addQuoteBtn: '+ Додати цитату', noQuotesTitle: 'Цитат ще немає',
  noQuotesHint: 'Натисни "+ Додати цитату" щоб зберегти важливий уривок з книги',
  editQuoteTitle: 'Редагувати цитату', newQuoteTitle: 'Нова цитата',
  labelBookRequired: 'Книга *', chooseBookOption: '— Обери книгу —',
  labelQuoteTextRequired: 'Текст цитати *', placeholderQuoteText: 'Вставте або введіть текст цитати...',
  labelPage: 'Сторінка', labelNote: 'Нотатка', placeholderNote: 'Коментар до цитати...',
  quotePageInline: ' · стор. {page}',

  language: 'Мова інтерфейсу', languageDesc: 'Оберіть мову відображення застосунку',
  appearance: 'Вигляд', about: 'Про застосунок', version: 'Версія',
  builtWith: 'Зроблено з ❤️ за допомогою Electron + React + SQLite', saved: '✓ Збережено',
  themeTitle: 'Тема оформлення', themeDark: 'Темна', themeLight: 'Світла', themeSystem: 'Як в системі',
  dataTitle: 'Дані', exportJSON: 'Експорт бібліотеки (JSON)',
  exportDesc: 'Зберегти всі книги, цитати та полиці у файл для переносу',
  exportBtn: '📤 Експортувати', importBtn: '📥 Імпортувати',
  importDesc: 'Завантажити бібліотеку з раніше збереженого JSON файлу',
  importWarning: 'Існуючі книги не видаляються — нові додаються поряд',
  analyticsTitle: 'Аналітика для розробника',
  analyticsDesc: 'Статистика використання застосунку — без особистих даних. Допомагає зрозуміти що працює, а що ні.',
  analyticsBtn: '📊 Вигрузити аналітику',
  analyticsNote: 'Файл містить: кількість кліків по функціях, активність по днях, статистику бібліотеки. Жодних особистих даних.',
  success: '✓ Готово', error: 'Помилка', checking: 'Перевіряю...', checked: '✓ Перевірено',
  updateDevMode: 'Недоступно в режимі розробки', checkUpdateBtn: '🔄 Перевірити оновлення',
  fullUITranslation: 'Повний переклад інтерфейсу', uiInEnglish: 'Інтерфейс англійською',
  searchLanguagePlaceholder: 'Пошук мови...', openFullLog: '📄 Відкрити повний лог',
  importSuccess: '{success}: додано {count} книг', errorWithDetail: '{error}: {detail}',

  myShelves: 'Мої полиці', noShelvesYet: 'Ще немає полиць.\nНатисни + щоб створити',
  selectShelf: 'Обери полицю', selectShelfHint: 'або створи нову натиснувши +',
  shelfSortAdded: 'За датою додавання', shelfSortTitle: 'За назвою А-Я', shelfSortAuthor: 'За автором',
  shelfSortRating: 'За оцінкою', shelfSortYear: 'За роком написання',
  addBookToShelfBtn: '+ Додати книгу', shelfEmpty: 'Полиця порожня',
  shelfEmptyHint: 'Натисни "+ Додати книгу" щоб наповнити',
  editShelfTitle: 'Редагувати полицю', newShelfTitle: 'Нова полиця',
  labelName: 'Назва', placeholderShelfName: 'Назва полиці...', labelIcon: 'Іконка', labelColor: 'Колір',
  create: 'Створити', searchByTitleAuthor: 'Пошук за назвою або автором...',
  allBooksOnShelf: 'Всі книги вже на цій полиці', addBookRowArrow: 'Додати →',
  deleteShelfConfirmTitle: 'Видалити полицю?',
  deleteShelfConfirmBody: 'Полиця "{name}" буде видалена. Книги залишаться в бібліотеці.',
  addToShelf: 'Додати в "{name}"', noResultsForQuery: 'Нічого не знайдено за "{query}"',
  shelfBooksCount: '{n} книг',

  avgRating: 'Середня оцінка', booksReadStat: 'Книг прочитано', pagesReadStat: 'Сторінок прочитано',
  today: 'Сьогодні', thisWeek: 'Цей тиждень', thisYear: 'Цей рік', allTime: 'За весь час',
  languagesReading: 'Мови читання', byYear: 'По роках', quotesSaved: 'Цитат записано',
  statBooksAbbr: 'кн.', statPagesAbbr: 'стор.',

  updateDownloadBtn: '⬇ Завантажити', updateLaterBtn: 'Пізніше',
  updateDownloading: 'Завантаження оновлення...', updateReadyRestartHint: 'Перезапустіть щоб встановити',
  updateClosing: 'Закриваю...', updateRestartBtn: '🔄 Перезапустити',
  updateAvailable: 'Нова версія {version}', updateReady: 'Версія {version} готова',
}

// Other languages are merged in from ./i18n.langs (generated to match `en`).
import { LANGS } from './i18n.langs.js'

export const DICTS = { en, uk, ...LANGS }

// Return a full dictionary for `lang`, falling back to English per-key.
export function getT(lang) {
  const base = DICTS[lang] || DICTS.en
  if (base === DICTS.en) return base
  return new Proxy(base, { get: (o, k) => (k in o ? o[k] : DICTS.en[k]) })
}
