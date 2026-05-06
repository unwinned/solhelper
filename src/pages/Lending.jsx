import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import SearchBar from '../components/SearchBar'
import LendingTable from '../components/LendingTable'
import Footer from '../components/Footer'
import '../App.css'

export default function Lending() {
  const navigate = useNavigate()
  const [lendMarkets, setLendMarkets] = useState([])
  const [borrowMarkets, setBorrowMarkets] = useState([])
  const [tab, setTab] = useState('lend')
  const [searchTerm, setSearchTerm] = useState('')
  const [sort, setSort] = useState({ column: 'tvl', asc: false })
  const [lastUpdated, setLastUpdated] = useState('--:--:--')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [filterProtocol, setFilterProtocol] = useState([])

  const loadMarkets = useCallback(async () => {
    try {
      const response = await fetch('/api/lending')
      const result = await response.json()
      setLendMarkets(result.lend || [])
      setBorrowMarkets(result.borrow || [])
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
    loadMarkets()
    const interval = setInterval(loadMarkets, 300000)
    return () => clearInterval(interval)
  }, [loadMarkets])

  const handleSort = (column) => {
    setSort(prev => ({
      column,
      asc: prev.column === column ? !prev.asc : column === 'asset' || column === 'protocol',
    }))
  }

  const activeMarkets = tab === 'lend' ? lendMarkets : borrowMarkets

  const displayed = [...activeMarkets]
    .filter(m => {
      if (searchTerm) {
        const t = searchTerm.toLowerCase()
        if (!m.asset.toLowerCase().includes(t) && !m.protocol.toLowerCase().includes(t)) return false
      }
      if (filterProtocol.length > 0 && !filterProtocol.includes(m.protocol)) return false
      return true
    })
    .sort((a, b) => {
      const va = a[sort.column]
      const vb = b[sort.column]
      if (typeof va === 'string') return sort.asc ? va.localeCompare(vb) : vb.localeCompare(va)
      return sort.asc ? va - vb : vb - va
    })

  return (
    <>
      <div className="container">
        <TopBar />
        <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          lastUpdated={lastUpdated}
          error={error}
          placeholder="Search by asset or protocol (e.g. SOL or Kamino)..."
        />
        <div className="lending-tabs">
          <button
            className={`lending-tab${tab === 'lend' ? ' active' : ''}`}
            onClick={() => { setTab('lend'); setSort({ column: 'tvl', asc: false }); setFilterProtocol([]) }}
          >
            Lend
          </button>
          <button className="lending-tab lending-tab-soon" disabled>
            Borrow — coming soon
          </button>
        </div>
        {loading
          ? <div className="status">Connecting to Solana...</div>
          : <>
              <LendingTable
                markets={displayed}
                sort={sort}
                onSort={handleSort}
                filterProtocol={filterProtocol}
                onFilterProtocol={setFilterProtocol}
                mode={tab}
              />
              <Footer />
            </>
        }
      </div>
    </>
  )
}
