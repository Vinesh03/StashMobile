// Impostazioni di riproduzione dell'app (localStorage) + helpers.
// La web UI di Stash tiene questi settaggi lato client: stessa cosa qui.

export const DEFAULTS = {
  loopThreshold: 60,      // loop automatico per video più corti di X secondi (0 = mai)
  autoStart: false,       // autoplay all'apertura della scena
  resume: true,           // riprendi dal punto lasciato (resume_time server-side)
  trackPlays: true,       // registra i play sul server (sceneAddPlay + activity)
  progressSaveEvery: 5,   // salva il resume ogni X secondi
  defaultView: 'grid',    // immagini: griglia (riservato per future viste)
  linkMode: 'app',        // apertura link: 'app' | 'browser'
}

const KEY = 'stash.playback'

export function getPlayback() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return { ...DEFAULTS }
  }
}

export function setPlayback(patch) {
  const next = { ...getPlayback(), ...patch }
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}
