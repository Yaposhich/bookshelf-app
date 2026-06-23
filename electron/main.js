const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs   = require('fs')
const { randomUUID } = require('crypto')
const Database = require('better-sqlite3')
const { autoUpdater } = require('electron-updater')

const userDataPath = app.getPath('userData')
const dbPath = path.join(userDataPath, 'bookshelf.db')
let db

function initDB() {
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id           TEXT PRIMARY KEY,
      title        TEXT NOT NULL,
      author       TEXT,
      genre        TEXT,
      status       TEXT NOT NULL DEFAULT 'read',
      rating       INTEGER DEFAULT 0,
      language     TEXT,
      year_read    INTEGER,
      comment      TEXT,
      cover_emoji  TEXT DEFAULT '📚',
      cover_url    TEXT DEFAULT '',
      cover_local  TEXT DEFAULT '',
      ol_key       TEXT DEFAULT '',
      total_pages  INTEGER DEFAULT 0,
      current_page INTEGER DEFAULT 0,
      created_at   TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
      updated_at   TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
    );

    CREATE TABLE IF NOT EXISTS tags (
      id   TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS book_tags (
      book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
      tag_id  TEXT REFERENCES tags(id)  ON DELETE CASCADE,
      PRIMARY KEY (book_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id         TEXT PRIMARY KEY,
      book_id    TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      text       TEXT NOT NULL,
      page       INTEGER,
      note       TEXT,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
      updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
    );

    CREATE TABLE IF NOT EXISTS reading_log (
      id         TEXT PRIMARY KEY,
      book_id    TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      pages_delta INTEGER NOT NULL,
      logged_at  TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      props      TEXT DEFAULT '{}',
      ts         TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
    );

    CREATE TABLE IF NOT EXISTS shelves (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      icon       TEXT DEFAULT '📁',
      color      TEXT DEFAULT '#8b7cf8',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
      updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
    );

    CREATE TABLE IF NOT EXISTS shelf_books (
      shelf_id   TEXT REFERENCES shelves(id) ON DELETE CASCADE,
      book_id    TEXT REFERENCES books(id)   ON DELETE CASCADE,
      sort_order INTEGER DEFAULT 0,
      added_at   TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
      PRIMARY KEY (shelf_id, book_id)
    );
  `)

  // ── Migrations for existing databases ──────────────────────────
  // books columns
  const bookCols = db.prepare('PRAGMA table_info(books)').all().map(c => c.name)
  if (!bookCols.includes('cover_url'))    db.exec("ALTER TABLE books ADD COLUMN cover_url TEXT DEFAULT ''")
  if (!bookCols.includes('cover_local'))  db.exec("ALTER TABLE books ADD COLUMN cover_local TEXT DEFAULT ''")
  if (!bookCols.includes('ol_key'))       db.exec("ALTER TABLE books ADD COLUMN ol_key TEXT DEFAULT ''")
  if (!bookCols.includes('total_pages'))  db.exec("ALTER TABLE books ADD COLUMN total_pages INTEGER DEFAULT 0")
  if (!bookCols.includes('current_page')) db.exec("ALTER TABLE books ADD COLUMN current_page INTEGER DEFAULT 0")
  if (!bookCols.includes('updated_at'))   db.exec("ALTER TABLE books ADD COLUMN updated_at TEXT DEFAULT ''")

  // quotes columns
  const quoteCols = db.prepare('PRAGMA table_info(quotes)').all().map(c => c.name)
  if (!quoteCols.includes('updated_at'))  db.exec("ALTER TABLE quotes ADD COLUMN updated_at TEXT DEFAULT ''")

  // ── Migrate integer IDs → UUID for existing rows ───────────────
  // Only runs if id column type is INTEGER (old schema)
  const bookIdType = db.prepare("PRAGMA table_info(books)").all().find(c => c.name === 'id')?.type || ''
  if (bookIdType.toUpperCase().includes('INTEGER') || bookIdType.toUpperCase() === 'INT') {
    migrateToUUID()
  }
}

// Migrate old INTEGER PKs to UUID — runs once on first launch after update
function migrateToUUID() {
  const migrateTable = (table, fkTable, fkCol) => {
    const rows = db.prepare(`SELECT * FROM ${table}`).all()
    if (rows.length === 0) return

    // Rename old table
    db.exec(`ALTER TABLE ${table} RENAME TO ${table}_old`)

    // Recreate with TEXT id
    if (table === 'books') {
      db.exec(`
        CREATE TABLE books (
          id TEXT PRIMARY KEY, title TEXT NOT NULL, author TEXT, genre TEXT,
          status TEXT NOT NULL DEFAULT 'read', rating INTEGER DEFAULT 0,
          language TEXT, year_read INTEGER, comment TEXT,
          cover_emoji TEXT DEFAULT '📚', cover_url TEXT DEFAULT '',
          cover_local TEXT DEFAULT '', ol_key TEXT DEFAULT '',
          total_pages INTEGER DEFAULT 0, current_page INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
          updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
        )`)
    } else if (table === 'tags') {
      db.exec(`CREATE TABLE tags (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE)`)
    } else if (table === 'quotes') {
      db.exec(`
        CREATE TABLE quotes (
          id TEXT PRIMARY KEY, book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
          text TEXT NOT NULL, page INTEGER, note TEXT,
          created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
          updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
        )`)
    }

    // Build old_id → new_uuid map and insert
    const idMap = {}
    for (const row of rows) {
      const newId = randomUUID()
      idMap[row.id] = newId
      const cols = Object.keys(row).filter(k => k !== 'id').join(',')
      const vals = Object.keys(row).filter(k => k !== 'id').map(k => {
        const v = row[k]; return v === null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`
      }).join(',')
      db.exec(`INSERT INTO ${table} (id,${cols}) VALUES ('${newId}',${vals})`)
    }
    db.exec(`DROP TABLE ${table}_old`)
    return idMap
  }

  try {
    db.exec('BEGIN')
    // Drop FKs first by dropping junction table
    const bookTagRows = db.prepare('SELECT * FROM book_tags').all()
    const quoteRows   = db.prepare('SELECT * FROM quotes').all()
    db.exec('DROP TABLE IF EXISTS book_tags')
    db.exec('DROP TABLE IF EXISTS quotes')

    const bookIdMap = migrateTable('books')
    const tagIdMap  = migrateTable('tags')

    // Recreate book_tags with UUID ids
    db.exec(`
      CREATE TABLE IF NOT EXISTS book_tags (
        book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
        tag_id  TEXT REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (book_id, tag_id)
      )`)

    // Recreate quotes with UUID ids
    db.exec(`
      CREATE TABLE IF NOT EXISTS quotes (
        id TEXT PRIMARY KEY, book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        text TEXT NOT NULL, page INTEGER, note TEXT,
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
        updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
      )`)

    // Re-insert book_tags with mapped UUIDs
    for (const bt of bookTagRows) {
      const newBook = bookIdMap?.[bt.book_id]
      const newTag  = tagIdMap?.[bt.tag_id]
      if (newBook && newTag) {
        db.exec(`INSERT OR IGNORE INTO book_tags VALUES ('${newBook}','${newTag}')`)
      }
    }

    // Re-insert quotes with mapped UUIDs
    for (const q of quoteRows) {
      const newBook = bookIdMap?.[q.book_id]
      if (newBook) {
        const id = randomUUID()
        const text = String(q.text||'').replace(/'/g,"''")
        const note = q.note ? `'${String(q.note).replace(/'/g,"''")}` : 'NULL'
        db.exec(`INSERT INTO quotes (id,book_id,text,page,note,created_at) VALUES ('${id}','${newBook}','${text}',${q.page||'NULL'},${note === 'NULL' ? 'NULL' : note+"'"},'${q.created_at||new Date().toISOString()}')`)
      }
    }

    db.exec('COMMIT')
  } catch(e) {
    db.exec('ROLLBACK')
    console.error('UUID migration failed:', e)
  }
}

