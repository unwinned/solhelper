import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import Footer from '../components/Footer'
import '../App.css'


const buildPoolUrl = (dex, address) => {
  if (!address) return null
  if (dex === 'Raydium') return `https://raydium.io/clmm/create-position/?pool_id=${address}`
  if (dex === 'Orca')    return `https://orca.so/pools/${address}`
  if (dex === 'Meteora') return `https://app.meteora.ag/dlmm/${address}?referrer=pools`
  if (dex === 'Kamino')  return `https://app.kamino.finance/liquidity/${address}`
  return null
}

const buildLendUrl = (protocol, address, asset) => {
  if (protocol === 'Kamino')       return address ? `https://kamino.com/lend/${address}/vault-overview` : 'https://kamino.com/lend'
  if (protocol === 'Jupiter Lend') return `https://jup.ag/lend/earn/${asset}/deposit`
  return null
}

const normPair = s => s.toUpperCase().replace(/[-\/\s]/g, '').replace(/WSOL/g, 'SOL')
const pairMatches = (poolPair, a, b) => {
  const pp = normPair(poolPair)
  return pp === `${a}${b}` || pp === `${b}${a}`
}


const LABEL_COLOR = {
  'Lend':       'var(--solana-cyan)',
  'Passive LP': 'var(--solana-green)',
  'Active LP':  'var(--orca-yellow)',
  'Strategy':   'var(--solana-purple)',
}


const ALLOCATIONS_BY_LEVEL = {
  'super-safe': [
    {
      id: 'k-usdc', pct: 45, label: 'Lend', type: 'lend', protocol: 'Kamino', asset: 'USDC',
      displayAsset: 'USDC', fallbackUrl: 'https://kamino.com/lend',
      desc: 'Supply USDC to Kamino\'s lending market. Battle-tested protocol with deep liquidity and consistent borrowing demand from leveraged traders.',
      risk: 'Stablecoin · No IL · Smart contract risk',
    },
    {
      id: 'k-usdt', pct: 30, label: 'Lend', type: 'lend', protocol: 'Kamino', asset: 'USDT',
      displayAsset: 'USDT', fallbackUrl: 'https://kamino.com/lend',
      desc: 'Supply USDT to Kamino. High utilisation from leveraged traders keeps lending rates competitive.',
      risk: 'Stablecoin · No IL · Smart contract risk',
    },
    {
      id: 'jup-usdc', pct: 25, label: 'Lend', type: 'lend', protocol: 'Jupiter Lend', asset: 'USDC',
      displayAsset: 'USDC', fallbackUrl: 'https://jup.ag/lend/earn/USDC/deposit',
      desc: 'Earn yield on USDC through Jupiter\'s lending product, backed by Jupiter\'s ecosystem and integrated liquidity.',
      risk: 'Stablecoin · No IL · Smart contract risk',
    },
  ],

  'safe': [
    {
      id: 'k-usdc', pct: 40, label: 'Lend', type: 'lend', protocol: 'Kamino', asset: 'USDC',
      displayAsset: 'USDC', fallbackUrl: 'https://kamino.com/lend',
      desc: 'Supply USDC to Kamino\'s lending market. Battle-tested protocol with deep liquidity and consistent borrowing demand.',
      risk: 'Stablecoin · No IL · Smart contract risk',
    },
    {
      id: 'jup-usdc', pct: 30, label: 'Lend', type: 'lend', protocol: 'Jupiter Lend', asset: 'USDC',
      displayAsset: 'USDC', fallbackUrl: 'https://jup.ag/lend/earn/USDC/deposit',
      desc: 'Earn yield on USDC through Jupiter\'s lending product, backed by Jupiter\'s ecosystem.',
      risk: 'Stablecoin · No IL · Smart contract risk',
    },
    {
      id: 'k-sol-usdc', pct: 15, label: 'Passive LP', type: 'pool', dex: 'Kamino', pairA: 'SOL', pairB: 'USDC',
      displayAsset: 'SOL / USDC', fallbackUrl: 'https://app.kamino.finance/liquidity',
      desc: 'Auto-managed liquidity vault on Kamino. Ranges rebalanced automatically — earn LP fees without manual intervention.',
      risk: 'Low IL · Rebalancing slippage · Smart contract risk',
    },
    {
      id: 'm-usdc-usdt', pct: 15, label: 'Passive LP', type: 'pool', dex: 'Meteora', pairA: 'USDC', pairB: 'USDT',
      displayAsset: 'USDC / USDT', fallbackUrl: 'https://app.meteora.ag/dlmm',
      desc: 'Stablecoin DLMM pool on Meteora. Near-zero impermanent loss, earns swap fees from high-frequency stablecoin trading.',
      risk: 'Near-zero IL · Dynamic fees · Smart contract risk',
    },
  ],

  'middle': [
    {
      id: 'k-usdc', pct: 40, label: 'Lend', type: 'lend', protocol: 'Kamino', asset: 'USDC',
      displayAsset: 'USDC', fallbackUrl: 'https://kamino.com/lend',
      desc: 'Supply USDC to Kamino\'s lending market. Battle-tested protocol with deep liquidity.',
      risk: 'Stablecoin · No IL · Smart contract risk',
    },
    {
      id: 'jup-usdc', pct: 20, label: 'Lend', type: 'lend', protocol: 'Jupiter Lend', asset: 'USDC',
      displayAsset: 'USDC', fallbackUrl: 'https://jup.ag/lend/earn/USDC/deposit',
      desc: 'Earn yield on USDC through Jupiter\'s lending product.',
      risk: 'Stablecoin · No IL · Smart contract risk',
    },
    {
      id: 'k-sol-usdc', pct: 15, label: 'Passive LP', type: 'pool', dex: 'Kamino', pairA: 'SOL', pairB: 'USDC',
      displayAsset: 'SOL / USDC', fallbackUrl: 'https://app.kamino.finance/liquidity',
      desc: 'Auto-managed liquidity vault on Kamino. Earn LP fees with automatic range rebalancing.',
      risk: 'Low IL · Rebalancing slippage · Smart contract risk',
    },
    {
      id: 'r-sol-usdc', pct: 15, label: 'Active LP', type: 'pool', dex: 'Raydium', pairA: 'SOL', pairB: 'USDC',
      displayAsset: 'SOL / USDC', fallbackUrl: 'https://raydium.io/clmm/pools/',
      desc: 'CLMM position on Raydium. The highest-volume SOL/USDC pool. Tighter range = higher APR, requires periodic rebalancing.',
      risk: 'IL risk · Active range management · Smart contract risk',
    },
    {
      id: 'jup-jupsol-loop', pct: 10, label: 'Strategy', type: 'static', protocol: 'Jupiter Lend',
      displayAsset: 'JupSOL Loop', fallbackUrl: 'https://jup.ag/lend/strategies',
      desc: 'Borrows SOL and loops into JupSOL to amplify yield. Jupiter\'s highest-APY automated strategy (~21% APY).',
      risk: 'Leveraged · Liquidation risk · Smart contract risk',
    },
  ],
}


