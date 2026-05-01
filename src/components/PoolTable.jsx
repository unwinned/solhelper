import { useState } from 'react'
import FilterDropdown from './FilterDropdown'

const TVL_PRESETS = [
  { label: '20k - 90k',  min: 20_000,    max: 90_000 },
  { label: '90k - 300k', min: 90_000,    max: 300_000 },
  { label: '300k - 1M',  min: 300_000,   max: 1_000_000 },
  { label: '> 1M',       min: 1_000_000, max: null },
]

const APR_PRESETS = [
  { label: '0% - 10%', min: 0,  max: 10 },
  { label: '10% - 40%', min: 10, max: 40 },
  { label: '> 40%',    min: 40, max: null },
]

const VOL_PRESETS = [
  { label: '0 - 20k',    min: 0,       max: 20_000 },
  { label: '20k - 90k',  min: 20_000,  max: 90_000 },
  { label: '90k - 300k', min: 90_000,  max: 300_000 },
  { label: '300k - 1M',  min: 300_000, max: 1_000_000 },
]

const formatCash = (n) => {
  const v = parseFloat(n) || 0
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`
  return `$${v.toFixed(2)}`
}

const getPoolUrl = (dex, address) => {
  if (dex === 'Raydium') return `https://raydium.io/clmm/create-position/?pool_id=${address}`
  if (dex === 'Orca') return `https://www.orca.so/pools/${address}`
  if (dex === 'Meteora') return `https://app.meteora.ag/dlmm/${address}?referrer=pools`
  if (dex === 'Kamino') return `https://app.kamino.finance/liquidity/${address}`
  return '#'
}

const aprColor = (apr) => apr < 0.05 ? 'var(--destructive)' : 'var(--solana-green)'

export default function PoolTable({ pools, sort, onSort, filters, onFilter }) {
  const [openFilter, setOpenFilter] = useState(null)

  const SortBtn = ({ column }) => (
    <button
      className={`sort-btn${sort.column === column ? ' active' : ''}`}
      onClick={() => onSort(column)}
    >
      {sort.column === column ? (sort.asc ? '↑' : '↓') : '↑↓'}
    </button>
  )

  const thClass = (col) => openFilter === col ? 'th-filter-open' : ''

  return (
    <table>
      <thead>
        <tr>
          <th className={thClass('dex')}>
            <div className="th-inner">
              <span className="th-label">DEX</span>
              <FilterDropdown
                type="dex"
                value={filters.dex}
                onChange={v => onFilter('dex', v)}
                onOpen={() => setOpenFilter('dex')}
                onClose={() => setOpenFilter(null)}
              />
            </div>
          </th>
          <th className={thClass('pair')}>
            <div className="th-inner">
              <span className="th-label">PAIR</span>
              <SortBtn column="pair" />
            </div>
          </th>
          <th className={thClass('tvl')}>
            <div className="th-inner">
              <span className="th-label">TVL</span>
              <FilterDropdown
                type="range" presets={TVL_PRESETS} unit="k" unitMultiplier={1000} customLabel="TVL RANGE"
                value={filters.tvl} onChange={v => onFilter('tvl', v)}
                onOpen={() => setOpenFilter('tvl')} onClose={() => setOpenFilter(null)}
              />
              <SortBtn column="tvl" />
            </div>
          </th>
          <th className={thClass('apr')}>
            <div className="th-inner">
              <span className="th-label">APR</span>
              <FilterDropdown
                type="range" presets={APR_PRESETS} unit="%" unitMultiplier={1} customLabel="APR RANGE"
                value={filters.apr} onChange={v => onFilter('apr', v)}
                onOpen={() => setOpenFilter('apr')} onClose={() => setOpenFilter(null)}
              />
              <SortBtn column="apr" />
            </div>
          </th>
          <th className={thClass('vol7d')}>
            <div className="th-inner">
              <span className="th-label">VOLUME</span>
              <FilterDropdown
                type="range" presets={VOL_PRESETS} unit="k" unitMultiplier={1000} customLabel="VOLUME RANGE"
                value={filters.vol7d} onChange={v => onFilter('vol7d', v)}
                onOpen={() => setOpenFilter('vol7d')} onClose={() => setOpenFilter(null)}
              />
              <SortBtn column="vol7d" />
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        {pools.map(pool => (
          <tr
            key={pool.address}
            className="pool-row"
            onClick={() => window.open(getPoolUrl(pool.dex, pool.address), '_blank')}
          >
            <td><span className={`dex-badge dex-${pool.dex}`}>{pool.dex}</span></td>
            <td>
              <div className="pair-cell">
                <strong>{pool.pair}</strong>
                <button
                  className="link-icon"
                  onClick={e => { e.stopPropagation(); window.open(getPoolUrl(pool.dex, pool.address), '_blank') }}
                  title="Open pool"
                >↗</button>
              </div>
            </td>
            <td>{formatCash(pool.tvl)}</td>
            <td style={{ color: aprColor(pool.apr ?? 0), fontWeight: 'bold' }}>{(pool.apr ?? 0).toFixed(1)}%</td>
            <td>{formatCash(pool.vol7d)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