// ─── Helpers ──────────────────────────────────────────────────────
const BOOK_SELECT = `
  SELECT b.*,
    GROUP_CONCAT(DISTINCT t.name) as tags
  FROM books b
  LEFT JOIN book_tags bt ON bt.book_id = b.id
  LEFT JOIN tags t ON t.id = bt.tag_id
`

const now = () => new Date().toISOString()

function insertTags(bookId, tags) {
  for (const name of tags) {
    const trimmed = name.trim()
    if (!trimmed) continue
    const tagId = randomUUID()
    db.prepare('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)').run(tagId, trimmed)
    const tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(trimmed)
    db.prepare('INSERT OR IGNORE INTO book_tags (book_id, tag_id) VALUES (?, ?)').run(bookId, tag.id)
  }
}

function sanitizeBook(b) {
  return {
    title:        b.title        || '',
    author:       b.author       || '',
    genre:        b.genre        || '',
    status:       b.status       || 'read',
    rating:       b.rating       || 0,
    language:     b.language     || '',
    year_read:    b.year_read    || null,
    comment:      b.comment      || '',
    cover_emoji:  b.cover_emoji  || '📚',
    cover_url:    b.cover_url    || '',
    cover_local:  b.cover_local  || '',
    ol_key:       b.ol_key       || '',
    total_pages:  b.total_pages  || 0,
    current_page: b.current_page || 0,
  }
}

