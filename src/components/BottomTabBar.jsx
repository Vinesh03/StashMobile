import { NavLink } from 'react-router-dom'

const I = {
  home: (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9.5 21v-6h5v6" />
    </svg>
  ),
  scenes: (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="m10 9.5 5 2.5-5 2.5z" />
    </svg>
  ),
  performers: (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.5-3.5 2.8-5.2 5.5-5.2s5 1.7 5.5 5.2" /><circle cx="17" cy="9" r="2.4" /><path d="M15.5 13.6c2.6.2 4.4 1.8 4.9 4.9" />
    </svg>
  ),
  images: (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" /><circle cx="8.5" cy="10" r="1.6" /><path d="m4 17 5-4.5 3.5 2.8L17 11l3 3" />
    </svg>
  ),
  tasks: (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" />
    </svg>
  ),
  settings: (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.14-1.4l2-1.55-1.9-3.3-2.35.8a7 7 0 0 0-2.42-1.4L13.8 2.7h-3.6l-.39 2.45a7 7 0 0 0-2.42 1.4l-2.35-.8-1.9 3.3 2 1.55A7 7 0 0 0 5 12c0 .48.05.94.14 1.4l-2 1.55 1.9 3.3 2.35-.8a7 7 0 0 0 2.42 1.4l.39 2.45h3.6l.39-2.45a7 7 0 0 0 2.42-1.4l2.35.8 1.9-3.3-2-1.55c.09-.46.14-.92.14-1.4Z" />
    </svg>
  ),
}

const TABS = [
  { to: '/', icon: 'home', label: 'Home' },
  { to: '/scenes', icon: 'scenes', label: 'Scene' },
  { to: '/performers', icon: 'performers', label: 'Performers' },
  { to: '/images', icon: 'images', label: 'Immagini' },
  { to: '/settings', icon: 'settings', label: 'Impostazioni' },
]

export default function BottomTabBar({ active }) {
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} className={() => 'tab' + (active === t.to ? ' on' : '')} end={t.to === '/'}>
          {I[t.icon]}
          <span>{t.label}</span>
        </NavLink>
        ))}
    </nav>
  )
}
