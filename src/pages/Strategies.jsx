import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import Footer from '../components/Footer'
import '../App.css'

// ─── URL builders — same logic as PoolTable / LendingTable ───────────────────

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
  if (protocol === 'Drift')        return 'https://app.drift.trade/earn/borrow-lend'
  return null
}

// ─── Pair matching — flexible (SOL/USDC = sol-usdc = SOLUSDC) ────────────────

const normPair = s => s.toUpperCase().replace(/[-\/\s]/g, '').replace(/WSOL/g, 'SOL')
const pairMatches = (poolPair, a, b) => {
  const pp = normPair(poolPair)
  return pp === `${a}${b}` || pp === `${b}${a}`
}

// ─── Strategy definitions ─────────────────────────────────────────────────────

const LEND_CARDS = [
  {
    id: 'kamino-usdc', type: 'lend', protocol: 'Kamino', asset: 'USDC',
    displayAsset: 'USDC',
    fallbackUrl: 'https://kamino.com/lend',
    desc: 'Supply USDC to Kamino\'s lending market. Battle-tested protocol with deep liquidity and consistent borrowing demand from leveraged traders.',
    risk: 'Stablecoin · No IL · Smart contract risk',
  },
  {
    id: 'kamino-usdt', type: 'lend', protocol: 'Kamino', asset: 'USDT',
    displayAsset: 'USDT',
    fallbackUrl: 'https://kamino.com/lend',
    desc: 'Supply USDT to Kamino. High utilisation from leveraged traders keeps lending rates competitive.',
    risk: 'Stablecoin · No IL · Smart contract risk',
  },
  {
    id: 'jup-usdc', type: 'lend', protocol: 'Jupiter Lend', asset: 'USDC',
    displayAsset: 'USDC',
    fallbackUrl: 'https://jup.ag/lend/earn/USDC/deposit',
    desc: 'Earn yield on USDC through Jupiter\'s lending product, backed by Jupiter\'s ecosystem and integrated liquidity.',
    risk: 'Stablecoin · No IL · Smart contract risk',
  },
  {
    id: 'kamino-sol', type: 'lend', protocol: 'Kamino', asset: 'SOL',
    displayAsset: 'SOL',
    fallbackUrl: 'https://kamino.com/lend',
    desc: 'Supply native SOL to Kamino. Borrowers use SOL as collateral for leveraged positions, driving lending demand.',
    risk: 'Blue-chip asset · No IL · Smart contract risk',
  },
  {
    id: 'drift-usdc', type: 'lend', protocol: 'Drift', asset: 'USDC',
    displayAsset: 'USDC / SOL',
    fallbackUrl: 'https://app.drift.trade/earn/borrow-lend',
    desc: 'Deposit USDC or SOL into Drift\'s borrow-lend module. Earn yield from perpetuals traders borrowing to open positions.',
    risk: 'Stablecoin / Blue-chip · No IL · Smart contract risk',
  },
]

const LP_PASSIVE = [
  {
    id: 'kamino-sol-usdc', type: 'pool', dex: 'Kamino', pairA: 'SOL', pairB: 'USDC',
    displayAsset: 'SOL / USDC',
    fallbackUrl: 'https://app.kamino.finance/liquidity',
    desc: 'Auto-managed liquidity vault on Kamino. Ranges rebalanced automatically — earn LP fees without manual intervention.',
    risk: 'Low IL · Rebalancing slippage · Smart contract risk',
  },
  {
    id: 'meteora-sol-usdc', type: 'pool', dex: 'Meteora', pairA: 'SOL', pairB: 'USDC',
    displayAsset: 'SOL / USDC',
    fallbackUrl: 'https://app.meteora.ag/dlmm',
    desc: 'DLMM pool with dynamic fees — fees rise with volatility, partially cushioning IL during market moves.',
    risk: 'Moderate IL · Dynamic fees · Smart contract risk',
  },
  {
    id: 'meteora-usdc-usdt', type: 'pool', dex: 'Meteora', pairA: 'USDC', pairB: 'USDT',
    displayAsset: 'USDC / USDT',
    fallbackUrl: 'https://app.meteora.ag/dlmm',
    desc: 'Stablecoin DLMM pool on Meteora. Near-zero impermanent loss, earns swap fees from high-frequency stablecoin trading.',
    risk: 'Near-zero IL · Dynamic fees · Smart contract risk',
  },
  {
    id: 'kamino-jlp', type: 'pool', dex: 'Kamino', pairA: 'JLP', pairB: null,
    displayAsset: 'JLP',
    fallbackUrl: 'https://app.kamino.finance/liquidity',
    desc: 'Deposit JLP into Kamino\'s auto-compounding vault. Earn Jupiter Perps trading fees with auto-reinvestment.',
    risk: 'Index exposure (SOL BTC ETH) · Smart contract risk',
  },
]

