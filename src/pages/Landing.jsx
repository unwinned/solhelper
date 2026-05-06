import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import '../App.css'

const CARDS = [
  {
    title: 'Pools',
    description: 'Find the best liquidity pools across Raydium, Orca and Meteora. Filter by APR, TVL and volume.',
    path: '/pools',
    icon: '◈',
    color: 'var(--solana-green)',
    available: true,
  },
  {
    title: 'Lending',
    isNew: true,
    description: 'Compare lending and borrowing rates across Solana protocols.',
    path: '/lending',
    icon: '◎',
    color: 'var(--solana-cyan)',
    available: true,
<<<<<<< HEAD
    isNew: true,
=======
>>>>>>> 3b66c84 (adding lending)
  },
  {
    title: 'Strategies',
    description: 'Curated yield strategies across Safe, Middle, and Risky risk profiles built on top of the best opportunities.',
    path: '/strategies',
    icon: '⬡',
    color: 'var(--solana-purple)',
    available: false,
    isNew: false,
  },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="container">
      <TopBar />
      <div className="landing-hero">
        <h1 className="landing-title">
          What are you looking for?
        </h1>
        <p className="landing-subtitle">All on Solana in one app</p>
      </div>
      <div className="landing-cards">
        {CARDS.map(card => (
          <div
            key={card.title}
            className={`landing-card${!card.available ? ' landing-card-soon' : ''}`}
            onClick={() => card.available && navigate(card.path)}
            style={{ '--card-color': card.color }}
          >
            <div className="card-icon" style={{ color: card.color }}>{card.icon}</div>
            <div className="card-title">{card.title}</div>
            <div className="card-desc">{card.description}</div>
            <div className="card-cta-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {card.available
                ? <span className="card-cta">Explore →</span>
                : <span className="card-soon">Coming soon</span>
              }
              {card.isNew && <span className="card-new">NEW</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
