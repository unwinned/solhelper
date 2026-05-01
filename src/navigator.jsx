import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Pools from './App'

export default function Navigator() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/pools" element={<Pools />} />
      </Routes>
    </BrowserRouter>
  )
}