const LEVELS = [
  {
    id: 'super-safe', name: 'Super Safe', icon: '◎', color: 'var(--solana-green)',
    desc: 'Lend stablecoins and blue-chip assets only. No impermanent loss, predictable yield.',
    tags: ['Lend only'],
  },
  {
    id: 'safe', name: 'Safe', icon: '◈', color: 'var(--solana-cyan)',
    desc: 'Lending plus passive, auto-managed liquidity positions with lower IL exposure.',
    tags: ['Lend', 'Passive LP'],
  },
  {
    id: 'middle', name: 'Middle', icon: '⬡', color: 'var(--orca-yellow)',
    desc: 'Lending, passive and active liquidity, plus a leveraged Jupiter yield strategy.',
    tags: ['Lend', 'Passive LP', 'Active LP', 'Strategy'],
  },
  {
    id: 'risky', name: 'Risky', icon: '◬', color: 'var(--destructive)',
    desc: 'High-yield leveraged strategies for experienced DeFi users.',
    tags: [], soon: true,
  },
]

const BADGE = {
  'Kamino':       { cls: 'protocol-badge protocol-Kamino',      label: 'Kamino' },
  'Jupiter Lend': { cls: 'protocol-badge protocol-JupiterLend', label: 'Jupiter Lend' },
  'Orca':         { cls: 'dex-badge dex-Orca',                  label: 'Orca' },
  'Raydium':      { cls: 'dex-badge dex-Raydium',               label: 'Raydium' },
  'Meteora':      { cls: 'dex-badge dex-Meteora',               label: 'Meteora' },
}


function resolvePoolUrls(pools, allocations) {
  const map = {}
  for (const item of allocations.filter(a => a.type === 'pool')) {
    const found = item.pairB === null
      ? pools.find(p => p.dex === item.dex && normPair(p.pair).includes(item.pairA))
      : pools.find(p => p.dex === item.dex && pairMatches(p.pair, item.pairA, item.pairB))
    if (found?.address) map[item.id] = buildPoolUrl(found.dex, found.address)
  }
  return map
}

function resolveLendUrls(lendMarkets, allocations) {
  const map = {}
  for (const item of allocations.filter(a => a.type === 'lend')) {
    const found = lendMarkets.find(m => m.protocol === item.protocol && m.asset === item.asset)
    if (found) map[item.id] = buildLendUrl(found.protocol, found.address, found.asset)
  }
  return map
}


