import { useState } from 'react'

const PROTOCOL_LIST = ['Kamino', 'Jupiter Lend']

const PROTOCOL_URLS = {
  'Kamino':       (addr) => addr ? `https://kamino.com/lend/${addr}/vault-overview` : 'https://kamino.com/lend',
  'Jupiter Lend': (_addr, asset) => `https://jup.ag/lend/earn/${asset}/deposit`,
}

const BORROW_URLS = {
  'Kamino':       (addr) => addr ? `https://kamino.com/borrow/reserve/${addr}` : 'https://kamino.com/borrow',
  'Jupiter Lend': (_addr, asset) => `https://jup.ag/lend/earn/${asset}/borrow`,
}

const formatCash = (n) => {
  const v = parseFloat(n) || 0
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`
  return `$${v.toFixed(2)}`
}

const apyColor = (apy) => {
  if (!apy || apy <= 0) return 'var(--muted-foreground)'
  if (apy < 1) return 'var(--muted-foreground)'
  if (apy < 5) return 'var(--solana-green)'
  return 'var(--orca-yellow)'
}

const borrowColor = (apy) => {
  if (!apy || apy <= 0) return 'var(--muted-foreground)'
  return 'var(--destructive)'
}

export default function LendingTable({ markets, sort, onSort, filterProtocol, onFilterProtocol, mode }) {
  const [filterOpen, setFilterOpen] = useState(false)

  const getUrl = (m) => {
    const map = mode === 'borrow' ? BORROW_URLS : PROTOCOL_URLS
    const fn = map[m.protocol]
    return fn ? fn(m.address, m.asset) : '#'
  }

  return (
    <table>
      <thead>
        <tr>
          <th>
            <div className="th-inner">
              <span className="th-label">PROTOCOL</span>
              <div className="filter-wrap">
                <button
                  className={`filter-btn${filterOpen ? ' active' : ''}`}
                  onClick={() => setFilterOpen(o => !o)}
                >{filterOpen ? '∧' : '∨'}</button>
                {filterOpen && (
                  <div className="filter-panel">
                    <div className="filter-label">OPTIONS</div>
                    {PROTOCOL_LIST.map(p => (
                      <label key={p} className="filter-option">
                        <input
                          type="checkbox"
                          checked={filterProtocol.includes(p)}
                          onChange={() => {
                            const next = filterProtocol.includes(p)
                              ? filterProtocol.filter(x => x !== p)
                              : [...filterProtocol, p]
                            onFilterProtocol(next)
                          }}
                        />
                        <span className={`protocol-badge protocol-${p.replace(' ', '')}`}>{p}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </th>
          <th>
            <div className="th-inner">
              <span className="th-label">ASSET</span>
              <button className={`sort-btn${sort.column === 'asset' ? ' active' : ''}`} onClick={() => onSort('asset')}>
                {sort.column === 'asset' ? (sort.asc ? '↑' : '↓') : '↑↓'}
              </button>
            </div>
          </th>
          {mode !== 'borrow' && (
            <th>
              <div className="th-inner">
                <span className="th-label">SUPPLY APY</span>
                <button className={`sort-btn${sort.column === 'supplyApy' ? ' active' : ''}`} onClick={() => onSort('supplyApy')}>
                  {sort.column === 'supplyApy' ? (sort.asc ? '↑' : '↓') : '↑↓'}
                </button>
              </div>
            </th>
          )}
          {mode !== 'lend' && (
            <th>
              <div className="th-inner">
                <span className="th-label">BORROW APY</span>
                <button className={`sort-btn${sort.column === 'borrowApy' ? ' active' : ''}`} onClick={() => onSort('borrowApy')}>
                  {sort.column === 'borrowApy' ? (sort.asc ? '↑' : '↓') : '↑↓'}
                </button>
              </div>
            </th>
          )}
          <th>
            <div className="th-inner">
              <span className="th-label">TVL</span>
              <button className={`sort-btn${sort.column === 'tvl' ? ' active' : ''}`} onClick={() => onSort('tvl')}>
                {sort.column === 'tvl' ? (sort.asc ? '↑' : '↓') : '↑↓'}
              </button>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        {markets.map((m, i) => (
          <tr
            key={`${m.protocol}-${m.asset}-${i}`}
            className="pool-row"
            onClick={() => window.open(getUrl(m), '_blank')}
          >
            <td><span className={`protocol-badge protocol-${m.protocol.replace(' ', '')}`}>{m.protocol}</span></td>
            <td>
              <div className="pair-cell">
                <strong>{m.asset}</strong>
                <button
                  className="link-icon"
                  onClick={e => { e.stopPropagation(); window.open(getUrl(m), '_blank') }}
                  title="Open market"
                >↗</button>
              </div>
            </td>
            {mode !== 'borrow' && (
              <td style={{ color: apyColor(m.supplyApy), fontWeight: 'bold' }}>
                {m.supplyApy > 0 ? `${(m.supplyApy).toFixed(2)}%` : '—'}
              </td>
            )}
            {mode !== 'lend' && (
              <td style={{ color: borrowColor(m.borrowApy), fontWeight: 'bold' }}>
                {m.borrowApy > 0 ? `${(m.borrowApy).toFixed(2)}%` : '—'}
              </td>
            )}
            <td>{formatCash(m.tvl)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
