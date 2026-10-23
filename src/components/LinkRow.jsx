import { useState } from 'react'
import { Browser } from '@capacitor/browser'
import Icon from './Icon.jsx'
import { gql } from '../services/stash.js'

// ---------- Apertura link: in app (Custom Tabs) o browser esterno ----------
export async function openLink(url, mode) {
  const m = mode || localStorage.getItem('stash.linkmode') || 'app'
  if (window.Capacitor?.isNativePlatform?.()) {
    if (m === 'browser') window.open(url, '_blank', 'noopener')
    else await Browser.open({ url })
  } else {
    window.open(url, '_blank', 'noopener')
  }
}

// Riga link riutilizzabile: apre secondo l'impostazione globale + toggle rapido
export default function LinkRow({ url, mode }) {
  const [toast, setToast] = useState(false)
  const [m, setM] = useState(mode || localStorage.getItem('stash.linkmode') || 'app')

  const open = (which) => {
    openLink(url, which)
    setToast(true)
    setTimeout(() => setToast(false), 1500)
  }

  return (
    <div className="link-item card">
      <button className="link-main" onClick={() => open(m)}>
        <Icon name="external" size={15} />
        <span className="mono">{url}</span>
      </button>
      <button
        className="link-mode"
        title={m === 'browser' ? 'Apri nel browser esterno' : 'Apri in app'}
        onClick={() => { const next = m === 'browser' ? 'app' : 'browser'; setM(next); open(next) }}
      >
        <Icon name={m === 'browser' ? 'external' : 'gear'} size={15} />
      </button>
      {toast && <span className="link-toast">aperto</span>}
    </div>
  )
}
