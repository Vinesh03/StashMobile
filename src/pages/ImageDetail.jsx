import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { gql, Q_IMAGE, authedUrl } from '../services/stash.js'
import EditSheet from '../components/EditSheet.jsx'
import LinkRow from '../components/LinkRow.jsx'
import Stars from '../components/Stars.jsx'
import TopBar from '../components/TopBar.jsx'
import Icon from '../components/Icon.jsx'
import { fmtSize, fmtDate } from '../lib/format.js'

export default function ImageDetail() {
  const { id } = useParams()
  const [img, setImg] = useState(null)
  const [err, setErr] = useState(null)
  const [editing, setEditing] = useState(false)
  const [linkMode] = useState(localStorage.getItem('stash.linkmode') || 'app')

  const load = useCallback(() => {
    gql(Q_IMAGE, { id }).then((r) => setImg(r.findImage)).catch((e) => setErr(e.message))
  }, [id])

  useEffect(() => { load() }, [load])

  const rate = (v) => {
    gql(`mutation($id: ID!, $r: Int) { imageUpdate(input: {id: $id, rating100: $r}) { id } }`, { id, r: v })
      .then(() => setImg((im) => ({ ...im, rating100: v })))
      .catch((e) => setErr(e.message))
  }

  const incO = () => {
    gql(`mutation($id: ID!) { imageIncrementO(id: $id) }`, { id })
      .then((r) => setImg((im) => ({ ...im, o_counter: r.imageIncrementO })))
      .catch((e) => setErr(e.message))
  }

  if (err) return <div className="page"><TopBar /><div className="error-box">{err} <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => { setErr(null); load() }}>Riprova</button></div></div>
  if (!img) return <div className="page"><TopBar /><div className="spinner" /></div>

  const file = img.files?.[0]

  return (
    <div className="page detail-page">
      <TopBar title={img.title || 'Immagine'}>
        <button className="pc-mini" onClick={() => setEditing(true)} aria-label="Modifica">
          <Icon name="pencil" size={17} />
        </button>
      </TopBar>

      <img
        className="image-full"
        src={authedUrl(img.paths?.image)}
        alt=""
        loading="eager"
        decoding="async"
      />

      <div className="detail-head">
        <h1 className="detail-title">{img.title || 'Senza titolo'}</h1>
        <div className="detail-chips">
          {img.date && <span className="chip"><Icon name="calendar" size={11} /> {fmtDate(img.date)}</span>}
          {file && <span className="chip mono">{file.width}×{file.height}</span>}
          {file && <span className="chip mono">{fmtSize(file.size)}</span>}
          {img.studio && <span className="chip accent">{img.studio.name}</span>}
        </div>
      </div>

      <div className="action-row card">
        <button className="action-btn" onClick={incO}>
          <Icon name="flame" size={15} /> <span className="mono">{img.o_counter || 0}</span>
        </button>
        <div className="action-rating">
          <Stars value={img.rating100 || 0} onChange={(v) => rate(v)} />
        </div>
      </div>

      {editing && <EditSheet kind="image" data={img} onClose={() => setEditing(false)} onSaved={() => load()} />}

      {(img.performers || []).length > 0 && (
        <section className="detail-section">
          <h2 className="section-title">Performers</h2>
          <div className="perf-strip">
            {img.performers.map((p) => (
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

      {(img.tags || []).length > 0 && (
        <section className="detail-section">
          <h2 className="section-title">Tag</h2>
          <div className="tag-cloud">
            {img.tags.map((t) => (
              <Link key={t.id} to={`/images?tags=${t.id}`} className="chip">{t.name}</Link>
            ))}
          </div>
        </section>
      )}

      {(img.urls || []).length > 0 && (
        <section className="detail-section">
          <h2 className="section-title">Link</h2>
          {img.urls.map((u) => <LinkRow key={u} url={u} mode={linkMode} />)}
        </section>
      )}
    </div>
  )
}
