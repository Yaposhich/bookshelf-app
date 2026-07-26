import { fmt } from '../i18n'

const STATUS_CLS = { read:'badge-read', reading:'badge-reading', later:'badge-later' }

export default function BookCard({ book, t, onClick, onEdit, onDelete }) {
  const badge = {
    cls:   STATUS_CLS[book.status] || STATUS_CLS.read,
    label: { read: t.statusRead, reading: t.statusReading, later: t.statusReadLater }[book.status] || t.statusRead,
  }
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
          <div style={{display:'flex',alignItems:'center',gap:6,marginTop:2}}>
            <span style={{
              display:'inline-flex',alignItems:'center',gap:3,
              fontSize:11,fontWeight:600,color:'var(--amber)',
              background:'var(--amber-bg)',padding:'2px 7px',borderRadius:6,
            }}>
              ★ {book.rating}/10
            </span>
            {book.year_read && <span style={{fontSize:11,color:'var(--text3)'}}>{book.year_read}</span>}
          </div>
        )}

        {/* Progress bar for "reading" */}
        {pct!==null && (
          <div style={{marginTop:6}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text3)',marginBottom:3}}>
              <span>{fmt(t.pageProgress, { cur: book.current_page||0, total: book.total_pages })}</span>
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
        <button className="icon-btn" title={t.edit} onClick={()=>onEdit(book)}>✏️</button>
        <button className="icon-btn danger" title={t.delete} onClick={()=>onDelete(book.id)}>🗑️</button>
      </div>
    </div>
  )
}
