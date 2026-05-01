import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from './components/TopBar'
import SearchBar from './components/SearchBar'
import PoolTable from './components/PoolTable'
import Footer from './components/Footer'
import './App.css'

const INIT_FILTERS = {
  dex: [],
  tvl: { min: null, max: null },
  apr: { min: null, max: null },
  vol7d: { min: null, max: null },
}

export default function App() {
  const navigate = useNavigate()
  const [pools, setPools] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sort, setSort] = useState({ column: 'tvl', asc: false })
  const [lastUpdated, setLastUpdated] = useState('--:--:--')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [filters, setFilters] = useState(INIT_FILTERS)

  const loadPools = useCallback(async () => {
    try {
      const response = await fetch('/api/pools')
      const result = await response.json()
      setPools(result.pools)
      setLastUpdated(new Date(result.lastUpdated).toLocaleTimeString())
      setLoading(false)
      setError(false)
    } catch (err) {
      console.error(err)
      setLastUpdated('ERROR')
      setError(true)
    }
  }, [])

  useEffect(() => {
    loadPools()
    const interval = setInterval(loadPools, 300000)
    return () => clearInterval(interval)
  }, [loadPools])

  const handleSort = (column) => {
    setSort(prev => ({
      column,
      asc: prev.column === column ? !prev.asc : column === 'pair' || column === 'dex'
    }))
  }

  const handleFilter = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const displayedPools = [...pools]
    .filter(pool => {
      if (searchTerm) {
        const t = searchTerm.toLowerCase()
        if (!pool.pair.toLowerCase().includes(t) && !pool.dex.toLowerCase().includes(t)) return false
      }
      if (filters.dex.length > 0 && !filters.dex.includes(pool.dex)) return false
      if (filters.tvl.min !== null && pool.tvl < filters.tvl.min) return false
      if (filters.tvl.max !== null && pool.tvl > filters.tvl.max) return false
      if (filters.apr.min !== null && pool.apr < filters.apr.min) return false
      if (filters.apr.max !== null && pool.apr > filters.apr.max) return false
      if (filters.vol7d.min !== null && pool.vol7d < filters.vol7d.min) return false
      if (filters.vol7d.max !== null && pool.vol7d > filters.vol7d.max) return false
      return true
    })
    .sort((a, b) => {
      const valA = a[sort.column]
      const valB = b[sort.column]
      if (typeof valA === 'string') return sort.asc ? valA.localeCompare(valB) : valB.localeCompare(valA)
      return sort.asc ? valA - valB : valB - valA
    })

  return (
    <div className="container">
      <TopBar />
      <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
      <SearchBar value={searchTerm} onChange={setSearchTerm} lastUpdated={lastUpdated} error={error} />
      {loading
        ? <div className="status">Connecting to Solana...</div>
        : <>
            <PoolTable
              pools={displayedPools}
              sort={sort}
              onSort={handleSort}
              filters={filters}
              onFilter={handleFilter}
            />
            <Footer />
          </>
      }
    </div>
  )
}
