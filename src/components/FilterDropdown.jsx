import { useState, useRef, useEffect } from 'react'

const DEX_LIST = ['Meteora', 'Raydium', 'Orca', 'Kamino']

export default function FilterDropdown({ type, presets, unit, unitMultiplier = 1, customLabel, value, onChange, onOpen, onClose }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('range')
  const [customMin, setCustomMin] = useState('')
  const [customMax, setCustomMax] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        onClose?.()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const toggle = () => {
    const next = !open
    setOpen(next)
    next ? onOpen?.() : onClose?.()
  }

  const applyCustom = () => {
    const min = customMin !== '' ? parseFloat(customMin) * unitMultiplier : null
    const max = customMax !== '' ? parseFloat(customMax) * unitMultiplier : null
    if (mode === 'gt') onChange({ min, max: null })
    else if (mode === 'lt') onChange({ min: null, max })
    else onChange({ min, max })
  }

  if (type === 'dex') {
    return (
      <div className="filter-wrap" ref={ref}>
        <button className={`filter-btn${open ? ' active' : ''}`} onClick={toggle}>
          {open ? '∧' : '∨'}
        </button>
        {open && (
          <div className="filter-panel">
            <div className="filter-label">OPTIONS</div>
            {DEX_LIST.map(dex => (
              <label key={dex} className="filter-option">
                <input
                  type="checkbox"
                  checked={value.includes(dex)}
                  onChange={() => {
                    const next = value.includes(dex) ? value.filter(d => d !== dex) : [...value, dex]
                    onChange(next)
                  }}
                />
                <span className={`dex-badge dex-${dex}`}>{dex}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    )
  }

  const isPresetActive = (p) =>
    value.min === p.min && value.max === p.max && (value.min !== null || value.max !== null)

  return (
    <div className="filter-wrap" ref={ref}>
      <button className={`filter-btn${open ? ' active' : ''}`} onClick={toggle}>
        {open ? '∧' : '∨'}
      </button>
      {open && (
        <div className="filter-panel">
          <div className="filter-label">OPTIONS</div>
          {presets.map((p, i) => (
            <label key={i} className="filter-option">
              <input
                type="checkbox"
                checked={isPresetActive(p)}
                onChange={() => {
                  onChange(isPresetActive(p) ? { min: null, max: null } : { min: p.min, max: p.max })
                  setShowCustom(false)
                }}
              />
              {p.label}
            </label>
          ))}
          <div className="filter-label" style={{ marginTop: '10px' }}>CUSTOM {customLabel}</div>
          <div className="filter-mode-btns">
            <button className={`mode-btn${mode === 'range' ? ' active' : ''}`} onClick={() => { setMode('range'); setShowCustom(true) }}>RANGE</button>
            <button className={`mode-btn${mode === 'gt' ? ' active' : ''}`} onClick={() => { setMode('gt'); setShowCustom(true) }}>&gt;</button>
            <button className={`mode-btn${mode === 'lt' ? ' active' : ''}`} onClick={() => { setMode('lt'); setShowCustom(true) }}>&lt;</button>
          </div>
          {showCustom && (
            <div className="filter-inputs">
              {mode !== 'lt' && (
                <span className="filter-input-group">
                  min <input type="number" value={customMin} onChange={e => setCustomMin(e.target.value)} onBlur={applyCustom} /> {unit}
                </span>
              )}
              {mode === 'range' && <span className="filter-dash">—</span>}
              {mode !== 'gt' && (
                <span className="filter-input-group">
                  max <input type="number" value={customMax} onChange={e => setCustomMax(e.target.value)} onBlur={applyCustom} /> {unit}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
