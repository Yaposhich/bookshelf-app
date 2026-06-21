import { useState, useEffect } from 'react'

export default function UpdateBanner({ lang }) {
  const [status, setStatus] = useState(null)
  const uk = lang !== 'en'

  useEffect(() => {
    if (!window.api?.onUpdaterStatus) return
    const unsubscribe = window.api.onUpdaterStatus(setStatus)
    return unsubscribe
  }, [])

  if (!status || status.state === 'not-available' || status.state === 'error') return null

  const handleInstall = () => window.api.installUpdate()

  return (
    <div style={{
      position: 'fixed', bottom: 16, right: 16, zIndex: 300,
      background: 'var(--bg2)', border: '1px solid var(--purple)',
      borderRadius: 'var(--radius-lg)', padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)', maxWidth: 320,
    }}>
      {status.state === 'available' && (
        <>
          <span style={{ fontSize: 20 }}>⬇️</span>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            {uk ? `Завантажується оновлення ${status.version}...` : `Downloading update ${status.version}...`}
          </div>
        </>
      )}

      {status.state === 'downloading' && (
        <>
          <span style={{ fontSize: 20 }}>⬇️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>
              {uk ? 'Завантаження оновлення...' : 'Downloading update...'}
            </div>
            <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${status.percent || 0}%`, background: 'var(--purple)', transition: 'width 0.3s' }} />
            </div>
          </div>
        </>
      )}

      {status.state === 'ready' && (
        <>
          <span style={{ fontSize: 20 }}>✨</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>
              {uk ? `Оновлення ${status.version} готове` : `Update ${status.version} ready`}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>
              {uk ? 'Перезапустіть щоб встановити' : 'Restart to install'}
            </div>
          </div>
          <button onClick={handleInstall} className="btn btn-primary" style={{ height: 30, padding: '0 12px', fontSize: 12, flexShrink: 0 }}>
            {uk ? 'Перезапустити' : 'Restart'}
          </button>
        </>
      )}
    </div>
  )
}
