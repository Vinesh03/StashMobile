import { useState, useRef } from 'react'
import { gql } from '../services/stash.js'
import Icon from './Icon.jsx'

// ---------- Primitives ----------

function Field({ label, value, onChange, multiline, placeholder }) {
  return (
    <div className="edit-field">
      <label className="edit-k">{label}</label>
      {multiline ? (
        <textarea
          className="edit-input"
          rows={4}
          value={value || ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="edit-input"
          value={value || ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}

// Selettore multiuso (tags/performers/studio): ricerca server + chip selezionate
function Picker({ kind, selected, onChange }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [res, setRes] = useState([])
  const [busy, setBusy] = useState(false)
  const timer = useRef(null)

  const label = kind === 'tags' ? 'Tag' : kind === 'performers' ? 'Performers' : 'Studio'
  const single = kind === 'studio'

  const search = async (text) => {
    setQ(text)
    clearTimeout(timer.current)
    if (!text.trim()) { setOpen(false); return }
    timer.current = setTimeout(async () => {
      setBusy(true)
      try {
        const query = kind === 'tags'
          ? `query($q: String!) { findTags(filter: {q: $q, per_page: 8}) { tags { id name } } }`
          : kind === 'performers'
            ? `query($q: String!) { findPerformers(filter: {q: $q, per_page: 8}) { performers { id name disambiguation } } }`
            : `query($q: String!) { findStudios(filter: {q: $q, per_page: 8}) { studios { id name } } }`
        const r = await gql(query, { q: text })
        setRes((kind === 'tags' ? r.findTags.tags : kind === 'performers' ? r.findPerformers.performers : r.findStudios.studios) || [])
        setOpen(true)
      } catch { /* ricerca fallita: nessun risultato */ }
      setBusy(false)
    }, 300)
  }

  const toggle = (item) => {
    if (single) {
      onChange(item.id ? item : null)
      setOpen(false)
      setQ('')
    } else {
      const has = selected.some((s) => s.id === item.id)
      onChange(has ? selected.filter((s) => s.id !== item.id) : [...selected, item])
    }
  }

  return (
    <div className="edit-field">
      <label className="edit-k">{label}{!single && selected.length > 0 && <span className="faint"> ({selected.length})</span>}</label>
      {!single && selected.length > 0 && (
        <div className="tag-cloud" style={{ marginBottom: 8 }}>
          {selected.map((s) => (
            <button key={s.id} className="chip removable" onClick={() => toggle(s)}>
              {s.name} <Icon name="x" size={11} />
            </button>
          ))}
        </div>
      )}
      {single && selected?.id && (
        <button className="chip removable" style={{ marginBottom: 8 }} onClick={() => onChange(null)}>
          {selected.name} <Icon name="x" size={11} />
        </button>
      )}
      <div className="picker-row">
        <input
          className="edit-input"
          value={q}
          placeholder={single ? 'Cerca studio…' : `Cerca ${label.toLowerCase()}…`}
          onChange={(e) => search(e.target.value)}
        />
      </div>
      {open && res.length > 0 && (
        <div className="picker-pop">
          {res.map((item) => {
            const has = single ? selected?.id === item.id : selected.some((s) => s.id === item.id)
            return (
              <button key={item.id} className="picker-opt" onClick={() => toggle(item)}>
                <span>{item.name}{item.disambiguation ? <span className="faint"> · {item.disambiguation}</span> : null}</span>
                <Icon name={has ? 'check' : 'plus'} size={14} />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Bottom sheet di modifica: campi per kind
// kind: 'scene' | 'image' | 'performer'
export default function EditSheet({ kind, data, onClose, onSaved }) {
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  // stato locale dei campi (dal dato corrente)
  const [f, setF] = useState(() => {
    if (kind === 'performer') {
      return {
        name: data.name || '', disambiguation: data.disambiguation || '',
        gender: data.gender || '', birthdate: data.birthdate || '',
        country: data.country || '', ethnicity: data.ethnicity || '',
        eye_color: data.eye_color || '', hair_color: data.hair_color || '',
        height_cm: data.height_cm || '', weight: data.weight || '',
        measurements: data.measurements || '', fake_tits: data.fake_tits || '',
        penis_length: data.penis_length || '', circumcised: data.circumcised || '',
        career_start: data.career_start || '', career_end: data.career_end || '',
        tattoos: data.tattoos || '', piercings: data.piercings || '',
        details: data.details || '', urls: (data.urls || []).join('\n'),
        alias_list: (data.alias_list || []).join(', '),
        tags: (data.tags || []).map((t) => ({ id: t.id, name: t.name })),
      }
    }
    return {
      title: data.title || '', code: data.code || '', date: data.date || '',
      details: data.details || '', director: data.director || '',
      urls: (data.urls || []).join('\n'),
      rating100: data.rating100 || 0,
      organized: data.organized || false,
      studio: data.studio ? { id: data.studio.id, name: data.studio.name } : null,
      performers: (data.performers || []).map((p) => ({ id: p.id, name: p.name, disambiguation: p.disambiguation })),
      tags: (data.tags || []).map((t) => ({ id: t.id, name: t.name })),
    }
  })

  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }))

  const save = async () => {
    setSaving(true)
    setErr(null)
    try {
      if (kind === 'performer') {
        const input = {
          id: data.id,
          name: f.name,
          disambiguation: f.disambiguation,
          ...(f.gender ? { gender: f.gender } : {}),
          birthdate: f.birthdate, country: f.country, ethnicity: f.ethnicity,
          eye_color: f.eye_color, hair_color: f.hair_color,
          height_cm: f.height_cm ? Number(f.height_cm) : null,
          weight: f.weight ? Number(f.weight) : null,
          measurements: f.measurements, fake_tits: f.fake_tits,
          penis_length: f.penis_length, circumcised: f.circumcised || null,
          career_start: f.career_start, career_end: f.career_end,
          tattoos: f.tattoos, piercings: f.piercings,
          details: f.details,
          urls: f.urls.split('\n').map((s) => s.trim()).filter(Boolean),
          alias_list: f.alias_list.split(',').map((s) => s.trim()).filter(Boolean),
          tag_ids: f.tags.map((t) => t.id),
        }
        await gql(`mutation($input: PerformerUpdateInput!) { performerUpdate(input: $input) { id } }`, { input })
      } else if (kind === 'scene') {
        const input = {
          id: data.id,
          title: f.title, code: f.code, date: f.date || null,
          details: f.details, director: f.director,
          urls: f.urls.split('\n').map((s) => s.trim()).filter(Boolean),
          organized: f.organized,
          studio_id: f.studio?.id || null,
          performer_ids: f.performers.map((p) => p.id),
          tag_ids: f.tags.map((t) => t.id),
        }
        await gql(`mutation($input: SceneUpdateInput!) { sceneUpdate(input: $input) { id } }`, { input })
      } else {
        const input = {
          id: data.id,
          title: f.title, code: f.code, date: f.date || null,
          details: f.details,
          urls: f.urls.split('\n').map((s) => s.trim()).filter(Boolean),
          organized: f.organized,
          studio_id: f.studio?.id || null,
          performer_ids: f.performers.map((p) => p.id),
          tag_ids: f.tags.map((t) => t.id),
        }
        await gql(`mutation($input: ImageUpdateInput!) { imageUpdate(input: $input) { id } }`, { input })
      }
      onSaved()
      onClose()
    } catch (e) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  const isPerf = kind === 'performer'

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <span className="sheet-title">Modifica {isPerf ? 'performer' : kind === 'scene' ? 'scena' : 'immagine'}</span>
          <button className="pc-mini" onClick={onClose} aria-label="Chiudi">
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="sheet-body">
          {!isPerf && (
            <>
              <Field label="Titolo" value={f.title} onChange={set('title')} />
              <div className="edit-grid">
                <Field label="Codice" value={f.code} onChange={set('code')} placeholder="Es. ABC-123" />
                <Field label="Data" value={f.date} onChange={set('date')} placeholder="YYYY-MM-DD" />
              </div>
              <Field label="Regista" value={f.director} onChange={set('director')} />
              <Field label="Dettagli" value={f.details} onChange={set('details')} multiline placeholder="Descrizione…" />
            </>
          )}

          {isPerf && (
            <>
              <div className="edit-grid">
                <Field label="Nome" value={f.name} onChange={set('name')} />
                <Field label="Disambiguazione" value={f.disambiguation} onChange={set('disambiguation')} placeholder="Es. D.Va" />
              </div>
              <div className="edit-grid">
                <div className="edit-field">
                  <label className="edit-k">Genere</label>
                  <select className="edit-input" value={f.gender} onChange={(e) => set('gender')(e.target.value)}>
                    <option value="">—</option>
                    <option value="MALE">Maschio</option>
                    <option value="FEMALE">Femmina</option>
                    <option value="TRANSGENDER_MALE">Uomo trans</option>
                    <option value="TRANSGENDER_FEMALE">Donna trans</option>
                    <option value="INTERSEX">Intersex</option>
                    <option value="NON_BINARY">Non-binary</option>
                  </select>
                </div>
                <Field label="Nascita" value={f.birthdate} onChange={set('birthdate')} placeholder="YYYY-MM-DD" />
              </div>
              <div className="edit-grid">
                <Field label="Paese" value={f.country} onChange={set('country')} />
                <Field label="Etnia" value={f.ethnicity} onChange={set('ethnicity')} />
              </div>
              <div className="edit-grid">
                <Field label="Occhi" value={f.eye_color} onChange={set('eye_color')} />
                <Field label="Capelli" value={f.hair_color} onChange={set('hair_color')} />
              </div>
              <div className="edit-grid edit-3">
                <Field label="Altezza cm" value={f.height_cm} onChange={set('height_cm')} />
                <Field label="Peso kg" value={f.weight} onChange={set('weight')} />
                <Field label="Misure" value={f.measurements} onChange={set('measurements')} placeholder="90-60-90" />
              </div>
              <div className="edit-grid">
                <Field label="Seni fatti" value={f.fake_tits} onChange={set('fake_tits')} />
                <Field label="Penis length" value={f.penis_length} onChange={set('penis_length')} placeholder="cm" />
              </div>
              <div className="edit-grid">
                <div className="edit-field">
                  <label className="edit-k">Circonciso</label>
                  <select className="edit-input" value={f.circumcised} onChange={(e) => set('circumcised')(e.target.value)}>
                    <option value="">—</option>
                    <option value="CUT">Sì</option>
                    <option value="UNCUT">No</option>
                  </select>
                </div>
                <Field label="Carriera inizio" value={f.career_start} onChange={set('career_start')} placeholder="YYYY o YYYY-MM-DD" />
              </div>
              <Field label="Carriera fine" value={f.career_end} onChange={set('career_end')} placeholder="YYYY o YYYY-MM-DD" />
              <Field label="Tatuaggi" value={f.tattoos} onChange={set('tattoos')} />
              <Field label="Piercing" value={f.piercings} onChange={set('piercings')} />
              <Field label="Alias (separati da virgola)" value={f.alias_list} onChange={set('alias_list')} />
              <Field label="Biografia" value={f.details} onChange={set('details')} multiline placeholder="Biografia…" />
            </>
          )}

          <Field label="URL (uno per riga)" value={f.urls} onChange={set('urls')} multiline placeholder="https://…" />

          <Picker kind="tags" selected={f.tags} onChange={set('tags')} />
          {!isPerf && <Picker kind="performers" selected={f.performers} onChange={set('performers')} />}
          {!isPerf && <Picker kind="studio" selected={f.studio} onChange={set('studio')} />}

          {kind !== 'image' && (
            <button className={'edit-org' + (f.organized ? ' on' : '')} onClick={() => set('organized')(!f.organized)}>
              <Icon name="check" size={15} /> {f.organized ? 'Organizzato' : 'Da organizzare'}
            </button>
          )}
        </div>

        {err && <div className="error-box" style={{ margin: '0 16px 10px' }}>{err}</div>}

        <div className="sheet-foot">
          <button className="btn ghost" onClick={onClose}>Annulla</button>
          <button className="btn" onClick={save} disabled={saving || (isPerf && !f.name.trim())}>
            {saving ? 'Salvo…' : 'Salva'}
          </button>
        </div>
      </div>
    </div>
  )
}
