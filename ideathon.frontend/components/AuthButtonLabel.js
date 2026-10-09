// Both labels occupy the same grid cell so loading never changes button size,
// including when the longer label wraps on a narrow screen.
export default function AuthButtonLabel({ busy, children, busyText = 'İşlem yapılıyor...', icon }) {
  return (
    <span className="auth-button-label">
      <span className={`button-state ${busy ? 'inactive' : ''}`} aria-hidden={busy}>
        <span>{children}</span>
        {icon && <i className={`bi ${icon}`} aria-hidden="true" />}
      </span>
      <span className={`button-state ${busy ? '' : 'inactive'}`} aria-hidden={!busy}>
        <span>{busyText}</span>
        <span className="button-spinner" aria-hidden="true" />
      </span>
      <style jsx>{`
        .auth-button-label {
          display: grid;
          width: 100%;
          min-width: 0;
          line-height: 1.5;
        }
        .button-state {
          grid-area: 1 / 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .inactive {
          visibility: hidden;
          pointer-events: none;
        }
        .button-spinner {
          box-sizing: border-box;
          flex: 0 0 18px;
          width: 18px;
          height: 18px;
          border: 2px solid currentColor;
          border-right-color: transparent;
          border-radius: 50%;
        }
        .button-state:not(.inactive) .button-spinner {
          animation: auth-button-spin 0.8s linear infinite;
        }
        @keyframes auth-button-spin {
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .button-state:not(.inactive) .button-spinner { animation: none; }
        }
      `}</style>
    </span>
  );
}
