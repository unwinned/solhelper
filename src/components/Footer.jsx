export default function Footer() {
  return (
    <div className="page-footer">
      <div className="footer-divider">
        <div className="footer-line-left" />
        <div className="footer-diamond" />
        <div className="footer-line-right" />
      </div>
      <div className="footer-credits">
        by{' '}
        <a className="fc-unwinned" href="https://x.com/unwinned_" target="_blank" rel="noreferrer">unwinned</a>
        {' '}with{' '}
        <a className="fc-quonlix" href="https://x.com/0xQuonlix" target="_blank" rel="noreferrer">Quonlix</a>
        's support
      </div>
    </div>
  )
}
