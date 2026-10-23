import { useState, useEffect, useRef } from 'react'
import Icon from './Icon.jsx'

const SCENE_SORTS = [
  { v: 'date', label: 'Data' },
  { v: 'created_at', label: 'Aggiunte' },
  { v: 'last_played_at', label: 'Recenti' },
  { v: 'title', label: 'Titolo' },
  { v: 'rating', label: 'Rating' },
  { v: 'o_counter', label: 'Contatore O' },
  { v: 'duration', label: 'Durata' },
  { v: 'random', label: 'Casuale' },
]

const PERFORMER_SORTS = [
  { v: 'scenes_count', label: 'Scene' },
  { v: 'name', label: 'Nome' },
  { v: 'rating', label: 'Rating' },
  { v: 'o_counter', label: 'Contatore O' },
  { v: 'height', label: 'Altezza' },
  { v: 'weight', label: 'Peso' },
  { v: 'random', label: 'Casuale' },
]

const IMAGE_SORTS = [
  { v: 'created_at', label: 'Aggiunte' },
  { v: 'date', label: 'Data' },
  { v: 'title', label: 'Titolo' },
  { v: 'rating', label: 'Rating' },
  { v: 'o_counter', label: 'Contatore O' },
  { v: 'random', label: 'Casuale' },
]

export default function SortSelect({ value, dir, onChange, type = 'scene' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const SORTS = type === 'performer' ? PERFORMER_SORTS : type === 'image' ? IMAGE_SORTS : SCENE_SORTS

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  const current = SORTS.find((s) => s.v === value) || SORTS[0]

  return (
    <div className="sort-select" ref={ref}>
      <button className="chip clickable" onClick={() => setOpen(!open)}>
        <Icon name="sort" size={12} />
        {current.label}
        <span className="sort-dir">{dir === 'ASC' ? '↑' : '↓'}</span>
      </button>
      {open && (
        <div className="sort-menu card">
          {SORTS.map((s) => (
            <button
              key={s.v}
              className={'sort-item' + (s.v === value ? ' on' : '')}
              onClick={() => {
                onChange(s.v, dir)
                setOpen(false)
              }}
            >
              {s.label}
              {s.v === value && <Icon name="check" size={13} />}
            </button>
          ))}
          <div className="sort-sep" />
          <button
            className="sort-item"
            onClick={() => {
              onChange(value, dir === 'ASC' ? 'DESC' : 'ASC')
              setOpen(false)
            }}
          >
            Inverti ordine {dir === 'ASC' ? '↑→↓' : '↓→↑'}
          </button>
        </div>
      )}
    </div>
  )
}
