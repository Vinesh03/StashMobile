import { Link } from 'react-router-dom'
import { authedUrl } from '../services/stash.js'
import { useThumb } from '../hooks/index.js'
import { fmtHeight } from '../lib/format.js'
import Icon from './Icon.jsx'

export default function PerformerCard({ performer }) {
  const thumb = useThumb(authedUrl(performer.image_path), 128)
  const gender = performer.gender === 'MALE' ? 'M' : performer.gender === 'FEMALE' ? 'F' : performer.gender === 'INTERSEX' ? 'I' : ''
  const age = performer.birthdate
    ? Math.floor((Date.now() - new Date(performer.birthdate).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null

  return (
    <Link to={`/performers/${performer.id}`} className="perf-card card">
      <div className="perf-avatar">
        {thumb ? (
          <img src={thumb} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.querySelector('.perf-avatar-fallback')?.classList.add('show') }} />
        ) : (
          <div className="perf-avatar-fallback"><Icon name="user" size={24} /></div>
        )}
        {gender ? <span className="perf-gender">{gender}</span> : null}
      </div>
      <div className="perf-meta">
        <div className="perf-name-row">
          <div className="perf-name">{performer.name}</div>
          {performer.favorite && <span className="perf-fav"><Icon name="heartFill" size={13} /></span>}
        </div>
        {performer.disambiguation ? <div className="perf-disamb">{performer.disambiguation}</div> : null}
        <div className="perf-chips">
          {age !== null ? <span className="chip mono">{age} anni</span> : null}
          {performer.height_cm ? <span className="chip mono">{fmtHeight(performer.height_cm)}</span> : null}
          <span className="chip accent"><Icon name="film" size={11} /> {performer.scene_count ?? 0}</span>
          {(performer.image_count ?? 0) > 0 && <span className="chip"><Icon name="image" size={11} /> {performer.image_count}</span>}
        </div>
      </div>
    </Link>
  )
}
