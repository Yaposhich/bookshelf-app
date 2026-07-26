import { CHANGELOG } from '../changelog'
import { getT } from '../i18n'

export default function ChangelogModal({ lang, onClose, highlightVersion }) {
  const t = getT(lang)
  // Changelog copy only exists in uk/en — show Ukrainian for uk, English otherwise.
  const useUk = lang === 'uk'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:480}} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t.whatsNew}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:18,maxHeight:440,overflowY:'auto'}}>
          {CHANGELOG.map(entry => {
            const isHighlighted = entry.version === highlightVersion
            return (
              <div key={entry.version} style={{
                padding: isHighlighted ? '14px 16px' : '0 0 0 0',
                background: isHighlighted ? 'var(--purple-bg)' : 'transparent',
                border: isHighlighted ? '1px solid var(--purple)' : 'none',
                borderRadius: isHighlighted ? 'var(--radius-lg)' : 0,
              }}>
                <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:8}}>
                  <span style={{fontSize:14,fontWeight:600,color: isHighlighted ? 'var(--purple)' : 'var(--text)'}}>
                    v{entry.version}
                  </span>
                  <span style={{fontSize:11,color:'var(--text3)'}}>{entry.date}</span>
                  {isHighlighted && (
                    <span style={{fontSize:10,background:'var(--purple)',color:'#fff',padding:'1px 7px',borderRadius:20,fontWeight:600,marginLeft:'auto'}}>
                      {t.changelogCurrent}
                    </span>
                  )}
                </div>
                <ul style={{margin:0,paddingLeft:18,display:'flex',flexDirection:'column',gap:5}}>
                  {(useUk ? entry.uk : entry.en).map((line, i) => (
                    <li key={i} style={{fontSize:13,color:'var(--text2)',lineHeight:1.5}}>{line}</li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>{t.gotIt}</button>
        </div>
      </div>
    </div>
  )
}
