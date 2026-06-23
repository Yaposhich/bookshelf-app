import { useState, useEffect, useCallback } from 'react'
import track from './useTrack'
import Sidebar   from './components/Sidebar'
import BookCard  from './components/BookCard'
import BookModal from './components/BookModal'
import Stats     from './components/Stats'
import Quotes    from './components/Quotes'
import Settings  from './components/Settings'
import Shelves   from './components/Shelves'
import UpdateBanner from './components/UpdateBanner'

// ── Translations ───────────────────────────────────────────────────
const T = {
  uk: {
    allBooks:'Всі книги', read:'Прочитані', reading:'Читаю зараз', readLater:'Read Later',
    library:'Бібліотека', analytics:'Аналітика', statistics:'Статистика',
    experimental:'Експеримент', quotes:'Цитати', settings:'Налаштування',
    addBook:'+ Додати книгу', searchPlaceholder:'Пошук книги, автора...',
    shelves:'Полиці',
    sortByDate:'За датою додавання', sortByRating:'За оцінкою', sortByTitle:'За назвою (А-Я)', sortByAuthor:'За автором',
    sortByYear:'За роком написання',
    totalBooks:'Всього книг', readCount:'Прочитано', readingNow:'Читаю зараз',
    empty:'Тут ще нічого нема', emptyHint:'Додай свою першу книгу!',
    noResults:'Нічого не знайдено', noResultsHint:'не дав результатів',
    deleteConfirm:'Видалити цю книгу?',
  },
  en: {
    allBooks:'All Books', read:'Read', reading:'Reading', readLater:'Read Later',
    library:'Library', analytics:'Analytics', statistics:'Statistics',
    experimental:'Experimental', quotes:'Quotes', settings:'Settings',
    addBook:'+ Add Book', searchPlaceholder:'Search book, author...',
    shelves:'Shelves',
    sortByDate:'By date added', sortByRating:'By rating', sortByTitle:'By title (A-Z)', sortByAuthor:'By author',
    sortByYear:'By year written',
    totalBooks:'Total Books', readCount:'Read', readingNow:'Reading Now',
    empty:'Nothing here yet', emptyHint:'Add your first book!',
    noResults:'Nothing found', noResultsHint:'gave no results',
    deleteConfirm:'Delete this book?',
  },
  ru: {
    allBooks:'Все книги', read:'Прочитанные', reading:'Читаю сейчас', readLater:'Читать позже',
    library:'Библиотека', analytics:'Аналитика', statistics:'Статистика',
    experimental:'Эксперимент', quotes:'Цитаты', settings:'Настройки',
    addBook:'+ Добавить книгу', searchPlaceholder:'Поиск книги, автора...',
    shelves:'Полки',
    sortByDate:'По дате добавления', sortByRating:'По оценке', sortByTitle:'По названию (А-Я)', sortByAuthor:'По автору',
    sortByYear:'По году написания',
    totalBooks:'Всего книг', readCount:'Прочитано', readingNow:'Читаю сейчас',
    empty:'Здесь пока ничего нет', emptyHint:'Добавь свою первую книгу!',
    noResults:'Ничего не найдено', noResultsHint:'не дал результатов',
    deleteConfirm:'Удалить эту книгу?',
  },
  sv: {
    allBooks:'Alla böcker', read:'Lästa', reading:'Läser nu', readLater:'Läs senare',
    library:'Bibliotek', analytics:'Analys', statistics:'Statistik',
    experimental:'Experimentellt', quotes:'Citat', settings:'Inställningar',
    addBook:'+ Lägg till bok', searchPlaceholder:'Sök bok, författare...',
    shelves:'Hyllor',
    sortByDate:'Efter tillagd datum', sortByRating:'Efter betyg', sortByTitle:'Efter titel (A-Ö)', sortByAuthor:'Efter författare',
    sortByYear:'Efter skrivår',
    totalBooks:'Totalt böcker', readCount:'Lästa', readingNow:'Läser nu',
    empty:'Inget här ännu', emptyHint:'Lägg till din första bok!',
    noResults:'Inget hittades', noResultsHint:'gav inga resultat',
    deleteConfirm:'Ta bort den här boken?',
  },
  de: {
    allBooks:'Alle Bücher', read:'Gelesen', reading:'Lese gerade', readLater:'Später lesen',
    library:'Bibliothek', analytics:'Analytik', statistics:'Statistik',
    experimental:'Experimentell', quotes:'Zitate', settings:'Einstellungen',
    addBook:'+ Buch hinzufügen', searchPlaceholder:'Buch, Autor suchen...',
    shelves:'Regale',
    sortByDate:'Nach Hinzufügedatum', sortByRating:'Nach Bewertung', sortByTitle:'Nach Titel (A-Z)', sortByAuthor:'Nach Autor',
    sortByYear:'Nach Erscheinungsjahr',
    totalBooks:'Bücher gesamt', readCount:'Gelesen', readingNow:'Lese gerade',
    empty:'Noch nichts hier', emptyHint:'Füge dein erstes Buch hinzu!',
    noResults:'Nichts gefunden', noResultsHint:'ergab keine Ergebnisse',
    deleteConfirm:'Dieses Buch löschen?',
  },
  es: {
    allBooks:'Todos los libros', read:'Leídos', reading:'Leyendo ahora', readLater:'Leer después',
    library:'Biblioteca', analytics:'Analítica', statistics:'Estadísticas',
    experimental:'Experimental', quotes:'Citas', settings:'Configuración',
    addBook:'+ Añadir libro', searchPlaceholder:'Buscar libro, autor...',
    shelves:'Estantes',
    sortByDate:'Por fecha añadida', sortByRating:'Por puntuación', sortByTitle:'Por título (A-Z)', sortByAuthor:'Por autor',
    sortByYear:'Por año escrito',
    totalBooks:'Total de libros', readCount:'Leídos', readingNow:'Leyendo ahora',
    empty:'Aún nada aquí', emptyHint:'¡Añade tu primer libro!',
    noResults:'Nada encontrado', noResultsHint:'no dio resultados',
    deleteConfirm:'¿Eliminar este libro?',
  },
}

