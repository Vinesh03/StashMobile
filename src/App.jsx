import { useEffect } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { App as CapacitorApp } from '@capacitor/app'
import BottomTabBar from './components/BottomTabBar.jsx'
import TopBar from './components/TopBar.jsx'
import Home from './pages/Home.jsx'
import Scenes from './pages/Scenes.jsx'
import SceneDetail from './pages/SceneDetail.jsx'
import Performers from './pages/Performers.jsx'
import PerformerDetail from './pages/PerformerDetail.jsx'
import Images from './pages/Images.jsx'
import ImageDetail from './pages/ImageDetail.jsx'
import Tags from './pages/Tags.jsx'
import Settings from './pages/Settings.jsx'
import Tasks from './pages/Tasks.jsx'
import { useServerConfig } from './hooks/index.js'

const TAB_PATHS = ['/', '/scenes', '/performers', '/images', '/settings']

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  useServerConfig()

  // Back button nativo Android
  useEffect(() => {
    let listener
    const setup = async () => {
      listener = await CapacitorApp.addListener('backButton', () => {
        const path = window.location.pathname
        const atRoot = TAB_PATHS.includes(path) || path === ''
        if (!atRoot && window.history.length > 1) navigate(-1)
        else if (!atRoot) navigate('/')
        else CapacitorApp.exitApp()
      })
    }
    setup()
    return () => { if (listener) listener.remove() }
  }, [navigate])

  // Scroll to top su cambio rotta
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const isDetail = !TAB_PATHS.includes(location.pathname)
  void isDetail

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scenes" element={<Scenes />} />
        <Route path="/scenes/:id" element={<SceneDetail />} />
        <Route path="/performers" element={<Performers />} />
        <Route path="/performers/:id" element={<PerformerDetail />} />
        <Route path="/images" element={<Images />} />
        <Route path="/images/:id" element={<ImageDetail />} />
        <Route path="/tags" element={<Tags />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <BottomTabBar active={location.pathname} />
    </div>
  )
}
