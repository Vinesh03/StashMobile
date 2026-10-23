import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { authedUrl } from '../services/stash.js'
import Icon from './Icon.jsx'

export default function Lightbox({ img, onClose, onPrev, onNext }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  const touchX = useRef(null)
  const fullUrl = img.paths?.image

  useEffect(() => {
    setLoaded(false)
    setFailed(false)
  }, [img.id])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && onPrev) onPrev()
      if (e.key === 'ArrowRight' && onNext) onNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onPrev, onNext])

  const onTouchStart = (e) => {
    touchX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e) => {
    if (touchX.current === null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    touchX.current = null
    if (dx > 55 && onPrev) onPrev()
    else if (dx < -55 && onNext) onNext()
  }

  return (
    <div className="lightbox" onClick={onClose} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {!loaded && !failed && img.paths?.thumbnail && (
        <img className="lightbox-blur" src={authedUrl(img.paths.thumbnail)} alt="" />
      )}
      {failed ? (
        <div className="empty-state" onClick={(e) => e.stopPropagation()}>
          <div className="big">⌀</div>
          Immagine non caricata
          <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => { setFailed(false); setRetry((r) => r + 1) }}>Riprova</button>
        </div>
      ) : (
        <img
          key={`${img.id}-${retry}`}
          className="lightbox-full"
          src={authedUrl(fullUrl)}
          alt=""
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          style={{ opacity: loaded ? 1 : 0 }}
        />
      )}

      <div className="lightbox-top" onClick={(e) => e.stopPropagation()}>
        <Link to={`/images/${img.id}`} className="chip clickable accent">
          <Icon name="info" size={13} /> Dettagli
        </Link>
        <button className="lightbox-close" onClick={onClose} aria-label="Chiudi">
          <Icon name="x" size={20} />
        </button>
      </div>

      {onPrev && (
        <button
          className="lightbox-nav prev"
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          aria-label="Precedente"
        >
          <Icon name="chevron" size={20} style={{ transform: 'rotate(180deg)' }} />
        </button>
      )}
      {onNext && (
        <button
          className="lightbox-nav next"
          onClick={(e) => { e.stopPropagation(); onNext() }}
          aria-label="Successiva"
        >
          <Icon name="chevron" size={20} />
        </button>
      )}

      {img.performers?.length > 0 && (
        <div className="lightbox-perfs">
          {img.performers.map((p) => (
            <Link key={p.id} to={`/performers/${p.id}`} className="chip" onClick={(e) => e.stopPropagation()}>
              <Icon name="user" size={11} /> {p.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
