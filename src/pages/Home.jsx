import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { gql, Q_STATS, Q_SCENES, Q_PERFORMERS, authedUrl, getServer } from '../services/stash.js'
import { getPlayback } from '../services/playback.js'
import { useThumb } from '../hooks/index.js'
import SceneCard from '../components/SceneCard.jsx'
import PullToRefresh from '../components/PullToRefresh.jsx'
import Icon from '../components/Icon.jsx'

function PerfStripAvatar({ url, fav }) {
  const thumb = useThumb(url, 128)
  return (
    <div className="perf-strip-avatar">
      {thumb ? <img src={thumb} alt="" loading="lazy" /> : <Icon name="user" size={20} />}
      {fav && <span className="perf-strip-fav"><Icon name="heartFill" size={10} /></span>}
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [continuing, setContinuing] = useState([])
  const [recent, setRecent] = useState([])
  const [randomScenes, setRandomScenes] = useState([])
  const [topPerf, setTopPerf] = useState([])
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(true)
  const server = getServer()
  const pb = getPlayback()

  const load = useCallback(async () => {
    if (!getServer().configured) {
      setLoading(false)
      return
    }
    setLoading(true)
    setErr(null)
    try {
      const [s, cont, sc, rnd, pf] = await Promise.all([
        gql(Q_STATS),
        gql(Q_SCENES, {
          page: 1,
          per: 4,
          sort: 'last_played_at',
          dir: 'DESC',
          resume_time: { value: 3, modifier: 'GREATER_THAN' },
        }).catch(() => ({ findScenes: { scenes: [] } })),
        gql(Q_SCENES, { page: 1, per: 6, sort: 'date', dir: 'DESC' }),
        gql(Q_SCENES, { page: 1, per: 3, sort: 'random', dir: 'DESC' }).catch(() => ({ findScenes: { scenes: [] } })),
        gql(Q_PERFORMERS, { page: 1, per: 14, sort: 'scenes_count', dir: 'DESC' }),
      ])
      setStats(s.stats)
      setContinuing(cont.findScenes.scenes || [])
      setRecent(sc.findScenes.scenes || [])
      setRandomScenes(rnd.findScenes.scenes || [])
      setTopPerf(pf.findPerformers.performers || [])
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const shuffleRandom = async () => {
    try {
      const rnd = await gql(Q_SCENES, { page: 1, per: 3, sort: 'random', dir: 'DESC' })
      setRandomScenes(rnd.findScenes.scenes || [])
    } catch { /* ignore */ }
  }

  if (!server.configured) {
    return (
      <div className="page">
        <div className="home-head">
          <div>
            <h1 className="page-title">StashMobile</h1>
            <p className="page-sub" style={{ marginBottom: 0 }}>Il tuo Stash, in tasca</p>
          </div>
        </div>
        <div className="setup-banner card">
          <div className="task-ico"><Icon name="server" size={18} /></div>
          <div className="setup-body">
            <div className="set-name">Collega il tuo server Stash</div>
            <div className="set-hint">Inserisci l'URL del server sulla tua rete locale e l'API Key per iniziare.</div>
            <button className="btn" style={{ marginTop: 12 }} onClick={() => navigate('/settings')}>
              Configura ora
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <PullToRefresh onRefresh={load}>
      <div className="page">
        <div className="home-head">
          <div>
            <h1 className="page-title">StashMobile</h1>
            <p className="page-sub" style={{ marginBottom: 0 }}>Tira giù per aggiornare · {server.base.replace(/^https?:\/\//, '')}</p>
          </div>
          <div className="home-actions">
            <span className={'chip ' + (err ? '' : loading ? '' : 'accent')}>
              <span className="dot" /> {err ? 'offline' : loading ? 'aggiorno…' : 'online'}
            </span>
          </div>
        </div>

        {err && (
          <div className="error-box">
            Server non raggiungibile: {err}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn ghost" onClick={load}>Riprova</button>
              <button className="btn ghost" onClick={() => navigate('/settings')}>Impostazioni</button>
            </div>
          </div>
        )}

        {stats && (
          <div className="stats-bento">
            <Link to="/scenes" className="stat-tile big card">
              <Icon name="film" size={20} />
              <div className="stat-num mono">{stats.scene_count}</div>
              <div className="stat-label">Scene</div>
            </Link>
            <Link to="/images" className="stat-tile card">
              <Icon name="image" size={20} />
              <div className="stat-num mono">{stats.image_count}</div>
              <div className="stat-label">Immagini</div>
            </Link>
            <Link to="/performers" className="stat-tile card">
              <Icon name="user" size={20} />
              <div className="stat-num mono">{stats.performer_count}</div>
              <div className="stat-label">Performers</div>
            </Link>
            <Link to="/tags" className="stat-tile card">
              <Icon name="tag" size={20} />
              <div className="stat-num mono">{stats.tag_count}</div>
              <div className="stat-label">Tag</div>
            </Link>
          </div>
        )}

        {continuing.length > 0 && (
          <section className="home-section">
            <div className="section-head">
              <h2 className="section-title">Continua a guardare</h2>
              <Link to="/scenes?filter=continue" className="section-link">Tutte <Icon name="chevron" size={13} /></Link>
            </div>
            <div className="scene-list">
              {continuing.map((s) => (
                <SceneCard
                  key={s.id}
                  scene={s}
                  layout={pb.sceneLayout}
                  autoPreview={pb.autoPreview}
                  onClearResume={(id) => { setContinuing((prev) => prev.filter((x) => x.id !== id)); setRecent((prev) => prev.map((x) => x.id === id ? { ...x, resume_time: 0 } : x)); setRandomScenes((prev) => prev.map((x) => x.id === id ? { ...x, resume_time: 0 } : x)) }}
                />
              ))}
            </div>
          </section>
        )}

        {topPerf.length > 0 && (
          <section className="home-section">
            <div className="section-head">
              <h2 className="section-title">Performers</h2>
              <Link to="/performers" className="section-link">Tutti <Icon name="chevron" size={13} /></Link>
            </div>
            <div className="perf-strip">
              {topPerf.map((p) => (
                <Link to={`/performers/${p.id}`} key={p.id} className="perf-strip-item">
                  <PerfStripAvatar url={authedUrl(p.image_path)} fav={p.favorite} />
                  <span className="perf-strip-name">{p.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {recent.length > 0 && (
          <section className="home-section">
            <div className="section-head">
              <h2 className="section-title">Aggiunte di recente</h2>
              <Link to="/scenes" className="section-link">Tutte <Icon name="chevron" size={13} /></Link>
            </div>
            <div className="scene-list">
              {recent.map((s) => (
                <SceneCard key={s.id} scene={s} layout={pb.sceneLayout} autoPreview={pb.autoPreview} />
              ))}
            </div>
          </section>
        )}

        {randomScenes.length > 0 && (
          <section className="home-section">
            <div className="section-head">
              <h2 className="section-title">Scopri dalla libreria</h2>
              <button className="section-link" onClick={shuffleRandom}>
                <Icon name="shuffle" size={13} /> Mescola
              </button>
            </div>
            <div className="scene-list">
              {randomScenes.map((s) => (
                <SceneCard key={s.id} scene={s} layout="list" />
              ))}
            </div>
          </section>
        )}
      </div>
    </PullToRefresh>
  )
}
