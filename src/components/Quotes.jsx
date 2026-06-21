import { useState, useEffect } from 'react'

export default function Quotes() {
  const [quotes, setQuotes]   = useState([])
  const [books, setBooks]     = useState([])
  const [filter, setFilter]   = useState('')   // book_id filter
  const [addOpen, setAddOpen] = useState(false)
  const [editQ, setEditQ]     = useState(null)
  const [form, setForm]       = useState({ book_id:'', text:'', page:'', note:'' })

  const load = async () => {
    const [qs, bs] = await Promise.all([window.api.getAllQuotes(), window.api.getBooks()])
    setQuotes(qs)
    setBooks(bs)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setForm({ book_id: filter||'', text:'', page:'', note:'' })
    setEditQ(null); setAddOpen(true)
  }

  const openEdit = (q) => {
    setForm({ book_id: q.book_id, text: q.text, page: q.page||'', note: q.note||'' })
    setEditQ(q); setAddOpen(true)
  }

  const handleSave = async () => {
    if (!form.book_id) { alert('Обери книгу'); return }
    if (!form.text.trim()) { alert('Введи текст цитати'); return }
    const payload = { ...form, book_id: parseInt(form.book_id), page: form.page ? parseInt(form.page) : null }
    if (editQ) { await window.api.updateQuote({ ...payload, id: editQ.id }) }
    else       { await window.api.addQuote(payload) }
    setAddOpen(false); load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Видалити цю цитату?')) return
    await window.api.deleteQuote(id)
    load()
  }

  const filtered = filter ? quotes.filter(q => String(q.book_id) === filter) : quotes

  const coverSrc = (q) => q.cover_local ? `file://${q.cover_local}` : q.cover_url

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:20}}>
        <div style={{background:'var(--purple-bg)',border:'1px solid var(--purple)',borderRadius:8,padding:'4px 10px',fontSize:12,color:'var(--purple)',fontWeight:600}}>
          ✨ Експериментальна функція
        </div>
        <div style={{flex:1}} />
        <select value={filter} onChange={e=>setFilter(e.target.value)}
          style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',color:'var(--text2)',fontSize:13,padding:'5px 10px',fontFamily:'inherit',outline:'none'}}>
          <option value="">Всі книги</option>
          {books.filter(b=>b.status!=='later').map(b=>(
            <option key={b.id} value={b.id}>{b.title}</option>
          ))}
        </select>
        <button className="btn-add" onClick={openAdd}>+ Додати цитату</button>
      </div>

      {/* Quotes list */}
      {filtered.length === 0 ? (
        <div className="empty-state" style={{gridColumn:'unset'}}>
          <div className="empty-state-icon">💬</div>
          <h3>Цитат ще немає</h3>
          <p>Натисни "+ Додати цитату" щоб зберегти важливий уривок з книги</p>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {filtered.map(q => (
            <div key={q.id} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'16px 18px',position:'relative'}}>
              {/* Quote text */}
              <div style={{fontSize:15,color:'var(--text)',lineHeight:1.65,marginBottom:12,fontStyle:'italic',borderLeft:'3px solid var(--purple)',paddingLeft:14}}>
                "{q.text}"
              </div>

              {/* Book info */}
              <div style={{display:'flex',gap:10,alignItems:'center'}}>
                <div style={{width:28,height:36,borderRadius:4,background:'var(--bg3)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0,overflow:'hidden'}}>
                  {coverSrc(q)
                    ? <img src={coverSrc(q)} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{e.target.style.display='none'}} />
                    : (q.cover_emoji||'📚')
                  }
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:500,color:'var(--text)'}}>{q.book_title}</div>
                  <div style={{fontSize:11,color:'var(--text3)'}}>{q.book_author}{q.page?` · стор. ${q.page}`:''}</div>
                </div>
                {q.note && (
                  <div style={{marginLeft:'auto',maxWidth:200,fontSize:12,color:'var(--text3)',fontStyle:'italic',textAlign:'right'}}>
                    {q.note}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{position:'absolute',top:10,right:10,display:'flex',gap:4}}>
                <button className="icon-btn" onClick={()=>openEdit(q)}>✏️</button>
                <button className="icon-btn danger" onClick={()=>handleDelete(q.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      {addOpen && (
        <div className="modal-overlay" onClick={()=>setAddOpen(false)}>
          <div className="modal" style={{maxWidth:480}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editQ ? 'Редагувати цитату' : 'Нова цитата'}</h2>
              <button className="modal-close" onClick={()=>setAddOpen(false)}>✕</button>
            </div>

            <div className="form-group">
              <label>Книга *</label>
              <select value={form.book_id} onChange={e=>setForm(f=>({...f,book_id:e.target.value}))}
                style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--radius)',color:'var(--text)',fontSize:14,padding:'9px 12px',fontFamily:'inherit',outline:'none'}}>
                <option value="">— Обери книгу —</option>
                {books.filter(b=>b.status!=='later').map(b=>(
                  <option key={b.id} value={b.id}>{b.title}{b.author?` — ${b.author}`:''}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Текст цитати *</label>
              <textarea value={form.text} onChange={e=>setForm(f=>({...f,text:e.target.value}))}
                placeholder="Вставте або введіть текст цитати..." autoFocus
                style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--radius)',color:'var(--text)',fontSize:14,padding:'9px 12px',fontFamily:'inherit',outline:'none',resize:'vertical',minHeight:100,lineHeight:1.6}} />
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div className="form-group">
                <label>Сторінка</label>
                <input type="number" value={form.page} onChange={e=>setForm(f=>({...f,page:e.target.value}))}
                  placeholder="123" min="1"
                  style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--radius)',color:'var(--text)',fontSize:14,padding:'9px 12px',fontFamily:'inherit',outline:'none'}} />
              </div>
              <div className="form-group">
                <label>Нотатка</label>
                <input value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}
                  placeholder="Коментар до цитати..."
                  style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--radius)',color:'var(--text)',fontSize:14,padding:'9px 12px',fontFamily:'inherit',outline:'none'}} />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn" onClick={()=>setAddOpen(false)}>Скасувати</button>
              <button className="btn btn-primary" onClick={handleSave}>{editQ?'💾 Зберегти':'➕ Додати'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
