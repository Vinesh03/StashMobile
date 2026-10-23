export default function Icon({ name, size = 18, ...props }) {
  const paths = {
    search: <path d="M11 4a7 7 0 1 0 4.9 12l4 4 1.4-1.4-4-4A7 7 0 0 0 11 4Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z" fill="currentColor" stroke="none" />,
    play: <path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none" />,
    star: <path d="M12 3.5 14.7 9l5.8.8-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.8 9.3 9z" fill="currentColor" stroke="none" />,
    starOutline: <path d="M12 3.5 14.7 9l5.8.8-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.8 9.3 9z" />,
    clock: <g><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v5l3.5 2" /></g>,
    tag: <g><path d="M3.5 11V4.5H10l10.5 10.5-6.5 6.5z" /><circle cx="7" cy="8" r="1.3" /></g>,
    user: <g><circle cx="12" cy="8" r="3.4" /><path d="M5 20c.6-4 3.2-6 7-6s6.4 2 7 6" /></g>,
    calendar: <g><rect x="4" y="5.5" width="16" height="15" rx="2" /><path d="M8 3.5v4M16 3.5v4M4 10.5h16" /></g>,
    film: <g><rect x="3" y="4" width="18" height="16" rx="2.5" /><path d="M3 9h18M7.5 4v16M16.5 4v16M3 15h18" /></g>,
    image: <g><rect x="3" y="4.5" width="18" height="15" rx="2.5" /><circle cx="8.5" cy="10" r="1.6" /><path d="m4 17 5-4.5 3.5 2.8L17 11l3 3" /></g>,
    heart: <path d="M12 20.5S4 15.5 4 9.8C4 7 6.2 5 8.7 5c1.4 0 2.6.7 3.3 1.7C12.7 5.7 14 5 15.3 5 17.8 5 20 7 20 9.8c0 5.7-8 10.7-8 10.7Z" />,
    heartFill: <path d="M12 20.5S4 15.5 4 9.8C4 7 6.2 5 8.7 5c1.4 0 2.6.7 3.3 1.7C12.7 5.7 14 5 15.3 5 17.8 5 20 7 20 9.8c0 5.7-8 10.7-8 10.7Z" fill="currentColor" stroke="none" />,
    eye: <g><path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.8" /></g>,
    grid: <g><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></g>,
    list: <g><path d="M8 6h12M8 12h12M8 18h12" /><circle cx="4.5" cy="6" r="1" fill="currentColor" /><circle cx="4.5" cy="12" r="1" fill="currentColor" /><circle cx="4.5" cy="18" r="1" fill="currentColor" /></g>,
    flame: <path d="M12 3c1.5 3.5 4.5 5 4.5 9a4.5 4.5 0 0 1-9 0c0-2.5 1.5-4.5 2.5-6 0 2 1.5 2.5 2 0Z" />,
    camera: <g><path d="M4 8h3l1.5-2h7L17 8h3a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 19H4a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 4 8Z" /><circle cx="12" cy="13" r="3.2" /></g>,
    shuffle: <g><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></g>,
    repeat: <g><path d="M17 2l4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></g>,
    check: <path d="m4.5 12.5 5 5 10-11" />,
    x: <path d="M6 6l12 12M18 6 6 18" />,
    sort: <path d="M7 5v14M7 19l-3-3M7 19l3-3M17 19V5M17 5l-3 3M17 5l3 3" />,
    chevron: <path d="m9 5 7 7-7 7" />,
    external: <g><path d="M14 4h6v6" /><path d="M20 4 11 13" /><path d="M19 13.5V19a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4 19V7a1.5 1.5 0 0 1 1.5-1.5H10" /></g>,
    server: <g><rect x="3" y="4" width="18" height="7" rx="1.5" /><rect x="3" y="13" width="18" height="7" rx="1.5" /><path d="M7 7.5h.01M7 16.5h.01" /></g>,
    key: <g><circle cx="8" cy="14" r="3.5" /><path d="m10.5 11.5 8-8M15.5 7l3 3M18 4.5l3 3" /></g>,
    info: <g><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 7.8h.01" /></g>,
    marker: <path d="M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21Z" />,
    refresh: <g><path d="M20 5v5h-5" /><path d="M4 12a8 8 0 0 1 13.7-5.7L20 10" /><path d="M4 19v-5h5" /><path d="M20 12a8 8 0 0 1-13.7 5.7L4 14" /></g>,
    trash: <g><path d="M4 7h16" /><path d="M9.5 7V4.5h5V7" /><path d="M6.5 7l1 12.5h9l1-12.5" /><path d="M10 11v5M14 11v5" /></g>,
    pause: <g fill="currentColor" stroke="none"><rect x="7" y="5.5" width="3.6" height="13" rx="1" /><rect x="13.4" y="5.5" width="3.6" height="13" rx="1" /></g>,
    skipBack: <g><path d="M19 5.5v13l-9-6.5z" fill="currentColor" stroke="none" /><path d="M6 5.5v13" /></g>,
    skipFwd: <g><path d="M5 5.5v13l9-6.5z" fill="currentColor" stroke="none" /><path d="M18 5.5v13" /></g>,
    fullscreen: <g><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" /></g>,
    volume: <g><path d="M4 9.5v6h3.5L13 20V4L7.5 9.5z" /><path d="M16.5 8.5a5 5 0 0 1 0 7" /></g>,
    gear: <g><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.14-1.4l2-1.55-1.9-3.3-2.35.8a7 7 0 0 0-2.42-1.4L13.8 2.7h-3.6l-.39 2.45a7 7 0 0 0-2.42 1.4l-2.35-.8-1.9 3.3 2 1.55A7 7 0 0 0 5 12c0 .48.05.94.14 1.4l-2 1.55 1.9 3.3 2.35-.8a7 7 0 0 0 2.42 1.4l.39 2.45h3.6l.39-2.45a7 7 0 0 0 2.42-1.4l2.35.8 1.9-3.3-2-1.55c.09-.46.14-.92.14-1.4Z" /></g>,
    pencil: <g><path d="M4 20l4-1 11-11-3-3L5 16z" /><path d="M13.5 6.5l3 3" /></g>,
    plus: <path d="M12 5v14M5 12h14" />,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      {paths[name] || paths.info}
    </svg>
  )
}
