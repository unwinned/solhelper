import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Pools from './App'
import Lending from './pages/Lending'
import Strategies from './pages/Strategies'

export default function Navigator() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/pools" element={<Pools />} />
        <Route path="/lending" element={<Lending />} />
        <Route path="/strategies" element={<Strategies />} />
      </Routes>
    </BrowserRouter>
  )
}
