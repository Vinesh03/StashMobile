import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { gql, Q_SCENE, M_SCENE_UPDATE, authedUrl } from '../services/stash.js'
import { getPlayback } from '../services/playback.js'
import EditSheet from '../components/EditSheet.jsx'
import LinkRow from '../components/LinkRow.jsx'
import Stars from '../components/Stars.jsx'
import TopBar from '../components/TopBar.jsx'
import Icon from '../components/Icon.jsx'
import { fmtDuration, fmtSize, fmtDate } from '../lib/format.js'

function parseVttTime(s) {
  const p = s.trim().split(':')
  if (p.length === 3) return parseFloat(p[0]) * 3600 + parseFloat(p[1]) * 60 + parseFloat(p[2])
  if (p.length === 2) return parseFloat(p[0]) * 60 + parseFloat(p[1])
  return 0
}

function parseVtt(text) {
  const lines = text.split(/\r?\n/)
  const cues = []
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('-->')) {
      const [a, b] = lines[i].split('-->')
      const m = (lines[i + 1] || '').trim().match(/#xywh=(\d+),(\d+),(\d+),(\d+)/)
      if (m) cues.push({ start: parseVttTime(a), end: parseVttTime(b), x: +m[1], y: +m[2], w: +m[3], h: +m[4] })
    }
  }
  return cues
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2]

