import { useState } from 'react'
import Icon from './Icon.jsx'

// Stelle rating (0-100): condivise tra dettagli ed editor
export default function Stars({ value, onChange, size = 22 }) {
  const [hover, setHover] = useState(null)
  const shown = (hover ?? value) / 20
  return (
    <div className="stars" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          aria-label={`${n} stelle`}
          onMouseEnter={() => setHover(n * 20)}
          onClick={() => onChange(Math.abs(value - n * 20) < 10 ? 0 : n * 20)}
        >
          <Icon name={n <= Math.round(shown) ? 'star' : 'starOutline'} size={size} />
        </button>
      ))}
    </div>
  )
}
