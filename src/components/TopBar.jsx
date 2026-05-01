import { Link } from 'react-router-dom'

export default function TopBar() {
  return (
    <div className="top-bar">
      <Link to="/" className="logo">
        <span className="logo-sol">SolHelper</span>
      </Link>
    </div>
  )
}
