import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { gql, Q_TAGS } from '../services/stash.js'
import PullToRefresh from '../components/PullToRefresh.jsx'
import Icon from '../components/Icon.jsx'

export default function Tags() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await gql(Q_TAGS)
      setTags(r.findTags.tags)
      setErr(null)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = tags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <PullToRefresh onRefresh={load}>
      <div className="page">
        <h1 className="page-title">Tag</h1>
        <p className="page-sub">{loading ? 'Carico…' : `${tags.length} tag`}</p>

        <div className="search-row">
          <div className="search-wrap">
            <Icon name="search" size={16} />
            <input type="search" placeholder="Cerca tag…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {err && <div className="error-box">{err} <button className="btn ghost" style={{ marginTop: 10 }} onClick={load}>Riprova</button></div>}

        {loading ? (
          <div className="spinner" />
        ) : (
          <div className="tag-list">
            {filtered.map((t) => (
              <div key={t.id} className="tag-row-item card">
                <button className="tag-main clickable" onClick={() => navigate(`/scenes?tags=${t.id}`)}>
                  <span className="chip"><Icon name="tag" size={11} /> {t.name}</span>
                </button>
                <div className="tag-counts">
                  <button className="chip clickable mono" onClick={() => navigate(`/scenes?tags=${t.id}`)}>
                    <Icon name="film" size={11} /> {t.scene_count ?? 0}
                  </button>
                  {(t.image_count ?? 0) > 0 && (
                    <button className="chip clickable mono" onClick={() => navigate(`/images?tags=${t.id}`)}>
                      <Icon name="image" size={11} /> {t.image_count}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="empty-state">Nessun tag</div>}
          </div>
        )}
      </div>
    </PullToRefresh>
  )
}
