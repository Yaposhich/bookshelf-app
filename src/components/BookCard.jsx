const STATUS_BADGE = {
  read:    { cls:'badge-read',    label:'✅ Прочитав' },
  reading: { cls:'badge-reading', label:'📖 Читаю' },
  later:   { cls:'badge-later',   label:'🔖 Read Later' },
}

export default function BookCard({ book, onClick, onEdit, onDelete }) {
  const badge  = STATUS_BADGE[book.status] || STATUS_BADGE.read
  const pct    = book.status==='reading' && book.total_pages>0
    ? Math.min(100, Math.round((book.current_page||0) / book.total_pages * 100))
    : null
  const coverSrc = book.cover_local ? `file://${book.cover_local}` : book.cover_url

  return (
    <div className="book-card" onClick={()=>onClick(book)}>
      <div className="book-cover">
        {coverSrc
          ? <img src={coverSrc} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:7}} onError={e=>{e.target.style.display='none'}} />
          : (book.cover_emoji||'📚')
        }
      </div>

      <div className="book-info">
        <div className="book-title" title={book.title}>{book.title}</div>
        <div className="book-author">{book.author||'—'}</div>

        <div className="book-badges">
          <span className={`badge ${badge.cls}`}>{badge.label}</span>
          {book.genre && <span className="badge badge-genre">{book.genre.split(',')[0].trim()}</span>}
          {book.language && <span className="badge badge-lang">{book.language.substring(0,2)}</span>}
        </div>

        {book.status==='read' && book.rating>0 && (
          <div className="book-stars">
            {[1,2,3,4,5].map(i=>(
              <span key={i} className={`star ${i<=book.rating?'':'empty'}`}>★</span>
            ))}
            {book.year_read && <span style={{marginLeft:6,fontSize:11,color:'var(--text3)'}}>{book.year_read}</span>}
          </div>
        )}

        {/* Progress bar for "reading" */}
        {pct!==null && (
          <div style={{marginTop:6}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text3)',marginBottom:3}}>
              <span>стор. {book.current_page||0} / {book.total_pages}</span>
              <span style={{color:'var(--amber)',fontWeight:500}}>{pct}%</span>
            </div>
            <div style={{height:4,background:'var(--bg4)',borderRadius:2,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${pct}%`,background:'var(--amber)',borderRadius:2}} />
            </div>
          </div>
        )}

        {book.comment && <div className="book-comment">"{book.comment}"</div>}
      </div>

      <div className="book-card-actions" onClick={e=>e.stopPropagation()}>
        <button className="icon-btn" title="Редагувати" onClick={()=>onEdit(book)}>✏️</button>
        <button className="icon-btn danger" title="Видалити" onClick={()=>onDelete(book.id)}>🗑️</button>
      </div>
    </div>
  )
}
