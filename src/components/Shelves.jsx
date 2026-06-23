import { useState, useEffect } from 'react'

const ICONS  = ['📁','📚','⭐','❤️','🔥','🎯','💡','🏆','🌟','🎨','🔬','🌍','⚔️','🚀','🧠','🎭','🌿','💼','🔮','🎵']
const COLORS = ['#8b7cf8','#4ade80','#fbbf24','#f87171','#60a5fa','#f472b6','#34d399','#fb923c','#a78bfa','#2dd4bf']

export default function Shelves({ lang, allBooks }) {
  const [shelves, setShelves]       = useState([])
  const [activeShelf, setActive]    = useState(null)
  const [shelfBooks, setShelfBooks] = useState([])
  const [sort, setSort]             = useState('added')
  const [modalOpen, setModal]       = useState(false)
  const [editShelf, setEditShelf]   = useState(null)
  const [form, setForm]             = useState({ name:'', icon:'📁', color:'#8b7cf8' })
  const [addBooksOpen, setAddBooksRaw] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const [bookSearch, setBookSearch] = useState('')

  const setAddBooks = (val) => { setAddBooksRaw(val); if (!val) setBookSearch('') }

  const uk = lang !== 'en'

  const load = async () => {
    const s = await window.api.getShelves()
    setShelves(s)
    if (activeShelf) {
      const books = await window.api.getShelfBooks(activeShelf.id)
      setShelfBooks(books)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (activeShelf) window.api.getShelfBooks(activeShelf.id).then(setShelfBooks)
  }, [activeShelf])

  const openAdd = () => { setForm({ name:'', icon:'📁', color:'#8b7cf8' }); setEditShelf(null); setModal(true) }
  const openEdit = (s, e) => { e.stopPropagation(); setForm({ name:s.name, icon:s.icon, color:s.color }); setEditShelf(s); setModal(true) }

  const handleSave = async () => {
    if (!form.name.trim()) return
    if (editShelf) await window.api.updateShelf({ ...editShelf, ...form })
    else           await window.api.addShelf(form)
    setModal(false); load()
  }

  const handleDeleteShelf = async (s, e) => {
    e.stopPropagation()
    setConfirmDel(s)
  }

  const confirmDelete = async () => {
    await window.api.deleteShelf(confirmDel.id)
    if (activeShelf?.id === confirmDel.id) { setActive(null); setShelfBooks([]) }
    setConfirmDel(null); load()
  }

  const handleRemoveBook = async (bookId) => {
    await window.api.removeBookFromShelf(activeShelf.id, bookId)
    const books = await window.api.getShelfBooks(activeShelf.id)
    setShelfBooks(books); load()
  }

  const handleAddBooks = async (bookId) => {
    await window.api.addBookToShelf(activeShelf.id, bookId)
    const books = await window.api.getShelfBooks(activeShelf.id)
    setShelfBooks(books); setAddBooks(false); load()
  }

  // Sort shelf books
  const sortedBooks = [...shelfBooks].sort((a, b) => {
    if (sort === 'title')   return a.title.localeCompare(b.title)
    if (sort === 'author')  return (a.author||'').localeCompare(b.author||'')
    if (sort === 'rating')  return (b.rating||0) - (a.rating||0)
    if (sort === 'year')    return (b.year_read||0) - (a.year_read||0)
    return 0 // added — already ordered by added_at from DB
  })

  // Books not in shelf yet
  const shelfBookIds = new Set(shelfBooks.map(b => b.id))
  const availableBooks = (allBooks||[]).filter(b => !shelfBookIds.has(b.id))

  const coverSrc = (b) => b.cover_local ? `file://${b.cover_local}` : b.cover_url

  return (
    <div style={{ display:'flex', gap:0, height:'100%', margin:'-20px', overflow:'hidden' }}>

      {/* ── Shelf list panel ── */}
      <div style={{ width:220, borderRight:'1px solid var(--border)', background:'var(--bg2)', display:'flex', flexDirection:'column', flexShrink:0, overflow:'hidden' }}>
        <div style={{ padding:'14px 14px 10px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:12, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
            {uk?'Мої полиці':'My Shelves'}
          </span>
          <button onClick={openAdd} style={{ width:24, height:24, borderRadius:6, border:'1px solid var(--border)', background:'var(--bg3)', color:'var(--text2)', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'8px 8px' }}>
          {shelves.length === 0 ? (
            <div style={{ padding:'20px 8px', textAlign:'center', color:'var(--text3)', fontSize:12, lineHeight:1.6 }}>
              {uk?'Ще немає полиць.\nНатисни + щоб створити':'No shelves yet.\nClick + to create one'}
            </div>
          ) : shelves.map(s => (
            <div key={s.id}
              onClick={() => setActive(a => a?.id===s.id ? null : s)}
              style={{
                display:'flex', alignItems:'center', gap:8, padding:'8px 10px',
                borderRadius:'var(--radius)', cursor:'pointer', marginBottom:2,
                background: activeShelf?.id===s.id ? 'var(--purple-bg)' : 'transparent',
                border: `1px solid ${activeShelf?.id===s.id ? 'var(--purple)' : 'transparent'}`,
                color: activeShelf?.id===s.id ? 'var(--purple)' : 'var(--text2)',
                transition:'all 0.12s', position:'relative',
              }}
              onMouseEnter={e => { if(activeShelf?.id!==s.id){ e.currentTarget.style.background='var(--bg3)' }}}
              onMouseLeave={e => { if(activeShelf?.id!==s.id){ e.currentTarget.style.background='transparent' }}}
            >
              <span style={{ fontSize:16 }}>{s.icon}</span>
              <span style={{ flex:1, fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</span>
              <span style={{ fontSize:11, color:'var(--text3)', background:'var(--bg4)', borderRadius:10, padding:'1px 6px', flexShrink:0 }}>{s.book_count}</span>
              {/* edit/delete appear on hover */}
              <div style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', display:'flex', gap:3, opacity:0, transition:'opacity 0.1s' }}
                className="shelf-actions">
                <button onClick={e=>openEdit(s,e)} style={{ width:20, height:20, borderRadius:4, border:'none', background:'var(--bg4)', color:'var(--text3)', cursor:'pointer', fontSize:10, display:'flex', alignItems:'center', justifyContent:'center' }}>✏️</button>
                <button onClick={e=>handleDeleteShelf(s,e)} style={{ width:20, height:20, borderRadius:4, border:'none', background:'var(--red-bg)', color:'var(--red)', cursor:'pointer', fontSize:10, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Books in shelf ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {!activeShelf ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--text3)', gap:12 }}>
            <span style={{ fontSize:48 }}>📁</span>
            <div style={{ fontSize:15, color:'var(--text2)', fontWeight:500 }}>{uk?'Обери полицю':'Select a shelf'}</div>
            <div style={{ fontSize:13 }}>{uk?'або створи нову натиснувши +':'or create a new one with +'}</div>
          </div>
        ) : (
          <>
            {/* Shelf header */}
            <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:22 }}>{activeShelf.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:16, fontWeight:600 }}>{activeShelf.name}</div>
                <div style={{ fontSize:12, color:'var(--text3)' }}>{shelfBooks.length} {uk?'книг':'books'}</div>
              </div>
              {/* Sort */}
              <select value={sort} onChange={e=>setSort(e.target.value)}
                style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', color:'var(--text2)', fontSize:12, padding:'5px 10px', fontFamily:'inherit', outline:'none' }}>
                <option value="added">{uk?'За датою додавання':'By date added'}</option>
                <option value="title">{uk?'За назвою А-Я':'By title A-Z'}</option>
                <option value="author">{uk?'За автором':'By author'}</option>
                <option value="rating">{uk?'За оцінкою':'By rating'}</option>
                <option value="year">{uk?'За роком написання':'By year'}</option>
              </select>
              <button className="btn-add" onClick={() => setAddBooks(true)}>
                {uk?'+ Додати книгу':'+ Add book'}
              </button>
            </div>

            {/* Books grid */}
            <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
              {sortedBooks.length === 0 ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--text3)', gap:10, paddingTop:60 }}>
                  <span style={{ fontSize:40 }}>📚</span>
                  <div style={{ fontSize:14, color:'var(--text2)' }}>{uk?'Полиця порожня':'Shelf is empty'}</div>
                  <div style={{ fontSize:12 }}>{uk?'Натисни "+ Додати книгу" щоб наповнити':'Click "+ Add book" to fill it'}</div>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {sortedBooks.map(book => (
                    <div key={book.id} style={{ display:'flex', gap:12, alignItems:'center', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'10px 14px' }}>
                      <div style={{ width:38, height:52, borderRadius:6, background:'var(--bg3)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0, overflow:'hidden' }}>
                        {coverSrc(book)
                          ? <img src={coverSrc(book)} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{e.target.style.display='none'}} />
                          : (book.cover_emoji||'📚')
                        }
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{book.title}</div>
                        <div style={{ fontSize:12, color:'var(--text3)' }}>{book.author||'—'}{book.year_read?` · ${book.year_read}`:''}</div>
                        {book.rating>0 && (
                          <span style={{ fontSize:10, fontWeight:600, color:'#fbbf24', marginTop:3, display:'inline-block' }}>
                            ★ {book.rating}/10
                          </span>
                        )}
                      </div>
                      <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                        {book.status && (
                          <span style={{ fontSize:10, padding:'2px 7px', borderRadius:20, background:'var(--bg3)', color:'var(--text3)' }}>
                            {book.status==='read'?'✅':book.status==='reading'?'📖':'🔖'}
                          </span>
                        )}
                        <button onClick={() => handleRemoveBook(book.id)}
                          style={{ width:26, height:26, borderRadius:6, border:'1px solid var(--border)', background:'transparent', color:'var(--text3)', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.12s' }}
                          onMouseEnter={e=>{e.currentTarget.style.background='var(--red-bg)';e.currentTarget.style.color='var(--red)'}}
                          onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--text3)'}}>
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Create/Edit shelf modal ── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth:400 }} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editShelf ? (uk?'Редагувати полицю':'Edit Shelf') : (uk?'Нова полиця':'New Shelf')}</h2>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>

            <div className="form-group">
              <label>{uk?'Назва':'Name'}</label>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
                placeholder={uk?'Назва полиці...':'Shelf name...'} autoFocus
                style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--radius)', color:'var(--text)', fontSize:14, padding:'9px 12px', fontFamily:'inherit', outline:'none' }} />
            </div>

            <div className="form-group">
              <label>{uk?'Іконка':'Icon'}</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(10,1fr)', gap:4, background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:8 }}>
                {ICONS.map(ic => (
                  <div key={ic} onClick={() => setForm(f=>({...f,icon:ic}))}
                    style={{ fontSize:20, textAlign:'center', padding:4, borderRadius:6, cursor:'pointer', border:`1.5px solid ${form.icon===ic?'var(--purple)':'transparent'}`, background:form.icon===ic?'var(--purple-bg)':'transparent' }}>
                    {ic}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>{uk?'Колір':'Color'}</label>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setForm(f=>({...f,color:c}))}
                    style={{ width:28, height:28, borderRadius:'50%', background:c, cursor:'pointer', border:`2.5px solid ${form.color===c?'white':'transparent'}`, boxShadow:form.color===c?`0 0 0 2px ${c}`:'none', transition:'all 0.12s' }} />
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn" onClick={() => setModal(false)}>{uk?'Скасувати':'Cancel'}</button>
              <button className="btn btn-primary" onClick={handleSave}>{editShelf?(uk?'Зберегти':'Save'):(uk?'Створити':'Create')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add books to shelf modal ── */}
      {addBooksOpen && (() => {
        const q = bookSearch.toLowerCase().trim()
        const displayBooks = q
          ? availableBooks
              .map(b => {
                const titleMatch  = b.title.toLowerCase().indexOf(q)
                const authorMatch = (b.author||'').toLowerCase().indexOf(q)
                const score = titleMatch === 0 ? 0 : titleMatch > 0 ? 1 : authorMatch === 0 ? 2 : authorMatch > 0 ? 3 : -1
                return { ...b, _score: score }
              })
              .filter(b => b._score >= 0)
              .sort((a,b) => a._score - b._score)
          : availableBooks

        return (
          <div className="modal-overlay" onClick={() => setAddBooks(false)}>
            <div className="modal" style={{ maxWidth:480 }} onClick={e=>e.stopPropagation()}>
              <div className="modal-header">
                <h2>{uk?`Додати в "${activeShelf?.name}"`:`Add to "${activeShelf?.name}"`}</h2>
                <button className="modal-close" onClick={() => setAddBooks(false)}>✕</button>
              </div>

              {/* Search input */}
              <div style={{ position:'relative', marginBottom:12 }}>
                <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', fontSize:14, pointerEvents:'none' }}>🔍</span>
                <input
                  autoFocus
                  value={bookSearch}
                  onChange={e => setBookSearch(e.target.value)}
                  placeholder={uk?'Пошук за назвою або автором...':'Search by title or author...'}
                  style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--radius)', color:'var(--text)', fontSize:13, padding:'8px 12px 8px 34px', fontFamily:'inherit', outline:'none' }}
                />
                {bookSearch && (
                  <button onClick={() => setBookSearch('')}
                    style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:14, padding:2 }}>✕</button>
                )}
              </div>

              <div style={{ maxHeight:360, overflowY:'auto', display:'flex', flexDirection:'column', gap:6 }}>
                {availableBooks.length === 0 ? (
                  <div style={{ textAlign:'center', padding:30, color:'var(--text3)', fontSize:13 }}>
                    {uk?'Всі книги вже на цій полиці':'All books are already on this shelf'}
                  </div>
                ) : displayBooks.length === 0 ? (
                  <div style={{ textAlign:'center', padding:30, color:'var(--text3)', fontSize:13 }}>
                    {uk?`Нічого не знайдено за "${bookSearch}"`:`No results for "${bookSearch}"`}
                  </div>
                ) : displayBooks.map(b => {
                  const q2 = bookSearch.toLowerCase()
                  const hl = (str) => {
                    if (!q2 || !str) return str
                    const idx = str.toLowerCase().indexOf(q2)
                    if (idx < 0) return str
                    return <>{str.slice(0,idx)}<mark style={{background:'var(--purple-bg)',color:'var(--purple)',borderRadius:2,padding:'0 1px'}}>{str.slice(idx,idx+q2.length)}</mark>{str.slice(idx+q2.length)}</>
                  }
                  return (
                    <div key={b.id} onClick={() => handleAddBooks(b.id)}
                      style={{ display:'flex', gap:10, alignItems:'center', padding:'10px 12px', background:'var(--bg3)', borderRadius:'var(--radius)', border:'1px solid var(--border)', cursor:'pointer', transition:'border-color 0.12s' }}
                      onMouseEnter={e=>e.currentTarget.style.borderColor='var(--purple)'}
                      onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                      <div style={{ width:32, height:44, borderRadius:5, background:'var(--bg4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0, overflow:'hidden', border:'1px solid var(--border)' }}>
                        {coverSrc(b)
                          ? <img src={coverSrc(b)} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{e.target.style.display='none'}} />
                          : (b.cover_emoji||'📚')
                        }
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{hl(b.title)}</div>
                        <div style={{ fontSize:11, color:'var(--text3)' }}>{hl(b.author||'—')}</div>
                      </div>
                      <span style={{ fontSize:11, color:'var(--purple)', flexShrink:0 }}>{uk?'Додати →':'Add →'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Confirm delete shelf ── */}
      {confirmDel && (
        <div className="modal-overlay" onClick={() => setConfirmDel(null)}>
          <div className="modal" style={{ maxWidth:360 }} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h2>{uk?'Видалити полицю?':'Delete shelf?'}</h2>
              <button className="modal-close" onClick={() => setConfirmDel(null)}>✕</button>
            </div>
            <p style={{ fontSize:14, color:'var(--text2)', marginBottom:20, lineHeight:1.6 }}>
              {uk
                ? `Полиця "${confirmDel.name}" буде видалена. Книги залишаться в бібліотеці.`
                : `Shelf "${confirmDel.name}" will be deleted. Books will remain in the library.`}
            </p>
            <div className="modal-footer">
              <button className="btn" onClick={() => setConfirmDel(null)}>{uk?'Скасувати':'Cancel'}</button>
              <button className="btn btn-danger" onClick={confirmDelete}>{uk?'Видалити':'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`.shelf-actions { opacity: 0 !important; } div:hover > .shelf-actions { opacity: 1 !important; }`}</style>
    </div>
  )
}
