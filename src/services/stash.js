import { CapacitorHttp } from '@capacitor/core'

let BASE = (typeof localStorage !== 'undefined' && (localStorage.getItem('stash.server') || '').replace(/\/+$/, '')) || ''
let APIKEY = (typeof localStorage !== 'undefined' && localStorage.getItem('stash.apikey')) || ''

export function setServer(base, apikey) {
  BASE = (base || '').trim().replace(/\/+$/, '')
  APIKEY = (apikey || '').trim()
}

export function getServer() {
  return { base: BASE, apikey: APIKEY, configured: Boolean(BASE) }
}

export function authedUrl(url) {
  if (!url) return url
  let full = url
  if (full.startsWith('/') && BASE) full = BASE + full
  if (!APIKEY) return full
  if (full.includes('apikey=')) return full
  return full + (full.includes('?') ? '&' : '?') + 'apikey=' + encodeURIComponent(APIKEY)
}

const TIMEOUT_MS = 8000

async function _post(query, variables) {
  if (!BASE) throw new Error('Configura il server Stash nelle Impostazioni')
  const payload = JSON.stringify({ query, variables: variables || {} })
  if (window.Capacitor?.isNativePlatform?.()) {
    try {
      const res = await CapacitorHttp.post({
        url: `${BASE}/graphql`,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(APIKEY ? { apikey: APIKEY } : {}) },
        data: payload,
        connectTimeout: TIMEOUT_MS,
        readTimeout: TIMEOUT_MS * 4,
      })
      if (res.status >= 400) throw new Error(`Stash API ${res.status}`)
      const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
      if (data.errors?.length) throw new Error(data.errors[0].message)
      return data.data
    } catch (e) {
      if (String(e.message || e).includes('timeout') || String(e.message || e).includes('Timeout'))
        throw new Error('Timeout: il server non risponde')
      throw e
    }
  }
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${BASE}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(APIKEY ? { apikey: APIKEY } : {}) },
      body: payload,
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`Stash API ${res.status}`)
    const json = await res.json()
    if (json.errors?.length) throw new Error(json.errors[0].message)
    return json.data
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Timeout: il server non risponde (8s)')
    if (e instanceof TypeError) throw new Error('Server non raggiungibile (rete)')
    throw e
  } finally {
    clearTimeout(t)
  }
}

export async function gql(query, variables) {
  return _post(query, variables)
}

export const Q_STATS = `{ stats { scene_count image_count gallery_count performer_count tag_count studio_count } }`

export const Q_SCENES = `
query(
  $page: Int,
  $per: Int,
  $q: String,
  $sort: String,
  $dir: SortDirectionEnum,
  $perf: MultiCriterionInput,
  $tags: HierarchicalMultiCriterionInput,
  $studios: HierarchicalMultiCriterionInput,
  $organized: Boolean,
  $rating100: IntCriterionInput,
  $resume_time: IntCriterionInput
) {
  findScenes(
    filter: { q: $q, page: $page, per_page: $per, sort: $sort, direction: $dir }
    scene_filter: {
      performers: $perf,
      tags: $tags,
      studios: $studios,
      organized: $organized,
      rating100: $rating100,
      resume_time: $resume_time
    }
  ) {
    count
    scenes {
      id title date rating100 organized o_counter resume_time play_count last_played_at
      paths { screenshot preview stream webp }
      files { path duration width height video_codec size }
      performers { id name gender disambiguation image_path }
      tags { id name }
      studio { id name }
      scene_markers { id title seconds }
    }
  }
}`

export const Q_SCENE = `
query($id: ID!) {
  findScene(id: $id) {
    id title code details director date rating100 organized o_counter resume_time play_count last_played_at
    paths { screenshot preview stream webp vtt sprite }
    files { path duration width height video_codec size bit_rate format }
    performers { id name gender disambiguation image_path details country eye_color hair_color height_cm weight measurements birthdate alias_list }
    tags { id name }
    studio { id name }
    galleries { id title image_count }
    scene_markers { id title seconds preview stream screenshot }
    urls
  }
}`

export const Q_PERFORMER = `
query($id: ID!) {
  findPerformer(id: $id) {
    id name gender disambiguation favorite rating100 image_path country birthdate
    career_start career_end eye_color hair_color ethnicity height_cm weight
    measurements fake_tits tattoos piercings details alias_list urls
    tags { id name }
    scene_count image_count o_counter
  }
}`

export const Q_PERFORMERS = `
query($page: Int, $per: Int, $q: String, $sort: String, $dir: SortDirectionEnum, $fav: Boolean, $gender: GenderCriterionInput) {
  findPerformers(
    filter: { q: $q, page: $page, per_page: $per, sort: $sort, direction: $dir }
    performer_filter: { filter_favorites: $fav, gender: $gender }
  ) {
    count
    performers {
      id name gender disambiguation favorite rating100 image_path country birthdate
      career_start career_end eye_color hair_color height_cm weight
      scene_count image_count
    }
  }
}`

export const Q_TAGS = `
query {
  findTags(filter: { per_page: -1, sort: "name" }) {
    tags { id name scene_count image_count favorite }
  }
}`

export const Q_IMAGE = `
query($id: ID!) {
  findImage(id: $id) {
    id title date rating100 o_counter organized
    paths { image thumbnail }
    files { path width height size }
    performers { id name image_path }
    tags { id name }
    studio { id name }
    urls
  }
}`

export const Q_IMAGES = `
query($page: Int, $per: Int, $q: String, $sort: String, $dir: SortDirectionEnum, $perf: MultiCriterionInput, $tags: HierarchicalMultiCriterionInput, $rating100: IntCriterionInput) {
  findImages(
    filter: { q: $q, page: $page, per_page: $per, sort: $sort, direction: $dir }
    image_filter: { performers: $perf, tags: $tags, rating100: $rating100 }
  ) {
    count
    images {
      id title date rating100 o_counter
      paths { image thumbnail }
      files { width height size }
      performers { id name image_path }
      tags { id name }
    }
  }
}`

export const Q_GALLERIES = `
query($page: Int, $per: Int) {
  findGalleries(filter: { page: $page, per_page: $per }) {
    count
    galleries { id title image_count folder { path } performers { id name } }
  }
}`

export const Q_STUDIOS = `
query {
  findStudios(filter: { per_page: -1, sort: "name" }) {
    studios { id name scene_count image_count }
  }
}`

export const M_SCENE_UPDATE = `
mutation SceneUpdate($input: SceneUpdateInput!) { sceneUpdate(input: $input) { id } }`

export const M_PERFORMER_UPDATE = `
mutation PerformerUpdate($input: PerformerUpdateInput!) { performerUpdate(input: $input) { id } }`

export const M_IMAGE_UPDATE = `
mutation ImageUpdate($input: ImageUpdateInput!) { imageUpdate(input: $input) { id } }`