// ─── Books ────────────────────────────────────────────────────────
ipcMain.handle('books:getAll', () => {
  return db.prepare(BOOK_SELECT + ' GROUP BY b.id ORDER BY b.created_at DESC').all()
})

ipcMain.handle('books:add', (_, book) => {
  const s  = sanitizeBook(book)
  const id = randomUUID()
  const ts = now()
  db.prepare(`
    INSERT INTO books (id,title,author,genre,status,rating,language,year_read,comment,cover_emoji,cover_url,cover_local,ol_key,total_pages,current_page,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, s.title, s.author, s.genre, s.status, s.rating, s.language, s.year_read, s.comment, s.cover_emoji, s.cover_url, s.cover_local, s.ol_key, s.total_pages, s.current_page, ts, ts)
  if (book.tags?.length) insertTags(id, book.tags)
  return db.prepare(BOOK_SELECT + ' WHERE b.id = ? GROUP BY b.id').get(id)
})

ipcMain.handle('books:update', (_, book) => {
  const before = db.prepare('SELECT status, total_pages FROM books WHERE id=?').get(book.id)
  const s = sanitizeBook(book)
  db.prepare(`
    UPDATE books SET
      title=?,author=?,genre=?,status=?,rating=?,language=?,year_read=?,comment=?,
      cover_emoji=?,cover_url=?,cover_local=?,ol_key=?,total_pages=?,current_page=?,
      updated_at=?
    WHERE id=?
  `).run(s.title, s.author, s.genre, s.status, s.rating, s.language, s.year_read, s.comment, s.cover_emoji, s.cover_url, s.cover_local, s.ol_key, s.total_pages, s.current_page, now(), book.id)
  db.prepare('DELETE FROM book_tags WHERE book_id = ?').run(book.id)
  if (book.tags?.length) insertTags(book.id, book.tags)

  // Log pages when a book transitions into "read" status (counts the full book toward reading stats)
  if (before && before.status !== 'read' && s.status === 'read' && s.total_pages > 0) {
    db.prepare('INSERT INTO reading_log (id,book_id,pages_delta,logged_at) VALUES (?,?,?,?)')
      .run(randomUUID(), book.id, s.total_pages, now())
  }

  return db.prepare(BOOK_SELECT + ' WHERE b.id = ? GROUP BY b.id').get(book.id)
})

ipcMain.handle('books:updateProgress', (_, { id, current_page }) => {
  const before = db.prepare('SELECT current_page FROM books WHERE id=?').get(id)
  const prevPage = before?.current_page || 0
  const delta = current_page - prevPage

  db.prepare('UPDATE books SET current_page=?, updated_at=? WHERE id=?').run(current_page, now(), id)

  // Log only forward progress (positive delta) for reading stats
  if (delta > 0) {
    db.prepare('INSERT INTO reading_log (id,book_id,pages_delta,logged_at) VALUES (?,?,?,?)')
      .run(randomUUID(), id, delta, now())
  }

  return { success: true }
})

ipcMain.handle('books:delete', (_, id) => {
  const book = db.prepare('SELECT cover_local FROM books WHERE id = ?').get(id)
  if (book?.cover_local) { try { fs.unlinkSync(book.cover_local) } catch {} }
  db.prepare('DELETE FROM books WHERE id = ?').run(id)
  return { success: true }
})

ipcMain.handle('books:search', (_, query) => {
  const q = `%${query}%`
  return db.prepare(BOOK_SELECT + `
    WHERE b.title LIKE ? OR b.author LIKE ? OR b.genre LIKE ?
    GROUP BY b.id ORDER BY b.created_at DESC
  `).all(q, q, q)
})

// ─── Cover upload ─────────────────────────────────────────────────
ipcMain.handle('books:pickCover', async (_, bookId) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Обери обкладинку',
    filters: [{ name: 'Images', extensions: ['jpg','jpeg','png','webp','gif'] }],
    properties: ['openFile']
  })
  if (canceled || !filePaths[0]) return null
  const ext  = path.extname(filePaths[0])
  const dest = path.join(userDataPath, 'covers', `${bookId}${ext}`)
  fs.mkdirSync(path.join(userDataPath, 'covers'), { recursive: true })
  fs.copyFileSync(filePaths[0], dest)
  db.prepare('UPDATE books SET cover_local=?, cover_url=?, updated_at=? WHERE id=?').run(dest, '', now(), bookId)
  return dest
})

// ─── Quotes ───────────────────────────────────────────────────────
ipcMain.handle('quotes:getAll', () => {
  return db.prepare(`
    SELECT q.*, b.title as book_title, b.author as book_author,
           b.cover_emoji, b.cover_url, b.cover_local
    FROM quotes q JOIN books b ON b.id = q.book_id
    ORDER BY q.created_at DESC
  `).all()
})

ipcMain.handle('quotes:getByBook', (_, bookId) => {
  return db.prepare('SELECT * FROM quotes WHERE book_id=? ORDER BY page ASC, created_at ASC').all(bookId)
})

ipcMain.handle('quotes:add', (_, quote) => {
  const id = randomUUID()
  const ts = now()
  db.prepare('INSERT INTO quotes (id,book_id,text,page,note,created_at,updated_at) VALUES (?,?,?,?,?,?,?)')
    .run(id, quote.book_id, quote.text, quote.page||null, quote.note||'', ts, ts)
  return db.prepare('SELECT * FROM quotes WHERE id=?').get(id)
})

ipcMain.handle('quotes:update', (_, quote) => {
  db.prepare('UPDATE quotes SET text=?,page=?,note=?,updated_at=? WHERE id=?')
    .run(quote.text, quote.page||null, quote.note||'', now(), quote.id)
  return db.prepare('SELECT * FROM quotes WHERE id=?').get(quote.id)
})

ipcMain.handle('quotes:delete', (_, id) => {
  db.prepare('DELETE FROM quotes WHERE id=?').run(id)
  return { success: true }
})

// ─── Shelves ──────────────────────────────────────────────────────
ipcMain.handle('shelves:getAll', () => {
  const shelves = db.prepare('SELECT * FROM shelves ORDER BY sort_order ASC, created_at ASC').all()
  return shelves.map(s => ({
    ...s,
    book_count: db.prepare('SELECT COUNT(*) as c FROM shelf_books WHERE shelf_id=?').get(s.id).c
  }))
})

ipcMain.handle('shelves:add', (_, shelf) => {
  const id = randomUUID(); const ts = now()
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM shelves').get().m || 0
  db.prepare('INSERT INTO shelves (id,name,icon,color,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?)')
    .run(id, shelf.name, shelf.icon||'📁', shelf.color||'#8b7cf8', maxOrder+1, ts, ts)
  return db.prepare('SELECT * FROM shelves WHERE id=?').get(id)
})

ipcMain.handle('shelves:update', (_, shelf) => {
  db.prepare('UPDATE shelves SET name=?,icon=?,color=?,updated_at=? WHERE id=?')
    .run(shelf.name, shelf.icon||'📁', shelf.color||'#8b7cf8', now(), shelf.id)
  return db.prepare('SELECT * FROM shelves WHERE id=?').get(shelf.id)
})

ipcMain.handle('shelves:delete', (_, id) => {
  db.prepare('DELETE FROM shelves WHERE id=?').run(id)
  return { success: true }
})

ipcMain.handle('shelves:getBooks', (_, shelfId) => {
  return db.prepare(`
    SELECT b.*, GROUP_CONCAT(DISTINCT t.name) as tags, sb.sort_order as shelf_order, sb.added_at
    FROM shelf_books sb
    JOIN books b ON b.id = sb.book_id
    LEFT JOIN book_tags bt ON bt.book_id = b.id
    LEFT JOIN tags t ON t.id = bt.tag_id
    WHERE sb.shelf_id = ?
    GROUP BY b.id
    ORDER BY sb.sort_order ASC, sb.added_at ASC
  `).all(shelfId)
})

ipcMain.handle('shelves:addBook', (_, { shelf_id, book_id }) => {
  const exists = db.prepare('SELECT 1 FROM shelf_books WHERE shelf_id=? AND book_id=?').get(shelf_id, book_id)
  if (exists) return { success: true, already: true }
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM shelf_books WHERE shelf_id=?').get(shelf_id).m || 0
  db.prepare('INSERT INTO shelf_books (shelf_id,book_id,sort_order,added_at) VALUES (?,?,?,?)')
    .run(shelf_id, book_id, maxOrder+1, now())
  return { success: true }
})

ipcMain.handle('shelves:removeBook', (_, { shelf_id, book_id }) => {
  db.prepare('DELETE FROM shelf_books WHERE shelf_id=? AND book_id=?').run(shelf_id, book_id)
  return { success: true }
})

// ─── Tags & Stats ─────────────────────────────────────────────────
ipcMain.handle('tags:getAll', () => {
  return db.prepare('SELECT * FROM tags ORDER BY name').all()
})

ipcMain.handle('stats:get', () => {
  const total   = db.prepare('SELECT COUNT(*) as c FROM books').get().c
  const read    = db.prepare("SELECT COUNT(*) as c FROM books WHERE status='read'").get().c
  const later   = db.prepare("SELECT COUNT(*) as c FROM books WHERE status='later'").get().c
  const reading = db.prepare("SELECT COUNT(*) as c FROM books WHERE status='reading'").get().c
  const avgRaw  = db.prepare("SELECT AVG(rating) as a FROM books WHERE status='read' AND rating>0").get().a
  const avg     = avgRaw ? Math.round(avgRaw * 10) / 10 : 0
  const byLang  = db.prepare("SELECT language, COUNT(*) as c FROM books WHERE language!='' AND language IS NOT NULL GROUP BY language ORDER BY c DESC").all()
  const byGenre = db.prepare("SELECT genre, COUNT(*) as c FROM books WHERE genre!='' AND genre IS NOT NULL GROUP BY genre ORDER BY c DESC LIMIT 5").all()
  const byYear  = db.prepare("SELECT year_read, COUNT(*) as c FROM books WHERE year_read IS NOT NULL GROUP BY year_read ORDER BY year_read DESC").all()
  const quotes  = db.prepare('SELECT COUNT(*) as c FROM quotes').get().c

  // Time-based counts using device local time
  const nowTs = new Date()
  const startOfDay = new Date(nowTs); startOfDay.setHours(0,0,0,0)
  const startOfWeek = new Date(nowTs)
  startOfWeek.setDate(nowTs.getDate() - ((nowTs.getDay()+6)%7)); startOfWeek.setHours(0,0,0,0)
  const startOfYear = new Date(nowTs.getFullYear(), 0, 1)

  const countSince = (since) =>
    db.prepare("SELECT COUNT(*) as c FROM books WHERE status='read' AND created_at >= ?").get(since.toISOString()).c

  // Pages read — based on actual reading_log entries (when user updated progress or marked as read)
  const pagesSince = (since) =>
    db.prepare("SELECT COALESCE(SUM(pages_delta),0) as p FROM reading_log WHERE logged_at >= ?").get(since.toISOString()).p

  const readToday   = countSince(startOfDay)
  const readWeek    = countSince(startOfWeek)
  const readYear    = countSince(startOfYear)
  const readAllTime = read

  const pagesToday   = pagesSince(startOfDay)
  const pagesWeek    = pagesSince(startOfWeek)
  const pagesYear    = pagesSince(startOfYear)
  const pagesAllTime = db.prepare("SELECT COALESCE(SUM(pages_delta),0) as p FROM reading_log").get().p

  return { total, read, later, reading, avg, byLang, byGenre, byYear, quotes,
    readToday, readWeek, readYear, readAllTime,
    pagesToday, pagesWeek, pagesYear, pagesAllTime }
})

// ─── Analytics ───────────────────────────────────────────────────
ipcMain.handle('analytics:track', (_, { name, props }) => {
  try {
    db.prepare('INSERT INTO events (id,name,props,ts) VALUES (?,?,?,?)')
      .run(randomUUID(), name, JSON.stringify(props||{}), now())
  } catch(e) {}
  return { ok: true }
})

ipcMain.handle('analytics:export', () => {
  // Aggregate — no personal data, only usage patterns
  const eventCounts = db.prepare(`
    SELECT name, COUNT(*) as count,
      MIN(ts) as first_seen, MAX(ts) as last_seen
    FROM events GROUP BY name ORDER BY count DESC
  `).all()

  const dailyActivity = db.prepare(`
    SELECT substr(ts,1,10) as day, COUNT(*) as actions
    FROM events
    GROUP BY day ORDER BY day DESC LIMIT 30
  `).all()

  const sessionCount = db.prepare(`
    SELECT COUNT(*) as c FROM events WHERE name='app:launch'
  `).get().c

  const featureUsage = db.prepare(`
    SELECT name, COUNT(*) as count FROM events
    WHERE name LIKE 'feature:%'
    GROUP BY name ORDER BY count DESC
  `).all()

  const searchCount = db.prepare(`
    SELECT COUNT(*) as c FROM events WHERE name='book:search'
  `).get().c

  const sourceUsage = db.prepare(`
    SELECT json_extract(props,'$.source') as source, COUNT(*) as c
    FROM events WHERE name='book:search' AND source IS NOT NULL
    GROUP BY source
  `).all()

  return {
    exported_at:   now(),
    app_version:   '1.0.0',
    platform:      process.platform,
    total_sessions: sessionCount,
    total_actions:  db.prepare('SELECT COUNT(*) as c FROM events').get().c,
    event_counts:   eventCounts,
    daily_activity: dailyActivity,
    feature_usage:  featureUsage,
    search_stats:   { total: searchCount, by_source: sourceUsage },
    library_stats: {
      total_books:  db.prepare('SELECT COUNT(*) as c FROM books').get().c,
      total_quotes: db.prepare('SELECT COUNT(*) as c FROM quotes').get().c,
      total_shelves:db.prepare('SELECT COUNT(*) as c FROM shelves').get().c,
      status_breakdown: db.prepare("SELECT status, COUNT(*) as c FROM books GROUP BY status").all(),
      avg_rating:   db.prepare("SELECT ROUND(AVG(rating),1) as a FROM books WHERE rating>0").get().a,
    }
  }
})

// ─── Export / Import ──────────────────────────────────────────────
ipcMain.handle('data:export', async () => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Зберегти бібліотеку',
    defaultPath: `bookshelf-export-${new Date().toISOString().slice(0,10)}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })
  if (canceled || !filePath) return { canceled: true }

  const books = db.prepare('SELECT * FROM books').all()
  const quotes = db.prepare('SELECT * FROM quotes').all()
  const shelves = db.prepare('SELECT * FROM shelves').all()
  const shelfBooks = db.prepare('SELECT * FROM shelf_books').all()
  const tags = db.prepare('SELECT * FROM tags').all()
  const bookTags = db.prepare('SELECT * FROM book_tags').all()

  const exportData = {
    version: '1.0',
    exported_at: now(),
    books, quotes, shelves, shelf_books: shelfBooks, tags, book_tags: bookTags
  }

  fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf8')
  return { success: true, filePath }
})