export default function App() {
  const [books, setBooks]       = useState([])
  const [view, setView]         = useState('all')
  const [search, setSearch]     = useState('')
  const [sort, setSort]         = useState('date')
  const [modalOpen, setModal]   = useState(false)
  const [editBook, setEditBook] = useState(null)
  const [viewBook, setViewBook] = useState(null)
  const [lang, setLang]         = useState(() => localStorage.getItem('bs_lang') || 'uk')
  const [sortMap, setSortMap]   = useState({})
  const [theme, setTheme]       = useState(() => localStorage.getItem('bs_theme') || 'dark')

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', '')
    } else {
      const mq = window.matchMedia('(prefers-color-scheme: light)')
      const apply = (e) => document.documentElement.setAttribute('data-theme', e.matches ? 'light' : '')
      apply(mq)
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [theme])

  const t = T[lang] || T.uk

  const STATUS_TITLES = {
    all: t.allBooks, read: t.read, reading: t.reading, later: t.readLater,
    stats: t.statistics, quotes: t.quotes, settings: t.settings, shelves: t.shelves || 'Полиці',
  }

  useEffect(() => { track('app:launch') }, [])

  const loadBooks = useCallback(async () => {
    const data = await window.api.getBooks()
    setBooks(data)
  }, [])

  useEffect(() => { loadBooks() }, [loadBooks])

  const handleSearch = async (q) => {
    setSearch(q)
    if (!q.trim()) { loadBooks(); return }
    track('book:search')
    const results = await window.api.searchBooks(q)
    setBooks(results)
  }

  const filtered = books.filter(b => view === 'all' ? true : b.status === view)

  const getSort = (v) => sortMap[v] || (v === 'all' ? 'date' : 'date')
  const setViewSort = (v, s) => setSortMap(m => ({...m, [v]: s}))

  const sorted = [...filtered].sort((a, b) => {
    const s = getSort(view)
    if (s === 'rating') return (b.rating||0) - (a.rating||0)
    if (s === 'title')  return a.title.localeCompare(b.title)
    if (s === 'author') return (a.author||'').localeCompare(b.author||'')
    if (s === 'year')   return (b.year_read||0) - (a.year_read||0)
    return 0 // date — already from DB desc
  })

  const counts = {
    total:   books.length,
    read:    books.filter(b => b.status === 'read').length,
    reading: books.filter(b => b.status === 'reading').length,
    later:   books.filter(b => b.status === 'later').length,
    quotes:  0,
  }

  const openAdd    = ()     => { setEditBook(null); setModal(true); track('feature:add_book_open') }
  const openEdit   = (book) => { setEditBook(book); setModal(true) }
  const closeModal = ()     => { setModal(false); setEditBook(null) }

  const handleSave = async (form) => {
    if (form.id) { await window.api.updateBook(form); track('book:edit') }
    else         { await window.api.addBook(form); track('book:add', { status: form.status, has_rating: form.rating > 0, has_cover: !!form.cover_url || !!form.cover_local }) }
    closeModal()
    loadBooks()
  }

  const handleDelete = async (id) => {
    if (!confirm(t.deleteConfirm)) return
    await window.api.deleteBook(id)
    track('book:delete')
    if (viewBook?.id === id) setViewBook(null)
    loadBooks()
  }

  const switchView = (v) => { setView(v); setSearch(''); loadBooks(); track('feature:nav', { view: v }) }

  const isBookView = !['stats','quotes','settings','shelves'].includes(view)

  return (
    <div className="app">
      <Sidebar view={view} setView={switchView} counts={counts} t={t} />

      <div className="main">
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-title">{STATUS_TITLES[view]}</div>
          {isBookView && (
            <>
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input value={search} onChange={e => handleSearch(e.target.value)} placeholder={t.searchPlaceholder} />
              </div>
              <button className="btn-add" onClick={openAdd}>{t.addBook}</button>
            </>
          )}
        </div>

        {/* Content */}
        <div className="content">
          {view === 'stats'    && <Stats lang={lang} />}
          {view === 'quotes'   && <Quotes lang={lang} />}
          {view === 'settings' && <Settings lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} />}
          {view === 'shelves'  && <Shelves lang={lang} allBooks={books} />}

          {isBookView && (
            <>
              {sorted.length > 0 && (
                <div className="filters-row">
                  <select className="sort-select" value={getSort(view)} onChange={e => setViewSort(view, e.target.value)}>
                    <option value="date">{t.sortByDate}</option>
                    <option value="rating">{t.sortByRating}</option>
                    <option value="title">{t.sortByTitle}</option>
                    <option value="author">{t.sortByAuthor}</option>
                    <option value="year">{t.sortByYear}</option>
                  </select>
                </div>
              )}

              {view === 'all' && !search && (
                <div className="stats-row">
                  <div className="stat-card purple"><div className="stat-card-num">{counts.total}</div><div className="stat-card-lbl">{t.totalBooks}</div></div>
                  <div className="stat-card green"><div className="stat-card-num">{counts.read}</div><div className="stat-card-lbl">{t.readCount}</div></div>
                  <div className="stat-card amber"><div className="stat-card-num">{counts.reading}</div><div className="stat-card-lbl">{t.readingNow}</div></div>
                  <div className="stat-card"><div className="stat-card-num">{counts.later}</div><div className="stat-card-lbl">{t.readLater}</div></div>
                </div>
              )}

              <div className="books-grid">
                {sorted.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📚</div>
                    <h3>{search ? t.noResults : t.empty}</h3>
                    <p>{search ? `"${search}" ${t.noResultsHint}` : t.emptyHint}</p>
                  </div>
                ) : sorted.map(book => (
                  <BookCard key={book.id} book={book} onClick={setViewBook} onEdit={openEdit} onDelete={handleDelete} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <UpdateBanner lang={lang} />

      {modalOpen && <BookModal book={editBook} onSave={handleSave} onClose={closeModal} />}

      {viewBook && (
        <ViewModal
          book={viewBook}
          lang={lang}
          onEdit={() => { setViewBook(null); openEdit(viewBook) }}
          onDelete={() => handleDelete(viewBook.id)}
          onClose={() => setViewBook(null)}
          onProgressUpdate={async (id, page) => {
            await window.api.updateProgress(id, page)
            loadBooks()
            setViewBook(v => v ? { ...v, current_page: page } : v)
          }}
        />
      )}
    </div>
  )
}

// ── View modal ─────────────────────────────────────────────────────
function ViewModal({ book, lang, onEdit, onDelete, onClose, onProgressUpdate }) {
  const [pageInput, setPageInput] = useState(book.current_page || 0)
  const [quotes, setQuotes]       = useState([])
  const [showQuotes, setShowQuotes] = useState(false)

  useEffect(() => {
    window.api.getBookQuotes(book.id).then(setQuotes)
  }, [book.id])

  const STATUS_LABELS = {
    uk: { read:'✅ Прочитав', reading:'📖 Читаю', later:'🔖 Read Later' },
    en: { read:'✅ Read',     reading:'📖 Reading', later:'🔖 Read Later' },
    ru: { read:'✅ Прочитал', reading:'📖 Читаю',  later:'🔖 Читать позже' },
    sv: { read:'✅ Läst',     reading:'📖 Läser',  later:'🔖 Läs senare' },
    de: { read:'✅ Gelesen',  reading:'📖 Lese',   later:'🔖 Später lesen' },
    es: { read:'✅ Leído',    reading:'📖 Leyendo', later:'🔖 Leer después' },
  }
  const sl = STATUS_LABELS[lang] || STATUS_LABELS.en

  const VM = {
    uk: { details:'Деталі книги', progress:'Прогрес читання', pages:'сторінок', page:'стор.', save:'Зберегти', language:'Мова', year:'Рік', pgLabel:'Сторінок', quotes:'Цитати з цієї книги', delete:'Видалити', close:'Закрити', edit:'Редагувати' },
    en: { details:'Book Details', progress:'Reading progress', pages:'pages', page:'p.', save:'Save', language:'Language', year:'Year', pgLabel:'Pages', quotes:'Quotes from this book', delete:'Delete', close:'Close', edit:'Edit' },
    ru: { details:'Детали книги', progress:'Прогресс чтения', pages:'страниц', page:'стр.', save:'Сохранить', language:'Язык', year:'Год', pgLabel:'Страниц', quotes:'Цитаты из этой книги', delete:'Удалить', close:'Закрыть', edit:'Редактировать' },
    sv: { details:'Bokdetaljer', progress:'Läsframsteg', pages:'sidor', page:'s.', save:'Spara', language:'Språk', year:'År', pgLabel:'Sidor', quotes:'Citat från denna bok', delete:'Ta bort', close:'Stäng', edit:'Redigera' },
    de: { details:'Buchdetails', progress:'Lesefortschritt', pages:'Seiten', page:'S.', save:'Speichern', language:'Sprache', year:'Jahr', pgLabel:'Seiten', quotes:'Zitate aus diesem Buch', delete:'Löschen', close:'Schließen', edit:'Bearbeiten' },
    es: { details:'Detalles del libro', progress:'Progreso de lectura', pages:'páginas', page:'p.', save:'Guardar', language:'Idioma', year:'Año', pgLabel:'Páginas', quotes:'Citas de este libro', delete:'Eliminar', close:'Cerrar', edit:'Editar' },
  }
  const vm = VM[lang] || VM.en

  const tags     = book.tags ? book.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  const coverSrc = book.cover_local ? `file://${book.cover_local}` : book.cover_url
  const pct      = book.status === 'reading' && book.total_pages > 0
    ? Math.min(100, Math.round((pageInput||0) / book.total_pages * 100)) : null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{vm.details}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="view-hero">
          <div className="view-cover">
            {coverSrc
              ? <img src={coverSrc} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:9}} onError={e=>{e.target.style.display='none'}} />
              : (book.cover_emoji || '📚')
            }
          </div>
          <div style={{flex:1}}>
            <div className="view-hero-title">{book.title}</div>
            {book.author && <div className="view-hero-author">{book.author}</div>}
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              <span className={`badge badge-${book.status}`}>{sl[book.status]}</span>
              {book.genre && <span className="badge badge-genre">{book.genre.split(',')[0]}</span>}
            </div>
            {book.status === 'read' && book.rating > 0 && (
              <div className="book-stars" style={{marginTop:8}}>
                {[1,2,3,4,5].map(i => <span key={i} className={`star ${i<=book.rating?'':'empty'}`} style={{fontSize:16}}>★</span>)}
                <span style={{fontSize:13,color:'var(--text3)',marginLeft:8}}>{book.rating}/5</span>
              </div>
            )}
          </div>
        </div>

        {book.status === 'reading' && book.total_pages > 0 && (
          <div style={{background:'var(--bg3)',borderRadius:'var(--radius)',padding:'12px 14px',marginBottom:14}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:13}}>
              <span style={{color:'var(--text2)'}}>{vm.progress}</span>
              <span style={{color:'var(--amber)',fontWeight:600}}>{pct}%</span>
            </div>
            <div style={{height:6,background:'var(--bg4)',borderRadius:3,overflow:'hidden',marginBottom:10}}>
              <div style={{height:'100%',width:`${pct}%`,background:'var(--amber)',borderRadius:3,transition:'width 0.3s'}} />
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <input type="number" value={pageInput} onChange={e=>setPageInput(parseInt(e.target.value)||0)}
                min={0} max={book.total_pages}
                style={{width:80,background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:6,color:'var(--text)',fontSize:13,padding:'5px 8px',fontFamily:'inherit',outline:'none'}} />
              <span style={{fontSize:13,color:'var(--text3)'}}> / {book.total_pages} {vm.pages}</span>
              <button className="btn btn-primary" style={{marginLeft:'auto',height:30,padding:'0 12px',fontSize:12}}
                onClick={() => onProgressUpdate(book.id, pageInput)}>
                {vm.save}
              </button>
            </div>
          </div>
        )}

        <div className="view-meta-grid">
          {book.language  && <div className="view-meta-item"><div className="view-meta-label">{vm.language}</div><div className="view-meta-value">{book.language}</div></div>}
          {book.year_read && <div className="view-meta-item"><div className="view-meta-label">{vm.year}</div><div className="view-meta-value">{book.year_read}</div></div>}
          {book.total_pages > 0 && <div className="view-meta-item"><div className="view-meta-label">{vm.pgLabel}</div><div className="view-meta-value">{book.total_pages}</div></div>}
        </div>

        {tags.length > 0 && (
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
            {tags.map(t => <span key={t} className="tag-chip">{t}</span>)}
          </div>
        )}

        {book.comment && <div className="view-comment">"{book.comment}"</div>}

        {quotes.length > 0 && (
          <div style={{marginTop:14}}>
            <button onClick={() => setShowQuotes(v => !v)}
              style={{background:'none',border:'none',cursor:'pointer',color:'var(--purple)',fontSize:13,fontFamily:'inherit',fontWeight:500,padding:0}}>
              💬 {vm.quotes} ({quotes.length}) {showQuotes?'▲':'▼'}
            </button>
            {showQuotes && (
              <div style={{marginTop:10,display:'flex',flexDirection:'column',gap:8}}>
                {quotes.map(q => (
                  <div key={q.id} style={{background:'var(--bg3)',borderLeft:'3px solid var(--purple)',borderRadius:'0 var(--radius) var(--radius) 0',padding:'10px 12px'}}>
                    <div style={{fontSize:13,color:'var(--text)',fontStyle:'italic',lineHeight:1.6,marginBottom:4}}>"{q.text}"</div>
                    {(q.page||q.note) && <div style={{fontSize:11,color:'var(--text3)'}}>{q.page?`${vm.page} ${q.page}`:''}{q.page&&q.note?' · ':''}{q.note}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="modal-footer">
          <button className="btn btn-danger" onClick={onDelete}>🗑️ {vm.delete}</button>
          <div style={{flex:1}} />
          <button className="btn" onClick={onClose}>{vm.close}</button>
          <button className="btn btn-primary" onClick={onEdit}>✏️ {vm.edit}</button>
        </div>
      </div>
    </div>
  )
}
