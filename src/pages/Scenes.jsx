import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { gql, Q_SCENES, Q_TAGS } from '../services/stash.js'
import { getPlayback, setPlayback } from '../services/playback.js'
import SceneCard from '../components/SceneCard.jsx'
import SortSelect from '../components/SortSelect.jsx'
import PullToRefresh from '../components/PullToRefresh.jsx'
import Icon from '../components/Icon.jsx'
import { useDebounce } from '../hooks/index.js'

const PER_PAGE = 25

const QUICK_FILTERS = [
  { id: 'all', label: 'Tutte' },
  { id: 'continue', label: 'In corso' },
  { id: 'unorg', label: 'Da organizzare' },
  { id: 'org', label: 'Organizzate' },
  { id: 'top', label: 'Top 4★+' },
]

export default function Scenes() {
  const [params] = useSearchParams()
  const tagFromUrl = params.get('tags')
  const filterFromUrl = params.get('filter')
  const [search, setSearch] = useState('')
  const q = useDebounce(search)
  const [sort, setSort] = useState(filterFromUrl === 'continue' ? 'last_played_at' : 'date')
  const [dir, setDir] = useState('DESC')
  const [quick, setQuick] = useState(filterFromUrl || 'all')
  const [tagFilter, setTagFilter] = useState(tagFromUrl || null)
  const [tags, setTags] = useState([])
  const [items, setItems] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [more, setMore] = useState(false)
  const [err, setErr] = useState(null)
  const [layout, setLayout] = useState(() => getPlayback().sceneLayout || 'cards')
  const [autoPreview] = useState(() => getPlayback().autoPreview || false)

  useEffect(() => {
    gql(Q_TAGS).then((r) => setTags(r.findTags.tags)).catch(() => {})
  }, [])

  const fetchPage = useCallback(async (p) => {
    if (p === 1) setLoading(true)
    setMore(true)
    try {
      const r = await gql(Q_SCENES, {
        page: p,
        per: PER_PAGE,
        q: q || null,
        sort,
        dir,
        tags: tagFilter ? { value: [tagFilter], modifier: 'INCLUDES' } : null,
        organized: quick === 'org' ? true : quick === 'unorg' ? false : null,
        rating100: quick === 'top' ? { value: 79, modifier: 'GREATER_THAN' } : null,
        resume_time: quick === 'continue' ? { value: 3, modifier: 'GREATER_THAN' } : null,
      })
      setCount(r.findScenes.count)
      setItems((prev) => (p === 1 ? r.findScenes.scenes : [...prev, ...r.findScenes.scenes]))
      if (r.findScenes.scenes.length < PER_PAGE) setMore(false)
      setErr(null)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }, [q, sort, dir, tagFilter, quick])

  useEffect(() => {
    setPage(1)
    fetchPage(1)
  }, [fetchPage])

  useEffect(() => {
    if (page > 1) fetchPage(page)
  }, [page, fetchPage])

  const activeTag = tags.find((t) => t.id === tagFilter)

  const sentinelRef = useRef(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !more || loading || err) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect()
          setPage((p) => p + 1)
        }
      },
      { rootMargin: '600px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [more, loading, items.length, err])

  const toggleLayout = () => {
    const next = layout === 'cards' ? 'list' : 'cards'
    setLayout(next)
    setPlayback({ sceneLayout: next })
  }

  return (
    <PullToRefresh onRefresh={() => { setPage(1); return fetchPage(1) }}>
      <div className="page">
        <div className="page-head-row">
          <div>
            <h1 className="page-title">Scene</h1>
            <p className="page-sub" style={{ marginBottom: 0 }}>{loading && page === 1 ? 'Carico…' : `${count} scene${tagFilter ? ' nel tag' : ''}`}</p>
          </div>
          <button
            className="chip clickable"
            onClick={toggleLayout}
            aria-label="Cambia vista"
            title={layout === 'cards' ? 'Passa a lista compatta' : 'Passa a card grandi'}
          >
            <Icon name={layout === 'cards' ? 'list' : 'grid'} size={13} />
            {layout === 'cards' ? 'Lista' : 'Card'}
          </button>
        </div>

        <div className="search-row">
          <div className="search-wrap">
            <Icon name="search" size={16} />
            <input
              type="search"
              placeholder="Cerca scene…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <SortSelect value={sort} dir={dir} onChange={(v, d) => { setSort(v); setDir(d) }} />
        </div>

        <div className="filter-strip">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.id}
              className={'chip clickable' + (quick === f.id ? ' accent' : '')}
              onClick={() => setQuick(f.id)}
            >
              {f.label}
            </button>
          ))}
          {tagFilter && (
            <button className="chip accent clickable" onClick={() => setTagFilter(null)}>
              <Icon name="tag" size={12} /> {activeTag?.name || 'tag'} <Icon name="x" size={11} />
            </button>
          )}
        </div>

        {err && <div className="error-box">{err} <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => fetchPage(1)}>Riprova</button></div>}

        {loading && page === 1 ? (
          <div className="spinner" />
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="big">⌀</div>
            Nessuna scena trovata
          </div>
        ) : (
          <div className="scene-list">
            {items.map((s) => (
              <SceneCard
                key={s.id}
                scene={s}
                layout={layout}
                autoPreview={autoPreview}
                onClearResume={(id) => {
                  if (quick === 'continue') {
                    setItems((prev) => prev.filter((x) => x.id !== id))
                    setCount((c) => Math.max(0, c - 1))
                  } else {
                    setItems((prev) => prev.map((x) => x.id === id ? { ...x, resume_time: 0 } : x))
                  }
                }}
              />
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="grid-sentinel">
          {loading && page > 1 && <div className="spinner" style={{ margin: '14px auto' }} />}
        </div>
      </div>
    </PullToRefresh>
  )
}