function Player({ stream, poster, vttUrl, spriteUrl, sceneId, resumeTime, fileDuration, onTimeRef }) {
  const videoRef = useRef(null)
  const boxRef = useRef(null)
  const progRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [showUi, setShowUi] = useState(true)
  const [loopOn, setLoopOn] = useState(false)
  const [cues, setCues] = useState([])
  const [scrub, setScrub] = useState(null)
  const hideTimer = useRef(null)
  const cfg = useRef(getPlayback())
  const startedAt = useRef(Date.now())

  const bumpUi = () => {
    setShowUi(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShowUi(false), 3000)
  }

  const [blobUrl, setBlobUrl] = useState(null)
  const loopVideoRef = useRef(null)

  useEffect(() => () => {
    clearTimeout(hideTimer.current)
    if (blobUrl) URL.revokeObjectURL(blobUrl)
  }, [blobUrl])

  useEffect(() => {
    if (!vttUrl) { setCues([]); return }
    let live = true
    fetch(authedUrl(vttUrl))
      .then((r) => (r.ok ? r.text() : ''))
      .then((t) => { if (live && t) setCues(parseVtt(t)) })
      .catch(() => {})
    return () => { live = false }
  }, [vttUrl])

  useEffect(() => {
    if (!cfg.current.trackPlays) return
    gql(`mutation($id: ID!) { sceneAddPlay(id: $id) { count } }`, { id: sceneId }).catch(() => {})
  }, [sceneId])

  const autoLoop = loopOn || (cfg.current.loopThreshold > 0 && (fileDuration || duration) > 0 && (fileDuration || duration) < cfg.current.loopThreshold)
  const [activeIsA, setActiveIsA] = useState(true)
  const swappedRef = useRef(false)

  useEffect(() => {
    if (!autoLoop) return
    let live = true
    setBlobUrl(null)
    setActiveIsA(true)
    swappedRef.current = false
    ;(async () => {
      try {
        const res = await fetch(authedUrl(stream))
        if (!res.ok) return
        const blob = await res.blob()
        if (live) setBlobUrl(URL.createObjectURL(blob))
      } catch { /* fallback */ }
    })()
    return () => {
      live = false
      const b = loopVideoRef.current
      if (b) { b.pause(); b.currentTime = 0 }
    }
  }, [autoLoop, stream])

  useEffect(() => {
    const v = loopVideoRef.current
    if (blobUrl && v) v.load()
  }, [blobUrl])

  useEffect(() => {
    if (!autoLoop || !blobUrl) return
    let raf
    const tick = () => {
      if (swappedRef.current) return
      const a = videoRef.current
      const b = loopVideoRef.current
      if (a && b && b.readyState >= 2) {
        if (a.paused) {
          if (!b.paused) { b.pause(); b.currentTime = 0 }
        } else if (a.duration > 0 && a.currentTime >= a.duration - 0.35 && b.paused) {
          b.play().catch(() => {})
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [autoLoop, blobUrl])

  const onEnded = () => {
    const a = videoRef.current
    const b = loopVideoRef.current
    if (!a || !b) return
    if (autoLoop && blobUrl && !swappedRef.current) {
      swappedRef.current = true
      b.muted = a.muted
      b.playbackRate = speed
      if (!a.muted) b.volume = a.volume ?? 1
      if (b.currentTime > 0.1) b.currentTime = 0
      setActiveIsA(false)
      if (b.paused) b.play().catch(() => {})
      setPlaying(true)
    } else if (!swappedRef.current && (autoLoop || loopOn)) {
      a.currentTime = 0
      a.play().catch(() => {})
    }
  }

  const onLoadedMetadata = (e) => {
    const v = e.currentTarget
    setDuration(v.duration || 0)
    if (cfg.current.resume && resumeTime > 3 && resumeTime < (v.duration || 0) - 5) {
      v.currentTime = resumeTime
    }
    if (cfg.current.autoStart) v.play().catch(() => {})
  }

  const activeVideo = useCallback(() => (activeIsA ? videoRef.current : loopVideoRef.current), [activeIsA])

  useEffect(() => {
    if (onTimeRef) onTimeRef.current = () => activeVideo()?.currentTime || 0
  }, [activeVideo, onTimeRef])

  useEffect(() => {
    if (!cfg.current.trackPlays) return
    const save = setInterval(() => {
      const v = activeVideo()
      if (!v || v.paused || !v.currentTime) return
      gql(`mutation($id: ID!, $rt: Float, $pd: Float) { sceneSaveActivity(id: $id, resume_time: $rt, playDuration: $pd) }`,
        { id: sceneId, rt: Math.round(v.currentTime * 100) / 100, pd: Math.round((Date.now() - startedAt.current) / 1000) }
      ).catch(() => {})
    }, (cfg.current.progressSaveEvery || 5) * 1000)
    return () => clearInterval(save)
  }, [sceneId, activeVideo])

  const toggle = () => {
    const v = activeVideo()
    if (!v) return
    if (v.paused) v.play().catch(() => {})
    else v.pause()
    bumpUi()
  }

  const skip = (s) => {
    const v = activeVideo()
    if (!v) return
    v.currentTime = Math.min(Math.max(0, v.currentTime + s), duration || v.duration || 0)
    bumpUi()
  }

  const muteAll = () => {
    const next = !muted
    setMuted(next)
    for (const v of [videoRef.current, loopVideoRef.current]) {
      if (v) v.muted = next
    }
    bumpUi()
  }

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed)
    const next = SPEEDS[(idx + 1) % SPEEDS.length]
    setSpeed(next)
    for (const v of [videoRef.current, loopVideoRef.current]) {
      if (v) v.playbackRate = next
    }
    bumpUi()
  }

  const updateScrubFromClientX = (clientX, commit = false) => {
    const bar = progRef.current
    const v = activeVideo()
    const total = duration || fileDuration || 0
    if (!bar || !total) return
    const rect = bar.getBoundingClientRect()
    const frac = Math.min(Math.max(0, (clientX - rect.left) / rect.width), 1)
    const sec = frac * total
    const cue = cues.find((c) => sec >= c.start && sec <= c.end) || null
    setScrub({ frac, sec, cue })
    if (commit && v) {
      v.currentTime = sec
      setCurrent(sec)
    }
    bumpUi()
  }

  const fullscreen = async () => {
    const v = videoRef.current
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        if (screen.orientation?.unlock) screen.orientation.unlock()
        return
      }
      if (boxRef.current?.requestFullscreen) {
        await boxRef.current.requestFullscreen()
        if (v?.videoWidth > 0 && screen.orientation?.lock) {
          try {
            await screen.orientation.lock(v.videoWidth >= v.videoHeight ? 'landscape' : 'portrait')
          } catch { /* ignore */ }
        }
      } else if (v?.webkitEnterFullscreen) v.webkitEnterFullscreen()
    } catch { /* ignore */ }
    bumpUi()
  }

  const sprAuth = spriteUrl ? authedUrl(spriteUrl) : null

  return (
    <div className="player card" ref={boxRef} onClick={bumpUi}>
      <div className="video-stack">
        <video
          className={activeIsA ? 'on' : 'off'}
          ref={videoRef}
          src={authedUrl(stream)}
          playsInline
          preload="none"
          poster={poster}
          onPlay={() => { if (activeIsA) setPlaying(true) }}
          onPause={(e) => { if (activeIsA && !e.currentTarget.ended) setPlaying(false) }}
          onEnded={onEnded}
          onTimeUpdate={(e) => { if (activeIsA) setCurrent(e.currentTarget.currentTime) }}
          onLoadedMetadata={onLoadedMetadata}
        />
        <video
          className={activeIsA ? 'off' : 'on'}
          ref={loopVideoRef}
          src={blobUrl || undefined}
          playsInline
          preload="auto"
          muted
          loop
          onPlay={() => { if (!activeIsA) setPlaying(true) }}
          onPause={(e) => { if (!activeIsA && !e.currentTarget.ended) setPlaying(false) }}
          onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => { if (!duration) setDuration(e.currentTarget.duration || 0) }}
        />
      </div>
      <div className={'pc-overlay' + (showUi || !playing ? ' on' : '')}>
        <button className="pc-btn" onClick={(e) => { e.stopPropagation(); skip(-10) }} aria-label="Indietro 10s">
          <Icon name="skipBack" size={22} />
        </button>
        <button className="pc-btn pc-main" onClick={(e) => { e.stopPropagation(); toggle() }} aria-label={playing ? 'Pausa' : 'Play'}>
          <Icon name={playing ? 'pause' : 'play'} size={30} />
        </button>
        <button className="pc-btn" onClick={(e) => { e.stopPropagation(); skip(10) }} aria-label="Avanti 10s">
          <Icon name="skipFwd" size={22} />
        </button>
      </div>
      <div className={'pc-bottom' + (showUi || !playing ? ' on' : '')} onClick={(e) => e.stopPropagation()}>
        {scrub && (
          <div
            className="scrub-pop"
            style={{ left: `clamp(52px, ${scrub.frac * 100}%, calc(100% - 52px))` }}
          >
            {scrub.cue && sprAuth && (
              <div
                className="scrub-sprite"
                style={{
                  width: `${scrub.cue.w}px`,
                  height: `${scrub.cue.h}px`,
                  backgroundImage: `url(${sprAuth})`,
                  backgroundPosition: `-${scrub.cue.x}px -${scrub.cue.y}px`,
                }}
              />
            )}
            <span className="scrub-time mono">{fmtDuration(scrub.sec)}</span>
          </div>
        )}
        <div
          ref={progRef}
          className="pc-progress"
          onClick={(e) => { updateScrubFromClientX(e.clientX, true); setTimeout(() => setScrub(null), 400) }}
          onMouseMove={(e) => updateScrubFromClientX(e.clientX, false)}
          onMouseLeave={() => setScrub(null)}
          onTouchStart={(e) => updateScrubFromClientX(e.touches[0].clientX, false)}
          onTouchMove={(e) => updateScrubFromClientX(e.touches[0].clientX, true)}
          onTouchEnd={() => setScrub(null)}
        >
          <div className="pc-progress-fill" style={{ width: duration ? `${(current / duration) * 100}%` : '0%' }} />
        </div>
        <div className="pc-row">
          <span className="pc-time mono">{fmtDuration(current)}{duration ? ` / ${fmtDuration(duration)}` : ''}</span>
          <div className="pc-actions">
            <button className={'pc-mini mono' + (speed !== 1 ? ' on' : '')} style={{ fontSize: 11.5, fontWeight: 600 }} onClick={cycleSpeed} aria-label="Velocità">
              {speed}x
            </button>
            <button className={'pc-mini' + (loopOn ? ' on' : '')} onClick={() => {
              const next = !loopOn
              setLoopOn(next)
              if (!next && !activeIsA) {
                const a = videoRef.current
                const b = loopVideoRef.current
                if (a && b) {
                  b.pause()
                  a.currentTime = b.currentTime % (a.duration || b.duration || 1)
                  setActiveIsA(true)
                  setPlaying(true)
                }
              }
            }} aria-label="Loop">
              <Icon name="repeat" size={16} />
            </button>
            <button className="pc-mini" onClick={muteAll} aria-label="Muto">
              <Icon name="volume" size={17} style={{ opacity: muted ? 0.4 : 1 }} />
            </button>
            <button className="pc-mini" onClick={fullscreen} aria-label="Schermo intero">
              <Icon name="fullscreen" size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SceneDetail() {
  const { id } = useParams()
  const [scene, setScene] = useState(null)
  const [err, setErr] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [toast, setToast] = useState(null)
  const [linkMode] = useState(localStorage.getItem('stash.linkmode') || 'app')
  const getTimeRef = useRef(() => 0)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  const load = useCallback(() => {
    gql(Q_SCENE, { id }).then((r) => setScene(r.findScene)).catch((e) => setErr(e.message))
  }, [id])

  useEffect(() => { load() }, [load])

  const patch = async (fields) => {
    setSaving(true)
    try {
      await gql(M_SCENE_UPDATE, { input: { id, ...fields } })
      setScene((s) => ({ ...s, ...fields }))
    } catch (e) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  const addO = async () => {
    try {
      const r = await gql(`mutation($id: ID!) { sceneAddO(id: $id) { count } }`, { id })
      setScene((s) => ({ ...s, o_counter: r.sceneAddO.count }))
      showToast(`Contatore O: ${r.sceneAddO.count}`)
    } catch (e) {
      setErr(e.message)
    }
  }

  const setCoverAtCurrent = async () => {
    const at = getTimeRef.current ? getTimeRef.current() : 0
    try {
      await gql(`mutation($id: ID!, $at: Float) { sceneGenerateScreenshot(id: $id, at: $at) }`, { id, at })
      showToast('Copertina aggiornata al frame corrente')
      load()
    } catch (e) {
      setErr(e.message)
    }
  }

  const clearResume = async () => {
    setScene((s) => ({ ...s, resume_time: 0 }))
    window.dispatchEvent(new CustomEvent('stash:resume-cleared', { detail: id }))
    try {
      await gql(`mutation($id: ID!) { sceneResetActivity(id: $id, reset_resume: true, reset_duration: false) sceneSaveActivity(id: $id, resume_time: 0) }`, { id })
      showToast('Punto di ripresa azzerato')
    } catch (e) {
      setErr(e.message)
    }
  }

  if (err) return <div className="page"><TopBar /><div className="error-box">{err}</div></div>
  if (!scene) return <div className="page"><TopBar /><div className="spinner" /></div>

  const file = scene.files?.[0]
  const stream = scene.paths?.stream
  const resumeTime = scene.resume_time || 0

  return (
    <div className="page detail-page">
      <TopBar title={scene.title || 'Senza titolo'}>
        <button className="pc-mini" onClick={setCoverAtCurrent} title="Usa frame come copertina" aria-label="Copertina da frame">
          <Icon name="camera" size={17} />
        </button>
        <button className="pc-mini" onClick={() => setEditing(true)} aria-label="Modifica">
          <Icon name="pencil" size={17} />
        </button>
      </TopBar>

      {toast && <div className="floating-toast">{toast}</div>}

      {stream && (
        <Player
          stream={stream}
          poster={scene.paths?.screenshot ? authedUrl(scene.paths.screenshot) : undefined}
          vttUrl={scene.paths?.vtt}
          spriteUrl={scene.paths?.sprite}
          sceneId={id}
          resumeTime={resumeTime}
          fileDuration={file?.duration || 0}
          onTimeRef={getTimeRef}
        />
      )}

      <div className="detail-head">
        <h1 className="detail-title">{scene.title || 'Senza titolo'}</h1>
        <div className="detail-chips">
          {scene.date && <span className="chip"><Icon name="calendar" size={11} /> {fmtDate(scene.date)}</span>}
          {file && <span className="chip mono">{file.width}×{file.height} · {fmtDuration(file.duration)}</span>}
          {file?.video_codec && <span className="chip mono">{file.video_codec.toUpperCase()}</span>}
          {file && <span className="chip mono">{fmtSize(file.size)}</span>}
          {scene.play_count > 0 && <span className="chip mono"><Icon name="play" size={10} /> {scene.play_count} play</span>}
          {scene.studio && <Link to="/tags" className="chip accent">{scene.studio.name}</Link>}
          {resumeTime > 3 && (
            <button className="chip accent clickable" onClick={clearResume} title="Azzera punto di ripresa">
              <Icon name="clock" size={11} /> {fmtDuration(resumeTime)} <Icon name="x" size={10} />
            </button>
          )}
        </div>
      </div>

      <div className="action-row card">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className={'action-btn' + (scene.organized ? ' on' : '')}
            onClick={() => patch({ organized: !scene.organized })}
          >
            <Icon name="check" size={15} /> {scene.organized ? 'Organizzata' : 'Da org.'}
          </button>
          <button className="action-btn" onClick={addO} title="Incrementa contatore O">
            <Icon name="flame" size={15} /> <span className="mono">{scene.o_counter || 0}</span>
          </button>
        </div>
        <div className="action-rating">
          <Stars value={scene.rating100 || 0} onChange={(v) => patch({ rating100: v })} />
          {saving && <span className="faint" style={{ fontSize: 11 }}>salvo…</span>}
        </div>
      </div>

      {(scene.performers || []).length > 0 && (
        <section className="detail-section">
          <h2 className="section-title">Performers</h2>
          <div className="perf-strip">
            {scene.performers.map((p) => (
              <Link to={`/performers/${p.id}`} key={p.id} className="perf-strip-item">
                <div className="perf-strip-avatar">
                  {p.image_path ? <img src={authedUrl(p.image_path)} alt="" loading="lazy" /> : <Icon name="user" size={20} />}
                </div>
                <span className="perf-strip-name">{p.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {(scene.scene_markers || []).length > 0 && (
        <section className="detail-section">
          <h2 className="section-title">Marcatori</h2>
          <div className="marker-list">
            {scene.scene_markers.map((m) => (
              <button
                key={m.id}
                className="marker-item card clickable"
                onClick={() => {
                  const v = document.querySelector('.video-stack video.on')
                  if (v) {
                    v.currentTime = m.seconds
                    v.play().catch(() => {})
                    v.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }}
              >
                {m.screenshot && (
                  <img className="marker-thumb" src={authedUrl(m.screenshot)} alt="" loading="lazy" />
                )}
                <span className="chip accent mono">{fmtDuration(m.seconds)}</span>
                <span className="marker-title">{m.title}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {scene.details && (
        <section className="detail-section">
          <h2 className="section-title">Trama</h2>
          <p className="detail-desc">{scene.details}</p>
        </section>
      )}

      {(scene.tags || []).length > 0 && (
        <section className="detail-section">
          <h2 className="section-title">Tag</h2>
          <div className="tag-cloud">
            {scene.tags.map((t) => (
              <Link key={t.id} to={`/scenes?tags=${t.id}`} className="chip">{t.name}</Link>
            ))}
          </div>
        </section>
      )}

      {file?.path && (
        <section className="detail-section">
          <h2 className="section-title">File</h2>
          <div className="file-path card mono">{file.path}</div>
        </section>
      )}

      {(scene.urls || []).length > 0 && (
        <section className="detail-section">
          <div className="section-head">
            <h2 className="section-title">Link</h2>
            <span className="faint" style={{ fontSize: 11.5 }}>
              apre {linkMode === 'browser' ? 'nel browser' : 'in app'}
            </span>
          </div>
          {scene.urls.map((u) => (
            <LinkRow key={u} url={u} mode={linkMode} />
          ))}
        </section>
      )}

      {editing && (
        <EditSheet
          kind="scene"
          data={scene}
          onClose={() => setEditing(false)}
          onSaved={() => load()}
        />
      )}
    </div>
  )
}