ipcMain.handle('data:import', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Імпортувати бібліотеку',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  })
  if (canceled || !filePaths[0]) return { canceled: true }

  try {
    const raw  = fs.readFileSync(filePaths[0], 'utf8')
    const data = JSON.parse(raw)
    if (!data.books) return { error: 'Невірний формат файлу' }

    db.exec('BEGIN')
    // Insert books (skip duplicates by id)
    for (const b of data.books||[]) {
      const exists = db.prepare('SELECT 1 FROM books WHERE id=?').get(b.id)
      if (!exists) {
        const cols = Object.keys(b).join(',')
        const placeholders = Object.keys(b).map(()=>'?').join(',')
        db.prepare(`INSERT OR IGNORE INTO books (${cols}) VALUES (${placeholders})`).run(Object.values(b))
      }
    }
    for (const t of data.tags||[]) {
      db.prepare('INSERT OR IGNORE INTO tags (id,name) VALUES (?,?)').run(t.id, t.name)
    }
    for (const bt of data.book_tags||[]) {
      db.prepare('INSERT OR IGNORE INTO book_tags (book_id,tag_id) VALUES (?,?)').run(bt.book_id, bt.tag_id)
    }
    for (const q of data.quotes||[]) {
      db.prepare('INSERT OR IGNORE INTO quotes (id,book_id,text,page,note,created_at,updated_at) VALUES (?,?,?,?,?,?,?)')
        .run(q.id, q.book_id, q.text, q.page||null, q.note||'', q.created_at||now(), q.updated_at||now())
    }
    for (const s of data.shelves||[]) {
      db.prepare('INSERT OR IGNORE INTO shelves (id,name,icon,color,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?)')
        .run(s.id, s.name, s.icon||'📁', s.color||'#8b7cf8', s.sort_order||0, s.created_at||now(), s.updated_at||now())
    }
    for (const sb of data.shelf_books||[]) {
      db.prepare('INSERT OR IGNORE INTO shelf_books (shelf_id,book_id,sort_order,added_at) VALUES (?,?,?,?)')
        .run(sb.shelf_id, sb.book_id, sb.sort_order||0, sb.added_at||now())
    }
    db.exec('COMMIT')
    return { success: true, count: (data.books||[]).length }
  } catch(e) {
    db.exec('ROLLBACK')
    return { error: e.message }
  }
})

