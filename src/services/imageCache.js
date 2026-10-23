import { CapacitorHttp } from '@capacitor/core'

// Cache miniature client-side (IndexedDB): gli avatar/cover performer sono immagini
// full-res (1-4MB) servite da Stash a piena risoluzione per UI da 58px. Le scarico
// una volta, le riduco via canvas e le salvo: dalle sessioni successive zero download.
const DB_NAME = 'stashapp-imgcache'
const STORE = 'thumbs'
let dbPromise = null

function openDb() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

async function idbGet(key) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const r = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
}

async function idbSet(key, val) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(val, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

const mem = new Map()
const inflight = new Map()

async function fetchAndShrink(url, size) {
  let blob
  if (window.Capacitor?.isNativePlatform?.()) {
    const res = await CapacitorHttp.get({ url, responseType: 'arraybuffer' })
    const d = res.data
    if (typeof d === 'string') {
      const bin = atob(d)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      blob = new Blob([bytes])
    } else {
      blob = new Blob([d])
    }
  } else {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    blob = await res.blob()
  }
  const bmp = await createImageBitmap(blob)
  const scale = Math.min(1, size / Math.max(bmp.width, bmp.height))
  const w = Math.max(1, Math.round(bmp.width * scale))
  const h = Math.max(1, Math.round(bmp.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d').drawImage(bmp, 0, 0, w, h)
  bmp.close?.()
  return canvas.toDataURL('image/jpeg', 0.78)
}

// url: già pre-autenticato (authedUrl). La cache key usa solo il path (il token t= ruota ad ogni sessione).
export async function getThumb(url, size = 128) {
  if (!url) return null
  const key = `${size}|${url.split('?')[0]}`
  if (mem.has(key)) return mem.get(key)
  try {
    const cached = await idbGet(key)
    if (cached) {
      mem.set(key, cached)
      return cached
    }
  } catch { /* indexedDB non disponibile: fallback */ }
  if (inflight.has(key)) return inflight.get(key)
  const p = (async () => {
    try {
      const thumb = await fetchAndShrink(url, size)
      mem.set(key, thumb)
      idbSet(key, thumb).catch(() => {})
      return thumb
    } catch {
      return null
    } finally {
      inflight.delete(key)
    }
  })()
  inflight.set(key, p)
  return p
}
