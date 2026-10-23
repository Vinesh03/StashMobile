import { useNavigate } from 'react-router-dom'

export default function TopBar({ title, children }) {
  const navigate = useNavigate()
  return (
    <div className="topbar">
      <button className="topbar-back" onClick={() => navigate(-1)} aria-label="Indietro">
        <svg width="20" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 5l-7 7 7 7" />
        </svg>
        <span>Indietro</span>
      </button>
      <div className="topbar-title">{title}</div>
      {children && <div className="topbar-actions">{children}</div>}
    </div>
  )
}
