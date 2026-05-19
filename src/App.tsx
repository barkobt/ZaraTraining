import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import TestPage from './pages/TestPage'
import ResultPage from './pages/ResultPage'
import AdminPage from './pages/AdminPage'
import ShowPage from './pages/ShowPage'
import ShiftOrganizer from './pages/ShiftOrganizer'
import FittingRoom from './pages/FittingRoom'
import { ScrollToTop } from './components/ScrollToTop'

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/fitting-room" element={<FittingRoom />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="/sonuc/:id" element={<ResultPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/show" element={<ShowPage />} />
        <Route path="/shift-organizer" element={<ShiftOrganizer />} />
      </Routes>
    </>
  )
}
