import { useState, useEffect, useRef, useCallback } from 'react'
import { gql, authedUrl } from '../services/stash.js'
import TopBar from '../components/TopBar.jsx'
import Icon from '../components/Icon.jsx'

const Q_JOB_QUEUE = `query { jobQueue { id status subTasks description progress startTime error } }`
const Q_VERSION = `query { version { version hash build_time } systemStatus { status os databaseSchema databasePath appSchema ffmpegPath } }`

const M_SCAN = `mutation($input: ScanMetadataInput!) { metadataScan(input: $input) }`
const M_GENERATE = `mutation($input: GenerateMetadataInput!) { metadataGenerate(input: $input) }`
const M_AUTOTAG = `mutation($input: AutoTagMetadataInput!) { metadataAutoTag(input: $input) }`
const M_CLEAN = `mutation($input: CleanMetadataInput!) { metadataClean(input: $input) }`
const M_STOP = `mutation($id: ID!) { stopJob(id: $id) }`
const M_STOP_ALL = `mutation { stopAllJobs }`

function ProgressBar({ value }) {
  const pct = Math.round((value || 0) * 100)
  return (
    <div className="task-progress">
      <div className="task-progress-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}

// Riga azione: icona + nome + descrizione + pulsante
function ActionRow({ icon, name, hint, onRun, running }) {
  return (
    <div className="set-row">
      <div className="task-ico"><Icon name={icon} size={17} /></div>
      <div className="set-info">
        <div className="set-name">{name}</div>
        <div className="set-hint">{hint}</div>
      </div>
      <button className="btn ghost task-run" onClick={onRun} disabled={running}>
        {running ? '…' : 'Avvia'}
      </button>
    </div>
  )
}

export default function Tasks() {
  const [busy, setBusy] = useState({}) // true finché il job appare in coda
  const [queueEmpty, setQueueEmpty] = useState(true)
  const [ver, setVer] = useState(null)
  const [sys, setSys] = useState(null)

  // opzioni generate (default della web UI di Stash)
  const [gen, setGen] = useState({ previews: true, markers: true, phashes: false, sprites: false, transcodes: false })

  useEffect(() => {
    gql(Q_VERSION).then((r) => { setVer(r.version); setSys(r.systemStatus) }).catch(() => {})
  }, [])

  // quando la coda si svuota, i pulsanti si riattivano
  useEffect(() => {
    if (queueEmpty) setBusy({})
  }, [queueEmpty])

  const run = async (key, mutation, variables) => {
    setBusy((b) => ({ ...b, [key]: true }))
    try {
      await gql(mutation, variables)
      setQueueEmpty(false) // il job è stato accettato: poll della coda lo mostrerà
    } catch {
      setBusy((b) => ({ ...b, [key]: false }))
    }
  }

  const stopJob = async (id) => { gql(M_STOP, { id }).catch(() => {}) }

  return (
    <div className="page">
      <TopBar title="Attività" />

      <section className="detail-section">
        <h2 className="section-title">Coda</h2>
        <JobQueuePoll onEmpty={(empty) => setQueueEmpty(empty)} onStop={stopJob} />
      </section>

      <section className="detail-section">
        <h2 className="section-title">Libreria</h2>
        <div className="settings-card card">
          <ActionRow
            icon="search"
            name="Scansiona"
            hint="Cerca nuovi contenuti nelle directory configurate."
            running={busy.scan}
            onRun={() => run('scan', M_SCAN, { input: { rescan: false } })}
          />
          <ActionRow
            icon="refresh"
            name="Riscansiona forzato"
            hint="Ripete la scansione anche dei file già noti (usare se file modificati)."
            running={busy.rescan}
            onRun={() => run('rescan', M_SCAN, { input: { rescan: true } })}
          />
          <ActionRow
            icon="broom"
            name="Pulisci"
            hint="Rimuove i contenuti non più presenti sui dischi."
            running={busy.clean}
            onRun={() => run('clean', M_CLEAN, { input: { dryRun: false } })}
          />
        </div>
      </section>

      <section className="detail-section">
        <h2 className="section-title">Genera</h2>
        <div className="settings-card card">
          <div className="set-row" style={{ borderBottom: 'none', paddingBottom: 4 }}>
            <div className="set-info">
              <div className="set-name">Opzioni</div>
              <div className="set-hint">Cosa generare per i contenuti senza.</div>
            </div>
          </div>
          {[
            ['previews', 'Anteprime video', 'Clip di anteprima per le scene (hover/web).'],
            ['markers', 'Marcatori', 'Screenshot dei marker delle scene.'],
            ['phashes', 'PHash', 'Fingerprint per il rilevamento duplicati.'],
            ['sprites', 'Sprites', 'Sprite per lo scrub sulla barra di avanzamento.'],
            ['transcodes', 'Transcodifiche', 'Versioni transcodificate (formati non supportati).'],
          ].map(([k, name, hint]) => (
            <div className="set-row" key={k}>
              <div className="set-info">
                <div className="set-name">{name}</div>
                <div className="set-hint">{hint}</div>
              </div>
              <ToggleSmall on={gen[k]} onChange={(v) => setGen((g) => ({ ...g, [k]: v }))} />
            </div>
          ))}
          <button
            className="btn"
            style={{ marginTop: 12, width: '100%' }}
            disabled={busy.generate || !(gen.previews || gen.markers || gen.phashes || gen.sprites || gen.transcodes)}
            onClick={() => run('generate', M_GENERATE, {
              input: {
                previews: gen.previews,
                markers: gen.markers,
                phashes: gen.phashes,
                sprites: gen.sprites,
                transcodes: gen.transcodes,
                overwrite: false,
              },
            })}
          >
            {busy.generate ? 'Avvio…' : 'Avvia generazione'}
          </button>
        </div>
      </section>

      {(ver || sys) && (
        <section className="detail-section">
          <h2 className="section-title">Informazioni server</h2>
          <div className="settings-card card">
            <div className="kv-grid">
              {ver && <><div className="kv-k">Versione</div><div className="kv-v mono">{ver.version}</div></>}
              {ver && <><div className="kv-k">Build</div><div className="kv-v mono">{String(ver.build_time || '').slice(0, 10)}</div></>}
              {sys && <><div className="kv-k">Stato</div><div className="kv-v">{sys.status}</div></>}
              {sys && <><div className="kv-k">OS</div><div className="kv-v mono">{sys.os}</div></>}
              {sys && <><div className="kv-k">Schema DB</div><div className="kv-v mono">{sys.databaseSchema}</div></>}
              {sys?.ffmpegPath && <><div className="kv-k">FFmpeg</div><div className="kv-v mono">{sys.ffmpegPath.split('/').pop()}</div></>}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

// Poll della coda per segnalare quando si svuota (riattiva i pulsanti)
function JobQueuePoll({ onEmpty, onStop }) {
  const [jobs, setJobs] = useState(null)
  const [err, setErr] = useState(null)
  const timer = useRef(null)

  const load = useCallback(async () => {
    try {
      const r = await gql(Q_JOB_QUEUE)
      const q = r.jobQueue || []
      setJobs(q)
      setErr(null)
      if (q.length === 0) onEmpty(true)
    } catch (e) { setErr(e.message) /* la pagina mostra il messaggio invece dello spinner eterno */ }
  }, [onEmpty])

  useEffect(() => {
    load()
    timer.current = setInterval(load, 2000)
    return () => clearInterval(timer.current)
  }, [load])

  if (err && jobs === null) return <div className="error-box">{err}</div>
  if (jobs === null) return <div className="spinner" />
  if (jobs.length === 0) {
    return (
      <div className="empty-state">
        <div className="big">⌀</div>
        Nessuna attività in corso
      </div>
    )
  }

  const statusLabel = { RUNNING: 'In corso', READY: 'In coda', STOPPING: 'Arresto', FINISHED: 'Finita', CANCELLED: 'Annullata', FAILED: 'Errore' }

  return (
    <div className="task-list">
      {jobs.map((j) => (
        <div key={j.id} className="task-item card">
          <div className="task-head">
            <span className={'task-status ' + (j.status === 'RUNNING' ? 'run' : 'queue')}>
              {j.status === 'RUNNING' && <span className="task-dot" />}
              {statusLabel[j.status] || j.status}
            </span>
            <button className="pc-mini" onClick={() => onStop(j.id)} aria-label="Arresta">
              <Icon name="x" size={15} />
            </button>
          </div>
          <div className="task-desc">{j.description || 'Attività'}</div>
          {j.status === 'RUNNING' && <ProgressBar value={j.progress} />}
          {j.status === 'RUNNING' && j.subTasks?.length > 0 && (
            <div className="task-sub mono">{j.subTasks[j.subTasks.length - 1]}</div>
          )}
        </div>
      ))}
    </div>
  )
}

function ToggleSmall({ on, onChange }) {
  return (
    <button className={'toggle' + (on ? ' on' : '')} role="switch" aria-checked={on} onClick={() => onChange(!on)}>
      <span className="toggle-knob" />
    </button>
  )
}
