export default function SearchBar({ value, onChange, lastUpdated, error, placeholder }) {
  return (
    <div className="search-row">
      <input
        type="text"
        placeholder={placeholder || "Search for pair or DEX name (e.g: SOL or Raydium)..."}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <div className={`update-badge${error ? ' error' : ''}`}>
        <span className="update-dot" />
        UPD. {lastUpdated}
      </div>
    </div>
  )
}
