export default function Sidebar({ view, setView, counts, t }) {
  const nav = [
    { id:'all',     icon:'📚', label: t.allBooks,  count: counts.total },
    { id:'read',    icon:'✅', label: t.read,       count: counts.read },
    { id:'reading', icon:'📖', label: t.reading,    count: counts.reading },
    { id:'later',   icon:'🔖', label: t.readLater,  count: counts.later },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M4 4.5C4 3.67 4.67 3 5.5 3H11V21H5.5C4.67 21 4 20.33 4 19.5V4.5Z" fill="currentColor"/>
            <path d="M13 3H18.5C19.33 3 20 3.67 20 4.5V19.5C20 20.33 19.33 21 18.5 21H13V3Z" fill="currentColor" fillOpacity="0.55"/>
          </svg>
        </div>
        <h1>Bookshelf</h1>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">{t.library}</div>
        {nav.map(item => (
          <button key={item.id} className={`nav-item ${view===item.id?'active':''}`} onClick={()=>setView(item.id)}>
            <span className="nav-item-icon">{item.icon}</span>
            {item.label}
            <span className="nav-item-count">{item.count}</span>
          </button>
        ))}

        <button className={`nav-item ${view==='shelves'?'active':''}`} onClick={()=>setView('shelves')} style={{marginTop:4}}>
          <span className="nav-item-icon">🗂️</span>
          {t.shelves || 'Полиці'}
        </button>

        <div className="nav-rule"><span>❦</span></div>

        <div className="nav-section-title">{t.analytics}</div>
        <button className={`nav-item ${view==='stats'?'active':''}`} onClick={()=>setView('stats')}>
          <span className="nav-item-icon">📊</span>{t.statistics}
        </button>

        <div className="nav-rule"><span>❦</span></div>

        <div className="nav-section-title">
          {t.experimental}
          <span style={{marginLeft:4,fontSize:9,background:'var(--purple-bg)',color:'var(--purple)',padding:'1px 5px',borderRadius:4,fontWeight:600}}>BETA</span>
        </div>
        <button className={`nav-item ${view==='quotes'?'active':''}`} onClick={()=>setView('quotes')}>
          <span className="nav-item-icon">💬</span>{t.quotes}
          {counts.quotes>0 && <span className="nav-item-count">{counts.quotes}</span>}
        </button>
      </nav>

      {/* Settings at bottom */}
      <div className="sidebar-bottom">
        <button className={`nav-item ${view==='settings'?'active':''}`} onClick={()=>setView('settings')} style={{width:'100%'}}>
          <span className="nav-item-icon">⚙️</span>{t.settings}
        </button>
      </div>
    </aside>
  )
}
