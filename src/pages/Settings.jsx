import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { gql, getServer, setServer, Q_STATS } from '../services/stash.js'
import { getPlayback, setPlayback } from '../services/playback.js'
import { useServerConfig } from '../hooks/index.js'
import Icon from '../components/Icon.jsx'
import pkg from '../../package.json'

function Toggle({ on, onChange }) {
  return (
    <button
      className={'toggle' + (on ? ' on' : '')}
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
    >
      <span className="toggle-knob" />
    </button>
  )
}

function PlaybackSettings() {
  const [cfg, setCfg] = useState(getPlayback())

  const patch = (p) => setCfg(setPlayback(p))

  return (
    <div className="settings-card card">
      <label className="field-label"><Icon name="play" size={14} /> Riproduzione e Anteprime</label>

      <div className="set-row">
        <div className="set-info">
          <div className="set-name">Vista scene predefinita</div>
          <div className="set-hint">Card grandi (16:9 con anteprima comoda) o lista compatta.</div>
        </div>
        <div className="seg-mini">
          <button className={cfg.sceneLayout === 'cards' ? 'on' : ''} onClick={() => patch({ sceneLayout: 'cards' })}>Card</button>
          <button className={cfg.sceneLayout === 'list' ? 'on' : ''} onClick={() => patch({ sceneLayout: 'list' })}>Lista</button>
        </div>
      </div>

      <div className="set-row">
        <div className="set-info">
          <div className="set-name">Anteprima automatica allo scroll</div>
          <div className="set-hint">Avvia la clip muta quando la card è centrata (puoi sempre toccare il pulsante Anteprima).</div>
        </div>
        <Toggle on={Boolean(cfg.autoPreview)} onChange={(v) => patch({ autoPreview: v })} />
      </div>

      <div className="set-row">
        <div className="set-info">
          <div className="set-name">Riprendi dal punto lasciato</div>
          <div className="set-hint">Riprende dal resume salvato sul server (funziona anche con la web UI).</div>
        </div>
        <Toggle on={cfg.resume} onChange={(v) => patch({ resume: v })} />
      </div>

      <div className="set-row">
        <div className="set-info">
          <div className="set-name">Autoplay all'apertura</div>
          <div className="set-hint">Avvia il video automaticamente quando apri la scena.</div>
        </div>
        <Toggle on={cfg.autoStart} onChange={(v) => patch({ autoStart: v })} />
      </div>

      <div className="set-row">
        <div className="set-info">
          <div className="set-name">Registra i play sul server</div>
          <div className="set-hint">Conta le visualizzazioni e salva il progresso (storia di Stash).</div>
        </div>
        <Toggle on={cfg.trackPlays} onChange={(v) => patch({ trackPlays: v })} />
      </div>

      <div className="set-row">
        <div className="set-info">
          <div className="set-name">Loop video corti (s)</div>
          <div className="set-hint">Ripete automaticamente i video più corti della soglia (0 = mai).</div>
        </div>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          max="600"
          className="set-number mono"
          value={cfg.loopThreshold}
          onChange={(e) => patch({ loopThreshold: Math.max(0, parseInt(e.target.value) || 0) })}
        />
      </div>

      <div className="set-row">
        <div className="set-info">
          <div className="set-name">Salva progresso ogni (s)</div>
          <div className="set-hint">Frequenza di salvataggio del punto di ripresa.</div>
        </div>
        <input
          type="number"
          inputMode="numeric"
          min="1"
          max="60"
          className="set-number mono"
          value={cfg.progressSaveEvery}
          onChange={(e) => patch({ progressSaveEvery: Math.max(1, parseInt(e.target.value) || 5) })}
        />
      </div>
    </div>
  )
}

