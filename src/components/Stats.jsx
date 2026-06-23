import { useEffect, useState } from 'react'

const T = {
  uk: {
    total:'Всього книг', read:'Прочитано', reading:'Читаю зараз', avgRating:'Середня оцінка',
    readPeriod:'Книг прочитано', pagesPeriod:'Сторінок прочитано',
    today:'Сьогодні', thisWeek:'Цей тиждень', thisYear:'Цей рік', allTime:'За весь час',
    languages:'Мови читання', byYear:'По роках', quotes:'Цитат записано',
    books:'кн.', pages:'стор.',
  },
  en: {
    total:'Total Books', read:'Read', reading:'Reading Now', avgRating:'Avg Rating',
    readPeriod:'Books Read', pagesPeriod:'Pages Read',
    today:'Today', thisWeek:'This Week', thisYear:'This Year', allTime:'All Time',
    languages:'Reading Languages', byYear:'By Year', quotes:'Quotes Saved',
    books:'bk.', pages:'pp.',
  },
}

export default function Stats({ lang }) {
  const [stats, setStats] = useState(null)
  const t = T[lang] || T.uk

  useEffect(() => { window.api.getStats().then(setStats) }, [])

  if (!stats) return <div style={{padding:40,color:'var(--text3)'}}>...</div>

  const maxLang = stats.byLang[0]?.c || 1

  const periods = [t.today, t.thisWeek, t.thisYear, t.allTime]
  const bookCounts  = [stats.readToday,  stats.readWeek,  stats.readYear,  stats.readAllTime]
  const pageCounts  = [stats.pagesToday, stats.pagesWeek, stats.pagesYear, stats.pagesAllTime]
  const icons       = ['☀️','📅','🗓️','📚']

  return (
    <div className="stats-page">

      {/* ── Overview ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        <StatCard num={stats.total}   label={t.total}     color="purple" />
        <StatCard num={stats.read}    label={t.read}      color="green"  />
        <StatCard num={stats.reading} label={t.reading}   color="amber"  />
        <StatCard num={stats.avg ? `${stats.avg}/10` : '—'} label={t.avgRating} color="purple" />
      </div>

      {/* ── Period table: books + pages ── */}
      <div>
        <div className="stats-section-title">{t.readPeriod} / {t.pagesPeriod}</div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
          {periods.map((label, i) => (
            <div key={label} style={{
              background:'var(--bg2)', border:'1px solid var(--border)',
              borderRadius:'var(--radius-lg)', padding:'14px 16px',
            }}>
              <div style={{fontSize:22, marginBottom:8, textAlign:'center'}}>{icons[i]}</div>

              {/* Books */}
              <div style={{marginBottom:10}}>
                <div style={{fontSize:26, fontWeight:700, color:'var(--green)', lineHeight:1, textAlign:'center'}}>
                  {bookCounts[i]}
                </div>
                <div style={{fontSize:11, color:'var(--text3)', textAlign:'center', marginTop:2}}>{t.books}</div>
              </div>

              {/* Divider */}
              <div style={{height:'1px', background:'var(--border)', margin:'6px 0'}} />

              {/* Pages */}
              <div>
                <div style={{fontSize:20, fontWeight:600, color:'var(--purple)', lineHeight:1, textAlign:'center'}}>
                  {pageCounts[i] > 0 ? pageCounts[i].toLocaleString() : '—'}
                </div>
                <div style={{fontSize:11, color:'var(--text3)', textAlign:'center', marginTop:2}}>{t.pages}</div>
              </div>

              <div style={{fontSize:11, color:'var(--text3)', textAlign:'center', marginTop:10, fontWeight:500}}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Languages ── */}
      {stats.byLang.length > 0 && (
        <div>
          <div className="stats-section-title">{t.languages}</div>
          {stats.byLang.map(l => (
            <div key={l.language} className="lang-bar-item">
              <div className="lang-bar-label">{l.language}</div>
              <div className="lang-bar-track">
                <div className="lang-bar-fill" style={{width:`${Math.round((l.c/maxLang)*100)}%`}} />
              </div>
              <div className="lang-bar-count">{l.c}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── By year ── */}
      {stats.byYear.length > 0 && (
        <div>
          <div className="stats-section-title">{t.byYear}</div>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            {stats.byYear.map(y => (
              <div key={y.year_read} style={{
                background:'var(--bg3)', border:'1px solid var(--border)',
                borderRadius:'var(--radius)', padding:'10px 16px', textAlign:'center', minWidth:72,
              }}>
                <div style={{fontSize:22,fontWeight:600,color:'var(--purple)'}}>{y.c}</div>
                <div style={{fontSize:12,color:'var(--text3)'}}>{y.year_read}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quotes ── */}
      {stats.quotes > 0 && (
        <div style={{display:'flex',alignItems:'center',gap:14,background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'14px 18px'}}>
          <span style={{fontSize:28}}>💬</span>
          <div>
            <div style={{fontSize:22,fontWeight:600,color:'var(--purple)'}}>{stats.quotes}</div>
            <div style={{fontSize:12,color:'var(--text3)'}}>{t.quotes}</div>
          </div>
        </div>
      )}

    </div>
  )
}

function StatCard({ num, label, color }) {
  return (
    <div className={`stat-card ${color||''}`}>
      <div className="stat-card-num">{num}</div>
      <div className="stat-card-lbl">{label}</div>
    </div>
  )
}
