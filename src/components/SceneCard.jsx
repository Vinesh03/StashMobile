import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { gql, authedUrl } from '../services/stash.js'
import { useThumb } from '../hooks/index.js'
import { fmtDuration, fmtDate } from '../lib/format.js'
import Icon from './Icon.jsx'

export default function SceneCard({ scene, layout = 'cards', autoPreview = false, onClearResume }) {
  const dur = scene.files?.[0]?.duration || 0
  const w = scene.files?.[0]?.width
  const h = scene.files?.[0]?.height
  const vertical = h > w
  const perf = (scene.performers || []).map((p) => p.name).join(', ')
  const ssUrl = scene.paths?.screenshot ? authedUrl(scene.paths.screenshot) : null
  const previewUrl = scene.paths?.preview ? authedUrl(scene.paths.preview) : (scene.paths?.stream ? authedUrl(scene.paths.stream) : null)
  const thumb = useThumb(ssUrl, layout === 'cards' ? 480 : 320)

  const [previewing, setPreviewing] = useState(false)
  const [vidReady, setVidReady] = useState(false)
  const [localResume, setLocalResume] = useState(scene.resume_time || 0)
  const [clearing, setClearing] = useState(false)
  const cardRef = useRef(null)

  useEffect(() => {
    setLocalResume(scene.resume_time || 0)
  }, [scene.resume_time])

  useEffect(() => {
    const onCleared = (e) => {
      if (String(e.detail) === String(scene.id)) {
        setLocalResume(0)
      }
    }
    window.addEventListener('stash:resume-cleared', onCleared)
    return () => window.removeEventListener('stash:resume-cleared', onCleared)
  }, [scene.id])

  const resumePct = dur > 0 && localResume > 3 ? Math.min(100, Math.round((localResume / dur) * 100)) : 0

  useEffect(() => {
    if (!autoPreview || !previewUrl || !cardRef.current) return
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0]
        if (e.isIntersecting && e.intersectionRatio >= 0.75) {
          setPreviewing(true)
        } else {
          setPreviewing(false)
          setVidReady(false)
        }
      },
      { threshold: [0, 0.75, 1] }
    )
    io.observe(cardRef.current)
    return () => io.disconnect()
  }, [autoPreview, previewUrl])

  const togglePreview = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (previewing) {
      setPreviewing(false)
      setVidReady(false)
    } else {
      setPreviewing(true)
    }
  }

  const handleClearResume = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (clearing) return
    setClearing(true)
    setLocalResume(0)
    window.dispatchEvent(new CustomEvent('stash:resume-cleared', { detail: scene.id }))
    if (onClearResume) onClearResume(scene.id)
    try {
      await gql(
        `mutation($id: ID!) {
          sceneResetActivity(id: $id, reset_resume: true, reset_duration: false)
          sceneSaveActivity(id: $id, resume_time: 0)
        }`,
        { id: scene.id }
      )
    } catch { /* ignore */ } finally {
      setClearing(false)
    }
  }

  return (
    <Link
      ref={cardRef}
      to={`/scenes/${scene.id}`}
      className={'scene-card card' + (layout === 'cards' ? ' wide' : '') + (previewing ? ' is-previewing' : '')}
      onMouseEnter={() => { if (!('ontouchstart' in window) && previewUrl) setPreviewing(true) }}
      onMouseLeave={() => { if (!('ontouchstart' in window)) { setPreviewing(false); setVidReady(false) } }}
    >
      <div className={'scene-thumb' + (vertical && layout !== 'cards' ? ' vert' : '')}>
        {thumb ? (
          <img src={thumb} alt="" loading="lazy" />
        ) : (
          <div className="thumb-fallback"><Icon name="film" size={26} /></div>
        )}

        {previewing && previewUrl && (
          <video
            className={'thumb-video' + (vidReady ? ' ready' : '')}
            src={previewUrl}
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
            onCanPlay={() => setVidReady(true)}
          />
        )}

        {previewUrl && (
          <button
            type="button"
            className={'thumb-preview-btn' + (previewing ? ' on' : '')}
            onClick={togglePreview}
            aria-label={previewing ? 'Ferma anteprima' : 'Anteprima video'}
          >
            <Icon name={previewing ? 'pause' : 'eye'} size={13} />
            {layout === 'cards' && <span>{previewing ? 'In corso' : 'Anteprima'}</span>}
          </button>
        )}

        {localResume > 3 && (
          <button
            type="button"
            className="thumb-remove-btn"
            onClick={handleClearResume}
            disabled={clearing}
            aria-label="Rimuovi da Continua a guardare"
            title="Rimuovi da Continua a guardare"
          >
            <Icon name="x" size={13} />
          </button>
        )}

        {dur ? <span className="thumb-badge mono">{fmtDuration(dur)}</span> : null}
        {scene.organized ? <span className="thumb-org"><Icon name="check" size={12} /></span> : null}
        {resumePct > 0 && (
          <div className="thumb-progress">
            <div className="thumb-progress-fill" style={{ width: `${resumePct}%` }} />
          </div>
        )}
      </div>
      <div className="scene-meta">
        <div className="scene-title">{scene.title || 'Senza titolo'}</div>
        <div className="scene-sub">
          {perf ? perf : scene.studio?.name || '—'}
        </div>
        <div className="scene-chips">
          {localResume > 3 && (
            <button
              type="button"
              className="chip accent clickable"
              onClick={handleClearResume}
              disabled={clearing}
              title="Rimuovi da Continua a guardare"
            >
              <Icon name="clock" size={10} /> {fmtDuration(localResume)} <Icon name="x" size={10} />
            </button>
          )}
          {scene.date ? <span className="chip"><Icon name="calendar" size={11} /> {fmtDate(scene.date)}</span> : null}
          {scene.rating100 ? (
            <span className="chip accent"><Icon name="star" size={11} /> {(scene.rating100 / 20).toFixed(1)}</span>
          ) : null}
          {scene.o_counter > 0 ? (
            <span className="chip mono"><Icon name="flame" size={11} /> {scene.o_counter}</span>
          ) : null}
          {w && h ? <span className="chip mono">{vertical ? `${h}×${w}` : `${w}×${h}`}</span> : null}
          {(scene.scene_markers || []).length > 0 ? (
            <span className="chip"><Icon name="marker" size={11} /> {scene.scene_markers.length}</span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
