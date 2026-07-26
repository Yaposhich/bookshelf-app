import track from '../useTrack'
import { useState, useEffect, useRef } from 'react'
import { getT, fmt } from '../i18n'

const EMOJIS_MAIN = ['📚','📖','🔖']
const EMOJIS_ALL  = ['📚','📖','📕','📗','📘','📙','🔖','✍️','💡','🌍','🎭','🔬','🧠','💼','🏛️','⚔️','🚀','🌿','🎨','🎵','🌊','🔮','🦁','🌺','⚡','👤','🏆','🌙','🎯','🧩']
const LANGUAGES   = ['🇺🇦 Українська','🇬🇧 English','🇸🇪 Svenska','🇷🇺 Русский','🇩🇪 Deutsch','🇫🇷 Français','🇪🇸 Español','🇵🇱 Polski','🇮🇹 Italiano','🇳🇴 Norsk']
const EMPTY = { title:'', author:'', genre:'', status:'read', rating:0, language:'', year_read:'', comment:'', cover_emoji:'📚', cover_url:'', cover_local:'', ol_key:'', total_pages:'', current_page:'', tags:[] }

// ── Google Books API key ──────────────────────────────────────────
const GOOGLE_API_KEY = 'AIzaSyAnyELnABksas3jGLMfMlRd7KQOLiBCpbE'

// ── Source configs ─────────────────────────────────────────────────
const SOURCES = {
  google: {
    label: 'Google Books',
    icon: '🔵',
    search: async (q) => {
      // Google Books' backend throws transient 503 (backendFailed) fairly often
      // on the shared key — retry a few times before giving up, and THROW on a
      // persistent error so the caller can fall back to Open Library.
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=12&printType=books&key=${GOOGLE_API_KEY}`
      let data
      for (let attempt = 0; attempt < 3; attempt++) {
        const res = await fetch(url)
        data = await res.json()
        if (!data.error) break
        if (data.error.code !== 503) break // 429/quota etc. won't recover on retry
        await new Promise(r => setTimeout(r, 400 * (attempt + 1)))
      }
      if (data.error) {
        console.error('Google Books API error:', data.error)
        throw new Error(`Google Books ${data.error.code}`)
      }
      return (data.items || []).map(item => {
        const info = item.volumeInfo || {}
        return {
          _src:       'google',
          _id:        item.id,
          title:      info.title || '',
          authors:    info.authors || [],
          year:       info.publishedDate ? info.publishedDate.slice(0,4) : '',
          pages:      info.pageCount || '',
          genres:     info.categories || [],
          description:info.description || '',
          cover:      info.imageLinks?.thumbnail?.replace('http://','https://').replace('&zoom=1','&zoom=2') || '',
          coverLarge: info.imageLinks?.large?.replace('http://','https://') || info.imageLinks?.medium?.replace('http://','https://') || info.imageLinks?.thumbnail?.replace('http://','https://').replace('zoom=1','zoom=3') || '',
          isbn:       (info.industryIdentifiers||[]).find(x=>x.type==='ISBN_13')?.identifier || '',
          language:   info.language || '',
        }
      })
    }
  },
  openlibrary: {
    label: 'Open Library',
    icon: '📗',
    search: async (q) => {
      const res  = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=12&fields=key,title,author_name,first_publish_year,subject,cover_i,number_of_pages_median`)
      const data = await res.json()
      return (data.docs || []).map(b => ({
        _src:    'ol',
        _id:     b.key,
        title:   b.title || '',
        authors: b.author_name || [],
        year:    b.first_publish_year ? String(b.first_publish_year) : '',
        pages:   b.number_of_pages_median || '',
        genres:  b.subject ? b.subject.slice(0,3) : [],
        description: '',
        cover:      b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg` : '',
        coverLarge: b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-L.jpg` : '',
        isbn: '',
        language: '',
      }))
    }
  }
}

