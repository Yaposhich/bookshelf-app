import { useState } from 'react'
import track from '../useTrack'

const T = {
  uk: {
    settings:'Налаштування', language:'Мова інтерфейсу',
    languageDesc:'Оберіть мову відображення застосунку',
    appearance:'Вигляд', theme:'Тема', themeDark:'Темна',
    themeNote:'Більше тем буде додано пізніше',
    about:'Про застосунок', version:'Версія',
    builtWith:'Зроблено з ❤️ за допомогою Electron + React + SQLite',
    saved:'✓ Збережено',
    themeTitle:'Тема оформлення', themeDark:'Темна', themeLight:'Світла', themeSystem:'Як в системі',
    dataTitle:'Дані', exportJSON:'Експорт бібліотеки (JSON)',
    exportDesc:'Зберегти всі книги, цитати та полиці у файл для переносу',
    exportBtn:'📤 Експортувати', importBtn:'📥 Імпортувати',
    importDesc:'Завантажити бібліотеку з раніше збереженого JSON файлу',
    importWarning:'Існуючі книги не видаляються — нові додаються поряд',
    analyticsTitle:'Аналітика для розробника',
    analyticsDesc:'Статистика використання застосунку — без особистих даних. Допомагає зрозуміти що працює, а що ні.',
    analyticsBtn:'📊 Вигрузити аналітику',
    analyticsNote:'Файл містить: кількість кліків по функціях, активність по днях, статистику бібліотеки. Жодних особистих даних.',
    success:'✓ Готово', error:'Помилка',
  },
  en: {
    settings:'Settings', language:'Interface Language',
    languageDesc:'Choose the display language of the app',
    appearance:'Appearance', theme:'Theme', themeDark:'Dark',
    themeNote:'More themes coming soon',
    about:'About', version:'Version',
    builtWith:'Made with ❤️ using Electron + React + SQLite',
    saved:'✓ Saved',
    themeTitle:'Theme', themeDark:'Dark', themeLight:'Light', themeSystem:'System',
    dataTitle:'Data', exportJSON:'Export Library (JSON)',
    exportDesc:'Save all books, quotes and shelves to a file for transfer',
    exportBtn:'📤 Export', importBtn:'📥 Import',
    importDesc:'Load library from a previously saved JSON file',
    importWarning:'Existing books are not deleted — new ones are added alongside',
    analyticsTitle:'Developer Analytics',
    analyticsDesc:'App usage statistics — no personal data. Helps understand what works and what doesn\'t.',
    analyticsBtn:'📊 Export Analytics',
    analyticsNote:'File contains: feature click counts, daily activity, library stats. No personal data.',
    success:'✓ Done', error:'Error',
  },
}

