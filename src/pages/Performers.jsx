import { useState, useEffect, useRef, useCallback } from 'react'
import { gql, Q_PERFORMERS } from '../services/stash.js'
import PerformerCard from '../components/PerformerCard.jsx'
import SortSelect from '../components/SortSelect.jsx'
import PullToRefresh from '../components/PullToRefresh.jsx'
import Icon from '../components/Icon.jsx'
import { useDebounce } from '../hooks/index.js'

const PER_PAGE = 25

const QUICK = [
  { id: 'all', label: 'Tutti' },
  { id: 'fav', label: 'Preferiti' },
  { id: 'F', label: 'Donne' },
  { id: 'M', label: 'Uomini' },
]

export default function Performers() {
  const [search, setSearch] = useState('')
  const q = useDebounce(search)
  const [sort, setSort] = useState('scenes_count')
  const [dir, setDir] = useState('DESC')
  const [quick, setQuick] = useState('all')
  const [items, setItems] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [more, setMore] = useState(false)
  const [err, setErr] = useState(null)
  const sentinelRef = useRef(null)

  const fetchPage = useCallback(async (p) => {
    if (p === 1) setLoading(true)
    setMore(true)
    try {
      const r = await gql(Q_PERFORMERS, {
        page: p,
        per: PER_PAGE,
        q: q || null,
        sort,
        dir,
        fav: quick === 'fav' ? true : null,
        gender: quick === 'F' ? { value: 'FEMALE', modifier: 'EQUALS' } : quick === 'M' ? { value: 'MALE', modifier: 'EQUALS' } : null,
      })
      setCount(r.findPerformers.count)
      setItems((prev) => (p === 1 ? r.findPerformers.performers : [...prev, ...r.findPerformers.performers]))
      if (r.findPerformers.performers.length < PER_PAGE) setMore(false)
      setErr(null)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }, [q, sort, dir, quick])

  useEffect(() => {
    setPage(1)
    fetchPage(1)
  }, [fetchPage])

  useEffect(() => {
    if (page > 1) fetchPage(page)
  }, [page, fetchPage])

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

  return (
    <PullToRefresh onRefresh={() => { setPage(1); return fetchPage(1) }}>
      <div className="page">
        <h1 className="page-title">Performers</h1>
        <p className="page-sub">{loading && page === 1 ? 'Carico…' : `${count} performers`}</p>

        <div className="search-row">
          <div className="search-wrap">
            <Icon name="search" size={16} />
            <input type="search" placeholder="Cerca performers…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <SortSelect value={sort} dir={dir} type="performer" onChange={(v, d) => { setSort(v); setDir(d) }} />
        </div>

        <div className="filter-strip">
          {QUICK.map((f) => (
            <button
              key={f.id}
              className={'chip clickable' + (quick === f.id ? ' accent' : '')}
              onClick={() => setQuick(f.id)}
            >
              {f.id === 'fav' && <Icon name="heartFill" size={11} />} {f.label}
            </button>
          ))}
        </div>

        {err && <div className="error-box">{err} <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => fetchPage(1)}>Riprova</button></div>}

        {loading && page === 1 ? (
          <div className="spinner" />
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="big">⌀</div>
            Nessun performer trovato
          </div>
        ) : (
          <div className="perf-list">
            {items.map((p) => <PerformerCard key={p.id} performer={p} />)}
          </div>
        )}

        <div ref={sentinelRef} className="grid-sentinel">
          {loading && page > 1 && <div className="spinner" style={{ margin: '14px auto' }} />}
        </div>
      </div>
    </PullToRefresh>
  )
}
