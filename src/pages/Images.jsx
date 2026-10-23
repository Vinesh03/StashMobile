import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { gql, Q_IMAGES, Q_TAGS, authedUrl } from '../services/stash.js'
import SortSelect from '../components/SortSelect.jsx'
import Lightbox from '../components/Lightbox.jsx'
import PullToRefresh from '../components/PullToRefresh.jsx'
import Icon from '../components/Icon.jsx'
import { useDebounce } from '../hooks/index.js'

const PER_PAGE = 60

export default function Images() {
  const [params] = useSearchParams()
  const tagFromUrl = params.get('tags')
  const [search, setSearch] = useState('')
  const q = useDebounce(search)
  const [sort, setSort] = useState('created_at')
  const [dir, setDir] = useState('DESC')
  const [topOnly, setTopOnly] = useState(false)
  const [tagFilter, setTagFilter] = useState(tagFromUrl || null)
  const [tags, setTags] = useState([])
  const [items, setItems] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [more, setMore] = useState(false)
  const [err, setErr] = useState(null)
  const [lightboxIdx, setLightboxIdx] = useState(null)
  const sentinelRef = useRef(null)

  useEffect(() => {
    gql(Q_TAGS).then((r) => setTags(r.findTags.tags)).catch(() => {})
  }, [])

  const fetchPage = useCallback(async (p) => {
    if (p === 1) setLoading(true)
    setMore(true)
    try {
      const r = await gql(Q_IMAGES, {
        page: p,
        per: PER_PAGE,
        q: q || null,
        sort,
        dir,
        perf: null,
        tags: tagFilter ? { value: [tagFilter], modifier: 'INCLUDES' } : null,
        rating100: topOnly ? { value: 79, modifier: 'GREATER_THAN' } : null,
      })
      setCount(r.findImages.count)
      setItems((prev) => (p === 1 ? r.findImages.images : [...prev, ...r.findImages.images]))
      if (r.findImages.images.length < PER_PAGE) setMore(false)
      setErr(null)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }, [q, sort, dir, tagFilter, topOnly])

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

  const activeTag = tags.find((t) => t.id === tagFilter)

  return (
    <PullToRefresh onRefresh={() => { setPage(1); return fetchPage(1) }}>
      <div className="page">
        <h1 className="page-title">Immagini</h1>
        <p className="page-sub">{loading && page === 1 ? 'Carico…' : `${count} immagini`}</p>

        <div className="search-row">
          <div className="search-wrap">
            <Icon name="search" size={16} />
            <input type="search" placeholder="Cerca immagini…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <SortSelect value={sort} dir={dir} type="image" onChange={(v, d) => { setSort(v); setDir(d) }} />
        </div>

        <div className="filter-strip">
          <button className={'chip clickable' + (!topOnly ? ' accent' : '')} onClick={() => setTopOnly(false)}>Tutte</button>
          <button className={'chip clickable' + (topOnly ? ' accent' : '')} onClick={() => setTopOnly(true)}>Top 4★+</button>
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
          <div className="empty-state"><div className="big">⌀</div>Nessuna immagine</div>
        ) : (
          <div className="img-grid">
            {items.map((im, idx) => (
              <button key={im.id} className="img-tile clickable" onClick={() => setLightboxIdx(idx)}>
                <img
                  src={authedUrl(im.paths?.thumbnail || im.paths?.image)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  onError={(e) => { e.currentTarget.style.opacity = 0.25 }}
                />
              </button>
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="grid-sentinel">
          {loading && page > 1 && <div className="spinner" style={{ margin: '14px auto' }} />}
        </div>

        {lightboxIdx !== null && items[lightboxIdx] && (
          <Lightbox
            img={items[lightboxIdx]}
            onClose={() => setLightboxIdx(null)}
            onPrev={lightboxIdx > 0 ? () => setLightboxIdx((i) => i - 1) : null}
            onNext={lightboxIdx < items.length - 1 ? () => setLightboxIdx((i) => i + 1) : null}
          />
        )}
      </div>
    </PullToRefresh>
  )
}