ipcMain.handle('analytics:exportFile', async () => {
  const data = await ipcMain.emit  // handled separately
  const analyticsData = (() => {
    const eventCounts = db.prepare('SELECT name, COUNT(*) as count FROM events GROUP BY name ORDER BY count DESC').all()
    const dailyActivity = db.prepare("SELECT substr(ts,1,10) as day, COUNT(*) as actions FROM events GROUP BY day ORDER BY day DESC LIMIT 30").all()
    const featureUsage = db.prepare("SELECT name, COUNT(*) as count FROM events WHERE name LIKE 'feature:%' GROUP BY name ORDER BY count DESC").all()
    const sessionCount = db.prepare("SELECT COUNT(*) as c FROM events WHERE name='app:launch'").get().c
    return {
      exported_at: now(), app_version: '1.0.0', platform: process.platform,
      total_sessions: sessionCount,
      total_actions: db.prepare('SELECT COUNT(*) as c FROM events').get().c,
      event_counts: eventCounts, daily_activity: dailyActivity, feature_usage: featureUsage,
      library_stats: {
        total_books: db.prepare('SELECT COUNT(*) as c FROM books').get().c,
        total_quotes: db.prepare('SELECT COUNT(*) as c FROM quotes').get().c,
        total_shelves: db.prepare('SELECT COUNT(*) as c FROM shelves').get().c,
        status_breakdown: db.prepare('SELECT status, COUNT(*) as c FROM books GROUP BY status').all(),
        avg_rating: db.prepare('SELECT ROUND(AVG(rating),1) as a FROM books WHERE rating>0').get().a,
      }
    }
  })()

  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Зберегти аналітику',
    defaultPath: `bookshelf-analytics-${new Date().toISOString().slice(0,10)}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })
  if (canceled || !filePath) return { canceled: true }
  fs.writeFileSync(filePath, JSON.stringify(analyticsData, null, 2), 'utf8')
  return { success: true, filePath }
})

// ─── Window ───────────────────────────────────────────────────────
let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, height: 800, minWidth: 900, minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f0f0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    }
  })
  if (!app.isPackaged) mainWindow.loadURL('http://localhost:5173')
  else mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
}

// ─── Auto-updater ───────────────────────────────────────────────────
function setupAutoUpdater() {
  if (!app.isPackaged) return // skip in dev mode

  autoUpdater.autoDownload = false
  autoUpdater.channel = 'latest'
  if (process.platform === 'darwin') {
  	autoUpdater.updateConfigPath = null
  }
  autoUpdater.autoInstallOnAppQuit = false

  const send = (channel, data) => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, data)
  }

  autoUpdater.on('update-available', (info) => {
    send('updater:status', { state: 'available', version: info.version })
  })

  autoUpdater.on('update-not-available', () => {
    send('updater:status', { state: 'not-available' })
  })

  autoUpdater.on('download-progress', (progress) => {
    send('updater:status', { state: 'downloading', percent: Math.round(progress.percent) })
  })

  autoUpdater.on('update-downloaded', (info) => {
    send('updater:status', { state: 'ready', version: info.version })
  })

  autoUpdater.on('error', (err) => {
    send('updater:status', { state: 'error', message: err.message })
  })

  // Check on launch, then every 4 hours
  autoUpdater.checkForUpdates().catch(() => {})
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 4 * 60 * 60 * 1000)
}

ipcMain.handle('updater:downloadNow', () => {
  autoUpdater.downloadUpdate().catch(() => {})
  return { ok: true }
})

ipcMain.handle('updater:installNow', () => {
  try {
    autoUpdater.quitAndInstall(false, true);
    setTimeout(() => { app.relaunch(); app.exit(0); }, 3000)
  } catch(e) {
    // fallback: relaunch manually
    app.relaunch()
    app.exit(0)
  }
  return { ok: true }
})

ipcMain.handle('updater:checkNow', async () => {
  if (!app.isPackaged) return { dev: true }
  try {
    await autoUpdater.checkForUpdates()
    return { ok: true }
  } catch(e) {
    const errorDetail = `${e.message}\n\nStack:\n${e.stack || 'no stack'}`
    try {
      fs.writeFileSync(path.join(userDataPath, 'update-error.log'), errorDetail, 'utf8')
    } catch {}
    return { error: e.message }
  }
})

ipcMain.handle('updater:openErrorLog', () => {
  const logPath = path.join(userDataPath, 'update-error.log')
  if (fs.existsSync(logPath)) {
    require('electron').shell.showItemInFolder(logPath)
    return { path: logPath }
  }
  return { error: 'no log' }
})

app.whenReady().then(() => {
  initDB()
  createWindow()
  setupAutoUpdater()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