export const LANG_OPTIONS = [
  { value:'uk',  flag:'🇺🇦', native:'Українська'      },
  { value:'en',  flag:'🇬🇧', native:'English'          },
  { value:'sv',  flag:'🇸🇪', native:'Svenska'          },
  { value:'pl',  flag:'🇵🇱', native:'Polski'           },
  { value:'de',  flag:'🇩🇪', native:'Deutsch'          },
  { value:'fr',  flag:'🇫🇷', native:'Français'         },
  { value:'es',  flag:'🇪🇸', native:'Español'          },
  { value:'it',  flag:'🇮🇹', native:'Italiano'         },
  { value:'pt',  flag:'🇵🇹', native:'Português'        },
  { value:'nl',  flag:'🇳🇱', native:'Nederlands'       },
  { value:'no',  flag:'🇳🇴', native:'Norsk'            },
  { value:'da',  flag:'🇩🇰', native:'Dansk'            },
  { value:'fi',  flag:'🇫🇮', native:'Suomi'            },
  { value:'cs',  flag:'🇨🇿', native:'Čeština'          },
  { value:'sk',  flag:'🇸🇰', native:'Slovenčina'       },
  { value:'hu',  flag:'🇭🇺', native:'Magyar'           },
  { value:'ro',  flag:'🇷🇴', native:'Română'           },
  { value:'bg',  flag:'🇧🇬', native:'Български'        },
  { value:'hr',  flag:'🇭🇷', native:'Hrvatski'         },
  { value:'sr',  flag:'🇷🇸', native:'Srpski'           },
  { value:'el',  flag:'🇬🇷', native:'Ελληνικά'         },
  { value:'tr',  flag:'🇹🇷', native:'Türkçe'           },
  { value:'ru',  flag:'🇷🇺', native:'Русский'          },
  { value:'ar',  flag:'🇸🇦', native:'العربية'          },
  { value:'he',  flag:'🇮🇱', native:'עברית'            },
  { value:'fa',  flag:'🇮🇷', native:'فارسی'            },
  { value:'hi',  flag:'🇮🇳', native:'हिन्दी'           },
  { value:'bn',  flag:'🇧🇩', native:'বাংলা'            },
  { value:'zh',  flag:'🇨🇳', native:'中文'              },
  { value:'ja',  flag:'🇯🇵', native:'日本語'            },
  { value:'ko',  flag:'🇰🇷', native:'한국어'            },
  { value:'vi',  flag:'🇻🇳', native:'Tiếng Việt'       },
  { value:'th',  flag:'🇹🇭', native:'ภาษาไทย'          },
  { value:'id',  flag:'🇮🇩', native:'Bahasa Indonesia' },
  { value:'ms',  flag:'🇲🇾', native:'Bahasa Melayu'    },
]

const TRANSLATED = new Set(['uk','en'])

