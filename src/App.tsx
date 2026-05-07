import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import TestPage from './pages/TestPage'
import ResultPage from './pages/ResultPage'
import AdminPage from './pages/AdminPage'
import ShowPage from './pages/ShowPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/test" element={<TestPage />} />
      <Route path="/sonuc/:id" element={<ResultPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/show" element={<ShowPage />} />
    </Routes>
  )
}
