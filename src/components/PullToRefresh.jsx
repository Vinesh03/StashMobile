import { useState, useRef, useEffect } from 'react'
import Icon from './Icon.jsx'

const THRESHOLD = 62
const MAX_PULL = 110

export default function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const startX = useRef(0)
  const pulling = useRef(false)
  const pullRef = useRef(0)
  const wrapRef = useRef(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const onTouchStart = (e) => {
      if (refreshing || window.scrollY > 2) return
      if (e.target.closest('.perf-strip, .filter-strip, .sheet-overlay, .lightbox, .player')) return
      startY.current = e.touches[0].clientY
      startX.current = e.touches[0].clientX
      pulling.current = true
      pullRef.current = 0
    }

    const onTouchMove = (e) => {
      if (!pulling.current || refreshing) return
      if (window.scrollY > 2) {
        pulling.current = false
        pullRef.current = 0
        setPull(0)
        return
      }
      const dy = e.touches[0].clientY - startY.current
      const dx = Math.abs(e.touches[0].clientX - startX.current)
      if (dy <= 0 || (dx > dy && dy < 24)) {
        pullRef.current = 0
        setPull(0)
        return
      }
      const damped = Math.min(MAX_PULL, Math.pow(dy, 0.82) * 1.55)
      if (dy > 8 && e.cancelable) e.preventDefault()
      pullRef.current = damped
      setPull(damped)
    }

    const onTouchEnd = async () => {
      if (!pulling.current) return
      pulling.current = false
      const finalPull = pullRef.current
      pullRef.current = 0
      if (finalPull >= THRESHOLD && onRefresh) {
        setRefreshing(true)
        setPull(52)
        try {
          await onRefresh()
        } finally {
          setTimeout(() => {
            setRefreshing(false)
            setPull(0)
          }, 220)
        }
      } else {
        setPull(0)
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('touchcancel', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [refreshing, onRefresh])

  const ready = pull >= THRESHOLD

  return (
    <div ref={wrapRef} className="ptr-wrap">
      <div
        className={'ptr-indicator' + (refreshing ? ' is-refreshing' : '') + (ready ? ' is-ready' : '')}
        style={{
          height: pull > 0 ? `${pull}px` : '0px',
          opacity: Math.min(1, pull / (THRESHOLD * 0.85)),
        }}
        aria-hidden="true"
      >
        <div className="ptr-pill">
          <Icon
            name="refresh"
            size={15}
            style={{
              transform: refreshing ? undefined : `rotate(${Math.round(pull * 3.2)}deg)`,
            }}
          />
          <span>{refreshing ? 'Aggiorno…' : ready ? 'Rilascia per aggiornare' : 'Tira giù per aggiornare'}</span>
        </div>
      </div>
      {children}
    </div>
  )
}
