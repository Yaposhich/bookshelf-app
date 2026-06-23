// Changelog — add a new entry at the top each time you release a new version.
// Shown in Settings → About → "What's new", and as a popup right after an update installs.
export const CHANGELOG = [
  {
    version: '1.1.1',
    date: '2026-06-22',
    uk: [
      'Виправлено кнопку "Перезапустити" в оновленнях',
      'Вибір мови тепер компактний — виїжджає при натисканні',
      'Пояснення що UI перекладений тільки на UA/EN',
      'Виправлено скрол у вікні додавання книги',
    ],
    en: [
      'Fixed "Restart" button in update banner',
      'Language picker is now compact — expands on click',
      'Added note that full UI translation is UA/EN only',
      'Fixed scroll in add book modal',
    ],
  },
  {
    version: '1.0.8',
    date: '2026-06-21',
    uk: ['Виправлено кнопку "Перезапустити" в попапі оновлень'],
    en: ['Fixed "Restart" button in the update popup'],
  },
  {
    version: '1.0.7',
    date: '2026-06-21',
    uk: ['Десятибальна шкала оцінок замість п\'ятизіркової', 'Нова тема оформлення "Paper" — тепла, паперова', 'Журнал змін — тепер видно що нового в кожній версії', 'Шрифт інтерфейсу змінено на Helvetica', 'Оновлений дизайн бокової панелі'],
    en: ['Switched rating scale from 5 stars to 10 points', 'New "Paper" theme — warm, paper-like', 'Changelog — see what changed in every version', 'Interface font changed to Helvetica', 'Refreshed sidebar design'],
  },
  {
    version: '1.0.5',
    date: '2026-06-21',
    uk: ['Виправлено пошук через Google Books', 'Виправлено облік сторінок у статистиці читання', 'Автооновлення тепер працює коректно'],
    en: ['Fixed Google Books search', 'Fixed page tracking in reading statistics', 'Auto-updates now working correctly'],
  },
  {
    version: '1.0.1',
    date: '2026-06-14',
    uk: ['Перший публічний реліз', 'Бібліотека книг, полиці, цитати, статистика'],
    en: ['First public release', 'Book library, shelves, quotes, statistics'],
  },
]

export const CURRENT_VERSION = CHANGELOG[0].version