function SelectionScreen({ onSelect, onBack }) {
  return (
    <div className="container">
      <TopBar />
      <button className="back-btn" onClick={onBack}>← Back</button>
      <div className="strat-hero">
        <h2 className="strat-question">What strategy are you interested in?</h2>
        <p className="strat-subtitle">Choose your risk level to see matching opportunities</p>
      </div>
      <div className="strat-choices">
        {LEVELS.map(l => (
          <div
            key={l.id}
            className={`strat-choice${l.soon ? ' strat-choice-soon' : ''}`}
            style={{ '--choice-color': l.color }}
            onClick={() => !l.soon && onSelect(l.id)}
          >
            <div className="strat-choice-icon" style={{ color: l.color }}>{l.icon}</div>
            <div className="strat-choice-name">{l.name}</div>
            <div className="strat-choice-desc">{l.desc}</div>
            <div className="strat-choice-tags">
              {l.tags.map(t => <span key={t} className="strat-tag">{t}</span>)}
            </div>
            <div className="strat-choice-cta">
              {l.soon
                ? <span className="card-soon">Coming soon</span>
                : <span className="card-cta" style={{ color: l.color }}>Explore →</span>
              }
            </div>
          </div>
        ))}
      </div>
      <Footer />
    </div>
  )
}

const formatUsd = (n) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

function StrategyView({ level, onBack }) {
  const currentLevel = LEVELS.find(l => l.id === level)
  const allocations = ALLOCATIONS_BY_LEVEL[level]
  const [resolvedUrls, setResolvedUrls] = useState({})
  const [rawInput, setRawInput] = useState('')

  const portfolioUsd = parseFloat(rawInput.replace(/[^0-9.]/g, '')) || 0

  useEffect(() => {
    fetch('/api/pools')
      .then(r => r.json())
      .then(d => setResolvedUrls(prev => ({ ...prev, ...resolvePoolUrls(d.pools || [], allocations) })))
      .catch(() => {})
    fetch('/api/lending')
      .then(r => r.json())
      .then(d => setResolvedUrls(prev => ({ ...prev, ...resolveLendUrls(d.lend || [], allocations) })))
      .catch(() => {})
  }, [])

  return (
    <div className="container">
      <TopBar />
      <div className="strat-view-toprow">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <span
          className="strat-level-chip"
          style={{ color: currentLevel.color, borderColor: currentLevel.color, opacity: 0.85 }}
        >
          {currentLevel.icon} {currentLevel.name}
        </span>
      </div>

      <button className="strategy-oneclick-btn" disabled title="Coming soon">
        ⚡ Realize strategy in one click
        <span className="strategy-oneclick-soon">coming soon...</span>
      </button>

      <div className="portfolio-input-wrap">
        <label className="portfolio-input-label">Your portfolio size</label>
        <div className="portfolio-input-row">
          <span className="portfolio-input-prefix">$</span>
          <input
            className="portfolio-input"
            type="text"
            inputMode="numeric"
            placeholder="10,000"
            value={rawInput}
            onChange={e => setRawInput(e.target.value)}
          />
          {portfolioUsd > 0 && (
            <span className="portfolio-input-total">{formatUsd(portfolioUsd)} total</span>
          )}
        </div>
      </div>

      <div className="alloc-bar">
        {allocations.map(item => (
          <div
            key={item.id}
            className="alloc-bar-seg"
            style={{ width: `${item.pct}%`, background: LABEL_COLOR[item.label] }}
            title={`${item.pct}% — ${item.displayAsset} (${item.label})`}
          />
        ))}
      </div>

      <div className="alloc-list">
        {allocations.map(item => {
          const badgeKey = item.type === 'pool' ? item.dex : item.protocol
          const badge = BADGE[badgeKey]
          const url = resolvedUrls[item.id] || item.fallbackUrl
          const labelColor = LABEL_COLOR[item.label]
          const dollarAmt = portfolioUsd > 0 ? portfolioUsd * item.pct / 100 : null
          return (
            <div key={item.id} className="alloc-row" onClick={() => window.open(url, '_blank')}>
              <div className="alloc-pct-col">
                <div className="alloc-pct" style={{ color: labelColor }}>{item.pct}%</div>
                {dollarAmt !== null && (
                  <div className="alloc-dollar">{formatUsd(dollarAmt)}</div>
                )}
              </div>
              <div className="alloc-body">
                <div className="alloc-header">
                  <span className={badge.cls}>{badge.label}</span>
                  <strong className="alloc-asset">{item.displayAsset}</strong>
                  <span className="alloc-type-tag" style={{ color: labelColor, borderColor: `color-mix(in oklch, ${labelColor} 30%, transparent)` }}>
                    {item.label}
                  </span>
                </div>
                <div className="alloc-desc">{item.desc}</div>
                <div className="alloc-risk">{item.risk}</div>
              </div>
              <div className="alloc-open">Open →</div>
            </div>
          )
        })}
      </div>

      <Footer />
    </div>
  )
}

export default function Strategies() {
  const navigate = useNavigate()
  const [level, setLevel] = useState(null)

  if (!level) {
    return <SelectionScreen onSelect={setLevel} onBack={() => navigate('/')} />
  }
  return <StrategyView level={level} onBack={() => setLevel(null)} />
}
