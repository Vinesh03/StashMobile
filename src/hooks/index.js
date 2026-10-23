import { useState, useEffect } from 'react'
import { setServer } from '../services/stash.js'

export function useServerConfig() {
  const [cfg, setCfg] = useState(() => ({
    base: (localStorage.getItem('stash.server') || '').replace(/\/+$/, ''),
    apikey: localStorage.getItem('stash.apikey') || '',
  }))

  useEffect(() => {
    setServer(cfg.base, cfg.apikey)
  }, [cfg])

  const save = (base, apikey) => {
    const cleanBase = (base || '').trim().replace(/\/+$/, '')
    const cleanKey = (apikey || '').trim()
    localStorage.setItem('stash.server', cleanBase)
    localStorage.setItem('stash.apikey', cleanKey)
    setServer(cleanBase, cleanKey)
    setCfg({ base: cleanBase, apikey: cleanKey })
  }

  return { ...cfg, save, needsSetup: !cfg.base }
}

export function useDebounce(value, ms = 350) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

function detect() {
  const ua = navigator.userAgent || ''
  const isTV = /\b(tv|smarttv|googletv|bravia|aft[a-z]|shield|chromecast)\b/i.test(ua)
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const width = window.innerWidth
  const deviceType = isTV ? 'tv' : width >= 1024 ? 'desktop' : width >= 768 ? 'tablet' : 'mobile'
  return { deviceType, isTV, isTouch, width }
}

export function useDeviceType() {
  const [d, setD] = useState(detect)
  useEffect(() => {
    const on = () => setD(detect())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return d
}

export function useThumb(url, size = 128) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    let live = true
    setSrc(null)
    if (!url) return
    import('../services/imageCache.js')
      .then(({ getThumb }) => getThumb(url, size))
      .then((t) => { if (live) setSrc(t || url) })
      .catch(() => { if (live) setSrc(url) })
    return () => { live = false }
  }, [url, size])
  return src
}