function guessEmoji(genres) {
  const g = genres.join(' ').toLowerCase()
  if (g.includes('fiction')||g.includes('novel'))    return '📖'
  if (g.includes('history'))                         return '🏛️'
  if (g.includes('science')||g.includes('physics'))  return '🔬'
  if (g.includes('fantasy')||g.includes('magic'))    return '🔮'
  if (g.includes('biograph'))                        return '👤'
  if (g.includes('philosoph'))                       return '💡'
  if (g.includes('econom')||g.includes('business'))  return '💼'
  if (g.includes('war')||g.includes('military'))     return '⚔️'
  if (g.includes('travel'))                          return '🌍'
  if (g.includes('art'))                             return '🎨'
  return '📚'
}

export default function BookModal({ book, lang, onSave, onClose }) {
  const t = getT(lang)
  const [form, setForm]           = useState(EMPTY)
  const [tagInput, setTagInput]   = useState('')
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched]   = useState(false)
  const [tab, setTab]             = useState('search')
  const [source, setSource]       = useState('google')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const tagRef   = useRef()
  const timerRef = useRef()

  useEffect(() => {
    if (book) {
      setForm({ ...EMPTY, ...book,
        tags:         book.tags ? book.tags.split(',').map(t=>t.trim()).filter(Boolean) : [],
        year_read:    book.year_read    || '',
        total_pages:  book.total_pages  || '',
        current_page: book.current_page || '',
        rating:       book.rating       || 0,
        cover_local:  book.cover_local  || '',
        cover_url:    book.cover_url    || '',
      })
      setTab('manual')
    } else {
      setForm(EMPTY); setTab('search')
    }
  }, [book])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleQueryChange = (val) => {
    setQuery(val)
    clearTimeout(timerRef.current)
    if (!val.trim()) { setResults([]); setSearched(false); return }
    timerRef.current = setTimeout(() => doSearch(val, source), 500)
  }

  const doSearch = async (q, src) => {
    setSearching(true); setSearched(true)
    track('book:search', { source: src })
    const other = src === 'google' ? 'openlibrary' : 'google'
    try {
      let items = await SOURCES[src].search(q)
      // If the chosen source (esp. flaky Google Books) returns nothing, quietly
      // fall back to the other source so the user always gets results.
      if (!items || items.length === 0) {
        try { const alt = await SOURCES[other].search(q); if (alt.length) items = alt } catch {}
      }
      setResults(items || [])
    } catch(e) {
      console.error(e)
      // Selected source errored — try the other one before giving up.
      try {
        setResults(await SOURCES[other].search(q))
      } catch(e2) {
        console.error(e2); setResults([])
      }
    }
    setSearching(false)
  }

  const switchSource = (src) => {
    setSource(src)
    track('feature:search_source', { source: src })
    if (query.trim()) doSearch(query, src)
  }

  const pickBook = (b) => {
    track('book:picked_from_search', { source: b._src, has_cover: !!b.cover })
    const genre = b.genres.slice(0,3).join(', ')
    setForm(f => ({
      ...f,
      title:       b.title,
      author:      b.authors[0] || '',
      genre,
      cover_emoji: guessEmoji(b.genres),
      cover_url:   b.coverLarge || b.cover || '',
      cover_local: '',
      ol_key:      b._src === 'ol' ? b._id : '',
      total_pages: b.pages || f.total_pages,
    }))
    setResults([]); setQuery(''); setTab('manual')
  }

  const handlePickCover = async () => {
    if (!book?.id) return alert(t.pickCoverFirstSave)
    const localPath = await window.api.pickCover(book.id)
    if (localPath) { set('cover_local', localPath); set('cover_url', '') }
  }

  const addTag = () => { const v=tagInput.trim(); if(v&&!form.tags.includes(v)) set('tags',[...form.tags,v]); setTagInput('') }
  const removeTag = tag => set('tags', form.tags.filter(x=>x!==tag))
  const handleTagKey = e => {
    if (e.key==='Enter'||e.key===',') { e.preventDefault(); addTag() }
    if (e.key==='Backspace'&&!tagInput&&form.tags.length) set('tags', form.tags.slice(0,-1))
  }

  const handleSave = () => {
    if (!form.title.trim()) { alert(t.titleRequiredAlert); return }
    onSave({ ...form,
      rating:       form.status!=='read' ? 0 : form.rating,
      year_read:    form.year_read    ? parseInt(form.year_read)    : null,
      total_pages:  form.total_pages  ? parseInt(form.total_pages)  : 0,
      current_page: form.current_page ? parseInt(form.current_page) : 0,
    })
  }

  const coverSrc = form.cover_local ? `file://${form.cover_local}` : form.cover_url

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal has-scroll" style={{maxWidth:580}} onClick={e=>e.stopPropagation()}>
        <div className="modal-scroll">
        <div className="modal-header">
          <h2>{book ? t.editBookTitle : t.addBookTitle}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* ── Tab switcher ── */}
        {!book && (
          <div style={{display:'flex',gap:4,marginBottom:16,borderBottom:'1px solid var(--border)'}}>
            {[['search',t.tabSearch],['manual',t.tabManual]].map(([id,label])=>(
              <button key={id} onClick={()=>setTab(id)} style={{padding:'7px 16px',border:'none',background:'none',cursor:'pointer',fontFamily:'inherit',fontSize:13,fontWeight:500,color:tab===id?'var(--purple)':'var(--text2)',borderBottom:tab===id?'2px solid var(--purple)':'2px solid transparent',marginBottom:-1}}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ── Search tab ── */}
        {tab==='search' && !book && (
          <div>
            {/* Source selector */}
            <div style={{display:'flex',gap:6,marginBottom:12}}>
              {Object.entries(SOURCES).map(([key, src]) => (
                <button key={key} onClick={()=>switchSource(key)} style={{
                  display:'flex',alignItems:'center',gap:6,
                  padding:'5px 12px',borderRadius:20,border:'1.5px solid',
                  borderColor: source===key ? 'var(--purple)' : 'var(--border)',
                  background:  source===key ? 'var(--purple-bg)' : 'var(--bg3)',
                  color:       source===key ? 'var(--purple)' : 'var(--text2)',
                  cursor:'pointer',fontFamily:'inherit',fontSize:12,fontWeight:source===key?600:400,
                  transition:'all 0.12s',
                }}>
                  <span>{src.icon}</span>{src.label}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="form-group">
              <div style={{position:'relative'}}>
                <input value={query} onChange={e=>handleQueryChange(e.target.value)}
                  placeholder={fmt(t.searchViaSource, { source: SOURCES[source].label })}
                  autoFocus style={{width:'100%',paddingRight:36}}
                  onKeyDown={e=>e.key==='Enter'&&query.trim()&&doSearch(query,source)} />
                {searching
                  ? <span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',fontSize:14}}>⏳</span>
                  : query && <button onClick={()=>{setQuery('');setResults([]);setSearched(false)}} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:14,padding:2}}>✕</button>
                }
              </div>
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:400,overflowY:'auto'}}>
                {results.map((b,i) => (
                  <div key={i} onClick={()=>pickBook(b)}
                    style={{display:'flex',gap:12,padding:'10px 12px',background:'var(--bg3)',borderRadius:'var(--radius)',border:'1px solid var(--border)',cursor:'pointer',transition:'border-color 0.12s'}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor='var(--purple)'}
                    onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                    {/* Cover */}
                    <div style={{width:44,height:62,borderRadius:6,flexShrink:0,background:'var(--bg4)',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,border:'1px solid var(--border)'}}>
                      {b.cover
                        ? <img src={b.cover} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{e.target.style.display='none'}} />
                        : '📚'
                      }
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:500,color:'var(--text)',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.title}</div>
                      <div style={{fontSize:12,color:'var(--text2)',marginBottom:4}}>
                        {b.authors[0]||'—'}
                        {b.year?` · ${b.year}`:''}
                        {b.pages?fmt(t.pagesShortSuffix,{n:b.pages}):''}
                      </div>
                      {b.genres.length>0 && (
                        <div style={{fontSize:11,color:'var(--text3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {b.genres.slice(0,3).join(' · ')}
                        </div>
                      )}
                    </div>
                    <div style={{fontSize:11,color:'var(--purple)',alignSelf:'center',flexShrink:0,fontWeight:500}}>{t.chooseArrow}</div>
                  </div>
                ))}
              </div>
            )}

            {searched && !searching && results.length===0 && (
              <div style={{textAlign:'center',padding:'24px',color:'var(--text3)',fontSize:13}}>
                {t.searchNoResultsPrefix}
                <button onClick={()=>setTab('manual')} style={{background:'none',border:'none',color:'var(--purple)',cursor:'pointer',fontSize:13,padding:'0 4px',fontFamily:'inherit'}}>{t.addManuallyLink}</button>
              </div>
            )}

            {!searched && (
              <div style={{textAlign:'center',padding:'28px 20px',color:'var(--text3)',fontSize:13,lineHeight:1.7}}>
                {SOURCES[source].icon} {t.searchPrompt}<br/>
                <span style={{fontSize:12}}>{t.searchHint}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Manual/filled tab ── */}
        {tab==='manual' && (
          <>
            {/* Cover */}
            <div className="form-group">
              <label>{t.labelCover}</label>
              <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                <div style={{width:52,height:72,borderRadius:8,border:'1px solid var(--border)',background:'var(--bg3)',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,flexShrink:0,cursor:'pointer',position:'relative'}}
                  onClick={handlePickCover} title={t.coverUploadTooltip}>
                  {coverSrc ? <img src={coverSrc} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{e.target.style.display='none'}} /> : form.cover_emoji}
                  <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',opacity:0,transition:'opacity 0.15s'}}
                    onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0}>
                    <span style={{fontSize:18}}>📷</span>
                  </div>
                </div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginBottom:6}}>
                    {EMOJIS_MAIN.map(e=>(
                      <div key={e} onClick={()=>{set('cover_emoji',e);set('cover_url','');set('cover_local','')}}
                        style={{fontSize:22,padding:'4px 8px',borderRadius:8,border:`1.5px solid ${form.cover_emoji===e&&!coverSrc?'var(--purple)':'var(--border)'}`,background:form.cover_emoji===e&&!coverSrc?'var(--purple-bg)':'var(--bg3)',cursor:'pointer'}}>
                        {e}
                      </div>
                    ))}
                    <button onClick={()=>setEmojiOpen(v=>!v)} style={{height:34,padding:'0 10px',borderRadius:8,border:'1px solid var(--border)',background:'var(--bg3)',color:'var(--text2)',cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>
                      {emojiOpen?t.emojiHide:t.emojiMore}
                    </button>
                    {book?.id && (
                      <button onClick={handlePickCover} style={{height:34,padding:'0 10px',borderRadius:8,border:'1px solid var(--border)',background:'var(--bg3)',color:'var(--text2)',cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>
                        {t.ownPhoto}
                      </button>
                    )}
                  </div>
                  {emojiOpen && (
                    <div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:4,background:'var(--bg3)',borderRadius:'var(--radius)',border:'1px solid var(--border)',padding:8}}>
                      {EMOJIS_ALL.map(e=>(
                        <div key={e} onClick={()=>{set('cover_emoji',e);set('cover_url','');set('cover_local','');setEmojiOpen(false)}}
                          style={{fontSize:20,textAlign:'center',padding:4,borderRadius:6,cursor:'pointer',border:`1.5px solid ${form.cover_emoji===e&&!coverSrc?'var(--purple)':'transparent'}`,background:form.cover_emoji===e&&!coverSrc?'var(--purple-bg)':'transparent'}}>
                          {e}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label>{t.labelTitleRequired}</label>
                <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder={t.placeholderTitle} autoFocus />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t.labelAuthor}</label>
                <input value={form.author} onChange={e=>set('author',e.target.value)} placeholder={t.placeholderAuthor} />
              </div>
              <div className="form-group">
                <label>{t.labelGenre}</label>
                <input value={form.genre} onChange={e=>set('genre',e.target.value)} placeholder={t.placeholderGenre} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t.labelStatus}</label>
                <select value={form.status} onChange={e=>set('status',e.target.value)}>
                  <option value="read">{t.statusRead}</option>
                  <option value="reading">{t.statusReadingNow}</option>
                  <option value="later">{t.statusReadLater}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t.labelYearRead}</label>
                <input type="number" value={form.year_read} onChange={e=>set('year_read',e.target.value)} placeholder="2024" min="1900" max="2099" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t.labelTotalPages}</label>
                <input type="number" value={form.total_pages} onChange={e=>set('total_pages',e.target.value)} placeholder="328" min="1" />
              </div>
              {form.status==='reading' && (
                <div className="form-group">
                  <label>{t.labelCurrentPage}</label>
                  <input type="number" value={form.current_page} onChange={e=>set('current_page',e.target.value)} placeholder="0" min="0" max={form.total_pages||99999} />
                </div>
              )}
            </div>
            {form.status==='reading' && form.total_pages>0 && (
              <div style={{marginBottom:14}}>
                {(()=>{
                  const pct=Math.min(100,Math.round((parseInt(form.current_page)||0)/parseInt(form.total_pages)*100))
                  return (<div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--text3)',marginBottom:4}}><span>{t.labelProgress}</span><span style={{color:'var(--amber)',fontWeight:500}}>{pct}%</span></div>
                    <div style={{height:6,background:'var(--bg4)',borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:`${pct}%`,background:'var(--amber)',borderRadius:3,transition:'width 0.3s'}} /></div>
                  </div>)
                })()}
              </div>
            )}
            {form.status==='read' && (<>
              <div className="form-group">
                <label>{t.labelRating}</label>
                <div className="rating-picker">
                  {Array.from({length:10},(_,i)=>i+1).map(n=>(
                    <button key={n} className={`rating-pick ${n<=form.rating?'active':''}`} onClick={()=>set('rating',form.rating===n?0:n)}>{n}</button>
                  ))}
                  {form.rating>0&&<span style={{fontSize:13,fontWeight:600,color:'var(--purple)',alignSelf:'center',marginLeft:6}}>{form.rating}/10</span>}
                </div>
              </div>
              <div className="form-group">
                <label>{t.labelReadingLanguage}</label>
                <select value={form.language} onChange={e=>set('language',e.target.value)}>
                  <option value="">{t.languageNotSpecified}</option>
                  {LANGUAGES.map(l=><option key={l} value={l}>{l}</option>)}
                  <option value="Інша">{t.langOther}</option>
                </select>
              </div>
            </>)}
            <div className="form-group">
              <label>{t.labelTags}</label>
              <div className="tags-input-wrap" onClick={()=>tagRef.current?.focus()}>
                {form.tags.map(tag=>(<span key={tag} className="tag-chip">{tag}<button className="tag-chip-remove" onClick={()=>removeTag(tag)}>✕</button></span>))}
                <input ref={tagRef} className="tag-input-bare" value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={handleTagKey} onBlur={addTag} placeholder={form.tags.length?'':t.placeholderTags} />
              </div>
            </div>
            <div className="form-group">
              <label>{t.labelComment}</label>
              <textarea value={form.comment} onChange={e=>set('comment',e.target.value)} placeholder={t.placeholderComment} />
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={onClose}>{t.cancel}</button>
              <button className="btn btn-primary" onClick={handleSave}>{book?t.saveBtn:t.addBtn}</button>
            </div>
          </>
        )}
        </div>{/* modal-scroll */}
      </div>
    </div>
  )
}