const LP_ACTIVE = [
  {
    id: 'raydium-sol-usdc', type: 'pool', dex: 'Raydium', pairA: 'SOL', pairB: 'USDC',
    displayAsset: 'SOL / USDC',
    fallbackUrl: 'https://raydium.io/clmm/pools/',
    desc: 'CLMM position on Raydium. The highest-volume SOL/USDC pool on Solana. Tighter range = higher APR, requires periodic rebalancing.',
    risk: 'IL risk · Active range management · Smart contract risk',
  },
  {
    id: 'raydium-sol-usdt', type: 'pool', dex: 'Raydium', pairA: 'SOL', pairB: 'USDT',
    displayAsset: 'SOL / USDT',
    fallbackUrl: 'https://raydium.io/clmm/pools/',
    desc: 'CLMM position on Raydium for the SOL/USDT pair. Deep liquidity and consistent fee income from high trading activity.',
    risk: 'IL risk · Active range management · Smart contract risk',
  },
  {
    id: 'meteora-sol-usdc-active', type: 'pool', dex: 'Meteora', pairA: 'SOL', pairB: 'USDC',
    displayAsset: 'SOL / USDC',
    fallbackUrl: 'https://app.meteora.ag/dlmm',
    desc: 'Meteora DLMM with a tight bin step for aggressive fee capture. Higher returns than the passive setting but requires monitoring bin range.',
    risk: 'IL risk · Bin range management · Smart contract risk',
  },
]

const SECTIONS_BY_LEVEL = {
  'super-safe': [
    { label: 'Lend', cards: LEND_CARDS },
  ],
  'safe': [
    { label: 'Lend', cards: LEND_CARDS },
    { label: 'Provide Liquidity', cards: LP_PASSIVE },
  ],
  'middle': [
    { label: 'Lend', cards: LEND_CARDS },
    { label: 'Provide Liquidity — Passive', sublabel: 'Auto-managed or dynamic fee pools', cards: LP_PASSIVE },
    { label: 'Provide Liquidity — Active', sublabel: 'Concentrated positions, requires periodic rebalancing', cards: LP_ACTIVE },
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
    tags: ['Lend', 'Provide liquidity'],
  },
  {
    id: 'middle', name: 'Middle', icon: '⬡', color: 'var(--orca-yellow)',
    desc: 'Lending plus two liquidity strategies — passive vaults and active concentrated positions.',
    tags: ['Lend', 'Passive LP', 'Active LP'],
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
  'Drift':        { cls: 'protocol-badge protocol-Drift',       label: 'Drift' },
  'Orca':         { cls: 'dex-badge dex-Orca',                  label: 'Orca' },
  'Raydium':      { cls: 'dex-badge dex-Raydium',               label: 'Raydium' },
  'Meteora':      { cls: 'dex-badge dex-Meteora',               label: 'Meteora' },
}

// ─── Resolve live URLs from API data ─────────────────────────────────────────

function resolvePoolUrls(pools) {
  const map = {}
  for (const card of [...LP_PASSIVE, ...LP_ACTIVE]) {
    let found
    if (card.pairB === null) {
      found = pools.find(p => p.dex === card.dex && normPair(p.pair).includes(card.pairA))
    } else {
      found = pools.find(p => p.dex === card.dex && pairMatches(p.pair, card.pairA, card.pairB))
    }
    if (found?.address) map[card.id] = buildPoolUrl(found.dex, found.address)
  }
  return map
}

function resolveLendUrls(lendMarkets) {
  const map = {}
  for (const card of LEND_CARDS) {
    const found = lendMarkets.find(m => m.protocol === card.protocol && m.asset === card.asset)
    if (found) map[card.id] = buildLendUrl(found.protocol, found.address, found.asset)
  }
  return map
}

// ─── Components ───────────────────────────────────────────────────────────────

function StrategyCard({ s, resolvedUrl }) {
  const badgeKey = s.type === 'pool' ? s.dex : s.protocol
  const badge = BADGE[badgeKey]
  const url = resolvedUrl || s.fallbackUrl

  return (
    <div className="strategy-card" onClick={() => window.open(url, '_blank')}>
      <div className="strategy-card-top">
        <span className={badge.cls}>{badge.label}</span>
      </div>
      <div className="strategy-asset">{s.displayAsset}</div>
      <div className="strategy-desc">{s.desc}</div>
      <div className="strategy-footer">
        <span className="strategy-risk-note">{s.risk}</span>
        <span className="strategy-link">Open →</span>
      </div>
    </div>
  )
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

function StrategyView({ level, onBack }) {
  const currentLevel = LEVELS.find(l => l.id === level)
  const sections = SECTIONS_BY_LEVEL[level]
  const [resolvedUrls, setResolvedUrls] = useState({})

  useEffect(() => {
    fetch('/api/pools')
      .then(r => r.json())
      .then(poolData => setResolvedUrls(prev => ({ ...prev, ...resolvePoolUrls(poolData.pools || []) })))
      .catch(() => {})

    fetch('/api/lending')
      .then(r => r.json())
      .then(lendData => setResolvedUrls(prev => ({ ...prev, ...resolveLendUrls(lendData.lend || []) })))
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

      {sections.map((section, si) => (
        <div key={si} className="strat-section">
          <div className="strat-section-label">
            <span>{section.label}</span>
            {section.sublabel && <span className="strat-section-sublabel">{section.sublabel}</span>}
          </div>
          <div className="strategy-grid">
            {section.cards.map(s => (
              <StrategyCard key={s.id} s={s} resolvedUrl={resolvedUrls[s.id]} />
            ))}
          </div>
        </div>
      ))}
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