export default function Settings({ lang, setLang, theme, setTheme }) {
  const [langSaved, setLangSaved]       = useState(false)
  const [langSearch, setLangSearch]     = useState('')
  const [exportStatus, setExportStatus] = useState(null) // null | 'ok' | 'err'
  const [importStatus, setImportStatus] = useState(null)
  const [importMsg, setImportMsg]       = useState('')
  const [analyticsStatus, setAnalyticsStatus] = useState(null)
  const [updateMsg, setUpdateMsg]       = useState('')

  const t = T[TRANSLATED.has(lang) ? lang : 'en']
  const current = LANG_OPTIONS.find(o => o.value === lang)
  const uk = lang !== 'en'

  const handleCheckUpdate = async () => {
    setUpdateMsg(uk ? 'Перевіряю...' : 'Checking...')
    track('feature:check_update')
    const res = await window.api.checkForUpdate()
    if (res?.dev) {
      setUpdateMsg(uk ? 'Недоступно в режимі розробки' : 'Not available in dev mode')
      setTimeout(() => setUpdateMsg(''), 4000)
    } else if (res?.error) {
      setUpdateMsg(`${uk ? 'Помилка' : 'Error'}: ${res.error}`)
      // do not auto-hide errors — user needs to read/copy them
    } else {
      setUpdateMsg(uk ? '✓ Перевірено' : '✓ Checked')
      setTimeout(() => setUpdateMsg(''), 4000)
    }
  }

  const handleLang = (val) => {
    setLang(val)
    localStorage.setItem('bs_lang', val)
    setLangSaved(true)
    track('feature:change_lang', { lang: val })
    setTimeout(() => setLangSaved(false), 2000)
  }

  const handleExport = async () => {
    track('feature:export_data')
    const res = await window.api.exportData()
    if (res?.canceled) return
    setExportStatus(res?.success ? 'ok' : 'err')
    setTimeout(() => setExportStatus(null), 3000)
  }

  const handleImport = async () => {
    track('feature:import_data')
    const res = await window.api.importData()
    if (res?.canceled) return
    if (res?.success) {
      setImportStatus('ok')
      setImportMsg(`${t.success}: додано ${res.count} книг`)
    } else {
      setImportStatus('err')
      setImportMsg(`${t.error}: ${res?.error || ''}`)
    }
    setTimeout(() => { setImportStatus(null); setImportMsg('') }, 4000)
  }

  const handleAnalytics = async () => {
    track('feature:export_analytics')
    const res = await window.api.exportAnalytics()
    if (res?.canceled) return
    setAnalyticsStatus(res?.success ? 'ok' : 'err')
    setTimeout(() => setAnalyticsStatus(null), 3000)
  }

  const filtered = LANG_OPTIONS.filter(o =>
    !langSearch.trim() || o.native.toLowerCase().includes(langSearch.toLowerCase())
  )

  return (
    <div style={{maxWidth:600}}>

      {/* ── Language ── */}
      <Section title={t.language}>
        <p style={{fontSize:13,color:'var(--text3)',marginBottom:14}}>{t.languageDesc}</p>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,padding:'10px 14px',background:'var(--purple-bg)',border:'1px solid var(--purple)',borderRadius:'var(--radius)'}}>
          <span style={{fontSize:20}}>{current?.flag}</span>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:'var(--purple)'}}>{current?.native}</div>
            <div style={{fontSize:11,color:'var(--text3)'}}>
              {TRANSLATED.has(lang) ? (lang==='uk'?'Повний переклад інтерфейсу':'Full UI translation') : 'UI displayed in English'}
            </div>
          </div>
          {langSaved && <span style={{marginLeft:'auto',fontSize:12,color:'var(--green)',fontWeight:500}}>{t.saved}</span>}
        </div>
        <div style={{position:'relative',marginBottom:10}}>
          <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--text3)',fontSize:14}}>🔍</span>
          <input value={langSearch} onChange={e=>setLangSearch(e.target.value)}
            placeholder={lang==='uk'?'Пошук мови...':'Search language...'}
            style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--radius)',color:'var(--text)',fontSize:13,padding:'8px 12px 8px 32px',fontFamily:'inherit',outline:'none'}} />
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(155px,1fr))',gap:6,maxHeight:300,overflowY:'auto',paddingRight:2}}>
          {filtered.map(opt => {
            const isActive = lang === opt.value
            return (
              <button key={opt.value} onClick={()=>handleLang(opt.value)} style={{
                display:'flex',alignItems:'center',gap:8,padding:'9px 12px',borderRadius:'var(--radius)',
                border:`1.5px solid ${isActive?'var(--purple)':'var(--border)'}`,
                background:isActive?'var(--purple-bg)':'var(--bg3)',
                color:isActive?'var(--purple)':'var(--text2)',
                cursor:'pointer',fontFamily:'inherit',fontSize:13,fontWeight:isActive?600:400,
                transition:'all 0.12s',textAlign:'left',
              }}>
                <span style={{fontSize:18,lineHeight:1}}>{opt.flag}</span>
                <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{opt.native}</span>
                {isActive && <span style={{fontSize:12,flexShrink:0}}>✓</span>}
              </button>
            )
          })}
        </div>
      </Section>

      {/* ── Data ── */}
      <Section title={t.dataTitle}>
        {/* Export */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:500,color:'var(--text)',marginBottom:4}}>{t.exportJSON}</div>
          <div style={{fontSize:12,color:'var(--text3)',marginBottom:10,lineHeight:1.5}}>{t.exportDesc}</div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <button className="btn btn-primary" onClick={handleExport}>{t.exportBtn}</button>
            {exportStatus==='ok'  && <span style={{fontSize:12,color:'var(--green)'}}>✓ Збережено</span>}
            {exportStatus==='err' && <span style={{fontSize:12,color:'var(--red)'}}>✗ Помилка</span>}
          </div>
        </div>

        {/* Divider */}
        <div style={{height:1,background:'var(--border)',margin:'0 0 16px'}} />

        {/* Import */}
        <div>
          <div style={{fontSize:13,fontWeight:500,color:'var(--text)',marginBottom:4}}>{t.importDesc}</div>
          <div style={{fontSize:12,color:'var(--text3)',marginBottom:6,lineHeight:1.5}}>{t.importWarning}</div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <button className="btn" onClick={handleImport}>{t.importBtn}</button>
            {importStatus==='ok'  && <span style={{fontSize:12,color:'var(--green)'}}>{importMsg}</span>}
            {importStatus==='err' && <span style={{fontSize:12,color:'var(--red)'}}>{importMsg}</span>}
          </div>
        </div>
      </Section>

      {/* ── Developer Analytics ── */}
      <Section title={t.analyticsTitle}>
        <div style={{fontSize:13,color:'var(--text2)',marginBottom:8,lineHeight:1.6}}>{t.analyticsDesc}</div>
        <div style={{fontSize:12,color:'var(--text3)',marginBottom:12,padding:'8px 10px',background:'var(--bg3)',borderRadius:'var(--radius)',lineHeight:1.6}}>
          ℹ️ {t.analyticsNote}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <button className="btn" onClick={handleAnalytics}>{t.analyticsBtn}</button>
          {analyticsStatus==='ok'  && <span style={{fontSize:12,color:'var(--green)'}}>{t.success}</span>}
          {analyticsStatus==='err' && <span style={{fontSize:12,color:'var(--red)'}}>{t.error}</span>}
        </div>
      </Section>

      {/* ── Appearance ── */}
      <Section title={t.themeTitle || t.appearance}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          {[
            { value:'dark',   icon:'🌑', label: t.themeDark   },
            { value:'light',  icon:'☀️', label: t.themeLight  },
            { value:'auto',   icon:'⚙️', label: t.themeSystem },
          ].map(opt => (
            <button key={opt.value} onClick={() => {
              setTheme(opt.value)
              localStorage.setItem('bs_theme', opt.value)
              track('feature:change_theme', { theme: opt.value })
            }} style={{
              display:'flex', flexDirection:'column', alignItems:'center',
              gap:6, padding:'14px 8px', borderRadius:'var(--radius)',
              border:`1.5px solid ${theme===opt.value?'var(--purple)':'var(--border)'}`,
              background: theme===opt.value?'var(--purple-bg)':'var(--bg3)',
              color: theme===opt.value?'var(--purple)':'var(--text2)',
              cursor:'pointer', fontFamily:'inherit', fontSize:13,
              fontWeight: theme===opt.value?600:400, transition:'all 0.12s',
            }}>
              <span style={{fontSize:24}}>{opt.icon}</span>
              {opt.label}
              {theme===opt.value && <span style={{fontSize:11,marginTop:2}}>✓</span>}
            </button>
          ))}
        </div>
      </Section>

      {/* ── About ── */}
      <Section title={t.about}>
        <div style={{fontSize:13,color:'var(--text2)',display:'flex',flexDirection:'column',gap:6}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{color:'var(--text3)'}}>{t.version}</span><span>1.0.1</span>
          </div>
          <div style={{marginTop:4,color:'var(--text3)',fontSize:12}}>{t.builtWith}</div>
          <div style={{marginTop:10,display:'flex',flexDirection:'column',gap:8}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <button className="btn" onClick={handleCheckUpdate}>
                {uk ? '🔄 Перевірити оновлення' : '🔄 Check for updates'}
              </button>
              {updateMsg && !updateMsg.startsWith('Error') && !updateMsg.startsWith('Помилка') && (
                <span style={{fontSize:12,color:'var(--text3)'}}>{updateMsg}</span>
              )}
            </div>
            {updateMsg && (updateMsg.startsWith('Error') || updateMsg.startsWith('Помилка')) && (
              <div style={{
                background:'var(--red-bg)', border:'1px solid var(--red)', borderRadius:'var(--radius)',
                padding:'10px 12px', fontSize:12, color:'var(--text)', lineHeight:1.5,
                wordBreak:'break-word', whiteSpace:'pre-wrap', maxWidth:'100%',
              }}>
                {updateMsg}
                <div style={{marginTop:8}}>
                  <button className="btn" style={{height:26,fontSize:11,padding:'0 10px'}}
                    onClick={() => window.api.openUpdateLog()}>
                    {uk?'📄 Відкрити повний лог':'📄 Open full log'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{marginBottom:24}}>
      <div style={{fontSize:11,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:12}}>{title}</div>
      <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'16px 18px'}}>{children}</div>
    </div>
  )
}
