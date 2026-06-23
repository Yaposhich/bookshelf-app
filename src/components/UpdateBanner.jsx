import { useState, useEffect } from 'react'

export default function UpdateBanner({ lang }) {
  const [status, setStatus]       = useState(null)
  const [dismissed, setDismissed] = useState(false)
  const [installing, setInstalling] = useState(false)
  const uk = lang !== 'en'

  useEffect(() => {
    if (!window.api?.onUpdaterStatus) return
    const unsubscribe = window.api.onUpdaterStatus((s) => {
      setStatus(s)
      setDismissed(false) // reset dismiss when new status arrives
    })
    return unsubscribe
  }, [])

  if (!status || dismissed) return null
  if (status.state === 'not-available' || status.state === 'error') return null

  const handleDownload = () => {
    window.api.downloadUpdate()
  }

  const handleInstall = () => {
    setInstalling(true)
    window.api.installUpdate()
  }

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 300,
      background: 'var(--bg2)',
      border: '1px solid var(--purple)',
      borderRadius: 'var(--radius-lg)',
      padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
      maxWidth: 340, minWidth: 260,
    }}>

      {/* Available — offer to download */}
      {status.state === 'available' && (
        <>
          <span style={{fontSize:22,flexShrink:0}}>🔔</span>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:500,color:'var(--text)',marginBottom:3}}>
              {uk ? `Нова версія ${status.version}` : `Update ${status.version} available`}
            </div>
            <div style={{display:'flex',gap:6,marginTop:6}}>
              <button onClick={handleDownload} className="btn btn-primary" style={{height:26,padding:'0 10px',fontSize:11.5}}>
                {uk ? '⬇ Завантажити' : '⬇ Download'}
              </button>
              <button onClick={() => setDismissed(true)} className="btn" style={{height:26,padding:'0 10px',fontSize:11.5}}>
                {uk ? 'Пізніше' : 'Later'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Downloading — show progress */}
      {status.state === 'downloading' && (
        <>
          <span style={{fontSize:22,flexShrink:0}}>⬇️</span>
          <div style={{flex:1}}>
            <div style={{fontSize:12,color:'var(--text2)',marginBottom:6}}>
              {uk ? 'Завантаження оновлення...' : 'Downloading update...'}
              {status.percent ? ` ${status.percent}%` : ''}
            </div>
            <div style={{height:4,background:'var(--bg4)',borderRadius:2,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${status.percent||0}%`,background:'var(--purple)',borderRadius:2,transition:'width 0.3s'}} />
            </div>
          </div>
        </>
      )}

      {/* Ready — offer to restart */}
      {status.state === 'ready' && (
        <>
          <span style={{fontSize:22,flexShrink:0}}>✨</span>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:500,color:'var(--text)',marginBottom:2}}>
              {uk ? `Версія ${status.version} готова` : `Version ${status.version} ready`}
            </div>
            <div style={{fontSize:11,color:'var(--text3)',marginBottom:8}}>
              {uk ? 'Перезапустіть щоб встановити' : 'Restart to install'}
            </div>
            <div style={{display:'flex',gap:6}}>
              <button
                onClick={handleInstall}
                disabled={installing}
                className="btn btn-primary"
                style={{height:26,padding:'0 10px',fontSize:11.5,opacity:installing?0.6:1}}
              >
                {installing ? (uk?'Закриваю...':'Closing...') : (uk?'🔄 Перезапустити':'🔄 Restart')}
              </button>
              <button onClick={() => setDismissed(true)} className="btn" style={{height:26,padding:'0 10px',fontSize:11.5}}>
                {uk ? 'Пізніше' : 'Later'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