export default function Settings() {
  const { base, apikey, save } = useServerConfig()
  const navigate = useNavigate()
  const [b, setB] = useState(base)
  const [k, setK] = useState(apikey)
  const [stats, setStats] = useState(null)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState(null)
  const [showKey, setShowKey] = useState(false)
  const [linkMode, setLinkMode] = useState(localStorage.getItem('stash.linkmode') || 'app')

  useEffect(() => { setB(base); setK(apikey) }, [base, apikey])

  const test = async () => {
    setTesting(true)
    setResult(null)
    const prev = { base: getServer().base, apikey: getServer().apikey }
    setServer(b, k)
    try {
      const s = await gql(Q_STATS)
      setStats(s.stats)
      setResult('ok')
      save(b, k)
    } catch (e) {
      setResult(e.message)
      setServer(prev.base, prev.apikey)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Impostazioni</h1>
      <p className="page-sub">Connessione e comportamento di StashMobile</p>

      <div className="settings-card card">
        <label className="field-label"><Icon name="server" size={14} /> URL del server</label>
        <input
          type="url"
          inputMode="url"
          value={b}
          onChange={(e) => setB(e.target.value)}
          placeholder="http://192.168.1.x:9999"
          autoCapitalize="off"
          autoCorrect="off"
        />
        <div className="field-hint">Indirizzo del tuo server Stash sulla rete locale o VPN.</div>

        <label className="field-label" style={{ marginTop: 14 }}><Icon name="key" size={14} /> API Key</label>
        <div className="key-row">
          <input
            type={showKey ? 'text' : 'password'}
            value={k}
            onChange={(e) => setK(e.target.value)}
            placeholder="Settings → Security → API Key"
            autoCapitalize="off"
            autoCorrect="off"
          />
          <button className="key-toggle" onClick={() => setShowKey(!showKey)} aria-label="Mostra/nascondi">
            <Icon name="eye" size={16} />
          </button>
        </div>
        <div className="field-hint">Necessaria se sul server è attiva l'autenticazione.</div>

        <button className="btn" style={{ marginTop: 16, width: '100%' }} onClick={test} disabled={testing || !b}>
          {testing ? 'Test in corso…' : 'Testa e salva'}
        </button>

        {result === 'ok' && stats && (
          <div className="test-ok">
            <Icon name="check" size={15} /> Connesso — {stats.scene_count} scene, {stats.image_count} immagini, {stats.performer_count} performers
          </div>
        )}
        {result && result !== 'ok' && <div className="error-box">{result}</div>}
      </div>

      <PlaybackSettings />

      <div className="settings-card card">
        <label className="field-label"><Icon name="refresh" size={14} /> Gestione libreria</label>
        <button className="btn ghost" style={{ width: '100%' }} onClick={() => navigate('/tasks')}>
          <Icon name="chevron" size={14} /> Scansiona, genera, pulisci
        </button>
        <div className="field-hint">Scansione directory, anteprime, marker e pulizia del database.</div>
      </div>

      <div className="settings-card card">
        <label className="field-label"><Icon name="external" size={14} /> Apertura link</label>
        <div className="linkmode-row">
          <button
            className={'linkmode-opt' + (linkMode === 'app' ? ' on' : '')}
            onClick={() => { setLinkMode('app'); localStorage.setItem('stash.linkmode', 'app') }}
          >
            In app
          </button>
          <button
            className={'linkmode-opt' + (linkMode === 'browser' ? ' on' : '')}
            onClick={() => { setLinkMode('browser'); localStorage.setItem('stash.linkmode', 'browser') }}
          >
            Browser esterno
          </button>
        </div>
        <div className="field-hint">Come aprire i link esterni dalle schede.</div>
      </div>

      <div className="settings-about card">
        <div className="section-head" style={{ marginBottom: 6 }}>
          <h2 className="section-title">StashMobile</h2>
          <span className="chip mono">v{pkg.version}</span>
        </div>
        <p className="muted" style={{ fontSize: 13.5 }}>
          Client mobile per server <span className="mono">stashapp/stash</span> self-hosted.
          Nessun dato o telemetria esterna: il traffico resta esclusivamente tra il dispositivo e il tuo server.
        </p>
      </div>
    </div>
  )
}
