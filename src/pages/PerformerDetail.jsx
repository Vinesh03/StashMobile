import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { gql, Q_PERFORMER, Q_IMAGES, Q_SCENES, M_PERFORMER_UPDATE, authedUrl } from '../services/stash.js'
import { getPlayback } from '../services/playback.js'
import TopBar from '../components/TopBar.jsx'
import SceneCard from '../components/SceneCard.jsx'
import Lightbox from '../components/Lightbox.jsx'
import EditSheet from '../components/EditSheet.jsx'
import Stars from '../components/Stars.jsx'
import Icon from '../components/Icon.jsx'
import LinkRow from '../components/LinkRow.jsx'
import { useThumb } from '../hooks/index.js'
import { fmtDate, fmtHeight } from '../lib/format.js'

export default function PerformerDetail() {
  const { id } = useParams()
  const [p, setP] = useState(null)
  const [err, setErr] = useState(null)
  const [tab, setTab] = useState('media')
  const [editing, setEditing] = useState(false)
  const [linkMode] = useState(localStorage.getItem('stash.linkmode') || 'app')

  const load = useCallback(() => {
    gql(Q_PERFORMER, { id }).then((r) => setP(r.findPerformer)).catch((e) => setErr(e.message))
  }, [id])

  useEffect(() => { load() }, [load])

  const heroThumb = useThumb(authedUrl(p?.image_path), 256)

  const patch = async (fields) => {
    try {
      await gql(M_PERFORMER_UPDATE, { input: { id, ...fields } })
      setP((cur) => ({ ...cur, ...fields }))
    } catch (e) {
      setErr(e.message)
    }
  }

  if (err) return <div className="page"><TopBar /><div className="error-box">{err} <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => { setErr(null); load() }}>Riprova</button></div></div>
  if (!p) return <div className="page"><TopBar /><div className="spinner" /></div>

  const age = p.birthdate
    ? Math.floor((Date.now() - new Date(p.birthdate).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null

  const INFO = [
    ['Paese', p.country],
    ['Nascita', p.birthdate ? `${fmtDate(p.birthdate)}${age !== null ? ` (${age} anni)` : ''}` : null],
    ['Occhi', p.eye_color],
    ['Capelli', p.hair_color],
    ['Etnia', p.ethnicity],
    ['Altezza', p.height_cm ? fmtHeight(p.height_cm) : null],
    ['Peso', p.weight ? `${p.weight} kg` : null],
    ['Misure', p.measurements],
    ['Seni fatti', p.fake_tits],
    ['Tatuaggi', p.tattoos],
    ['Piercing', p.piercings],
    ['Carriera', p.career_start ? `${fmtDate(p.career_start)}${p.career_end ? ` → ${fmtDate(p.career_end)}` : ' → in attività'}` : null],
  ].filter(([, v]) => v !== null && v !== undefined && v !== '')

  return (
    <div className="page detail-page">
      <TopBar title={p.name}>
        <button
          className={'pc-mini' + (p.favorite ? ' on' : '')}
          onClick={() => patch({ favorite: !p.favorite })}
          aria-label="Preferito"
        >
          <Icon name={p.favorite ? 'heartFill' : 'heart'} size={17} />
        </button>
        <button className="pc-mini" onClick={() => setEditing(true)} aria-label="Modifica">
          <Icon name="pencil" size={17} />
        </button>
      </TopBar>

      <div className="perf-hero card">
        <div className="perf-hero-img">
          {heroThumb ? <img src={heroThumb} alt="" /> : <Icon name="user" size={40} />}
        </div>
        <div className="perf-hero-meta">
          <h1 className="detail-title">{p.name}</h1>
          {p.disambiguation && <div className="perf-disamb">{p.disambiguation}</div>}
          <div className="perf-hero-chips">
            {p.gender && <span className="chip accent">{p.gender === 'MALE' ? 'M' : p.gender === 'FEMALE' ? 'F' : 'I'}</span>}
            <span className="chip accent"><Icon name="film" size={11} /> {p.scene_count ?? 0} scene</span>
            {(p.image_count ?? 0) > 0 && <span className="chip"><Icon name="image" size={11} /> {p.image_count} img</span>}
            {p.alias_list?.length > 0 && <span className="chip">{p.alias_list.length} alias</span>}
          </div>
          <div style={{ marginTop: 8 }}>
            <Stars value={p.rating100 || 0} onChange={(v) => patch({ rating100: v })} size={18} />
          </div>
        </div>
      </div>

      <div className="perf-tabs">
        <button className={'perf-tab' + (tab === 'media' ? ' on' : '')} onClick={() => setTab('media')}>Media</button>
        <button className={'perf-tab' + (tab === 'info' ? ' on' : '')} onClick={() => setTab('info')}>Info</button>
      </div>
      {tab === 'info' ? (
        <>
          {INFO.length > 0 && (
            <section className="detail-section">
              <div className="info-grid">
                {INFO.map(([k, v]) => (
                  <div key={k} className="info-row">
                    <span className="info-k">{k}</span>
                    <span className="info-v">{v}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {p.details && (
            <section className="detail-section">
              <h2 className="section-title">Biografia</h2>
              <p className="detail-desc">{p.details}</p>
            </section>
          )}

          {p.alias_list?.length > 0 && (
            <section className="detail-section">
              <h2 className="section-title">Alias</h2>
              <div className="tag-cloud">
                {p.alias_list.map((a) => <span key={a} className="chip mono">{a}</span>)}
              </div>
            </section>
          )}

          {p.tags?.length > 0 && (
            <section className="detail-section">
              <h2 className="section-title">Tag</h2>
              <div className="tag-cloud">
                {p.tags.map((t) => <Link key={t.id} to={`/scenes?tags=${t.id}`} className="chip">{t.name}</Link>)}
              </div>
            </section>
          )}

          {p.urls?.length > 0 && (
            <section className="detail-section">
              <h2 className="section-title">Link</h2>
              {p.urls.map((u) => <LinkRow key={u} url={u} mode={linkMode} />)}
            </section>
          )}
        </>
      ) : (
        <PerformerMedia id={id} />
      )}

      {editing && (
        <EditSheet
          kind="performer"
          data={p}
          onClose={() => setEditing(false)}
          onSaved={() => load()}
        />
      )}
    </div>
  )
}

function PerformerMedia({ id }) {
  const [scenes, setScenes] = useState([])
  const [sceneCount, setSceneCount] = useState(0)
  const [images, setImages] = useState([])
  const [imgCount, setImgCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [lightboxIdx, setLightboxIdx] = useState(null)
  const pb = getPlayback()

  useEffect(() => {
    let live = true
    ;(async () => {
      try {
        const [rs, ri] = await Promise.allSettled([
          gql(Q_SCENES, { page: 1, per: 25, sort: 'date', dir: 'DESC', perf: { value: [id], modifier: 'INCLUDES' } }),
          gql(Q_IMAGES, { page: 1, per: 100, perf: { value: [id], modifier: 'INCLUDES' } }),
        ])
        if (!live) return
        if (rs.status === 'fulfilled') {
          setScenes(rs.value.findScenes.scenes)
          setSceneCount(rs.value.findScenes.count)
        }
        if (ri.status === 'fulfilled') {
          setImages(ri.value.findImages.images)
          setImgCount(ri.value.findImages.count)
        }
        if (rs.status === 'rejected' && ri.status === 'rejected') throw rs.reason
      } catch (e) {
        if (live) setErr(e.message)
      } finally {
        if (live) setLoading(false)
      }
    })()
    return () => { live = false }
  }, [id])

  if (loading) return <div className="spinner" />
  if (err) return <div className="error-box">{err}</div>
  if (scenes.length === 0 && images.length === 0)
    return <div className="empty-state"><div className="big">⌀</div>Nessun media di questo performer</div>

  return (
    <>
      {scenes.length > 0 && (
        <section className="detail-section">
          <h2 className="section-title">{sceneCount} scene</h2>
          <div className="scene-list">
            {scenes.map((s) => <SceneCard key={s.id} scene={s} layout={pb.sceneLayout} autoPreview={pb.autoPreview} />)}
          </div>
        </section>
      )}

      {images.length > 0 && (
        <section className="detail-section">
          <h2 className="section-title">{imgCount} immagini</h2>
          <div className="img-grid">
            {images.map((im, idx) => (
              <button key={im.id} className="img-tile clickable" onClick={() => setLightboxIdx(idx)}>
                <img src={authedUrl(im.paths?.thumbnail || im.paths?.image)} alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.opacity = 0.25 }} />
              </button>
            ))}
          </div>
        </section>
      )}
      {lightboxIdx !== null && images[lightboxIdx] && (
        <Lightbox
          img={images[lightboxIdx]}
          onClose={() => setLightboxIdx(null)}
          onPrev={lightboxIdx > 0 ? () => setLightboxIdx((i) => i - 1) : null}
          onNext={lightboxIdx < images.length - 1 ? () => setLightboxIdx((i) => i + 1) : null}
        />
      )}
    </>
  )
}
