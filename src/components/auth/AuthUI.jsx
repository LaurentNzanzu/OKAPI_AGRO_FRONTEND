import React, { useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

/* ── SVG defs ── */
export const SpinnerDefs = () => (
  <svg width="0" height="0" aria-hidden>
    <defs>
      <linearGradient id="af-auth-spinner-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#1e293b" />
      </linearGradient>
    </defs>
  </svg>
);

export const AuthSpinner = () => (
  <span className="af-auth__spinner-wrap" aria-live="polite" aria-label="Chargement">
    <svg className="af-auth__spinner" viewBox="0 0 24 24" aria-hidden>
      <circle className="af-auth__spinner-ring" cx="12" cy="12" r="10" />
    </svg>
  </span>
);

export const MailIcon = () => (
  <svg className="af-auth__field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

export const LockIcon = () => (
  <svg className="af-auth__field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

export const HeroIllustration = () => (
  <svg className="af-auth__illustration" viewBox="0 0 88 88" fill="none" aria-hidden>
    <rect x="12" y="36" width="28" height="40" rx="2" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
    <path d="M20 44h12M20 50h8M20 56h10" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="44" y="28" width="20" height="48" rx="2" stroke="#60A5FA" strokeWidth="1.5" />
    <path d="M48 36h12M48 42h8" stroke="rgba(96,165,250,0.6)" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="54" cy="20" r="4" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
    <circle cx="68" cy="32" r="3" stroke="#60A5FA" strokeWidth="1.5" />
    <circle cx="72" cy="48" r="3" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
    <path d="M54 24l14 8M68 35l4 13" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M8 68h72" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M16 68v-8c0-4 8-8 16-8s16 4 16 8" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const AuthFooter = () => (
  <footer className="af-auth__footer">
    <span className="af-auth__copyright">© 2026 OKAPI Immobilisation</span>
    <nav className="af-auth__footer-links" aria-label="Liens pied de page">
      <a href="#" className="af-auth__footer-link">Confidentialité</a>
      <a href="#" className="af-auth__footer-link">Conditions</a>
      <a href="#" className="af-auth__footer-link">Support</a>
    </nav>
  </footer>
);

export const AuthSubmitButton = ({ loading, children, disabled, variant = 'primary', type = 'submit' }) => (
  <button
    type={type}
    className={`af-auth__submit${variant === 'outline' ? ' af-auth__submit--outline' : ''}`}
    disabled={disabled || loading}
  >
    {loading ? (
      <AuthSpinner />
    ) : (
      <>
        {children}
        {variant === 'primary' && (
          <svg className="af-auth__submit-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        )}
      </>
    )}
  </button>
);

export const AuthAlert = ({ children }) => (
  <div className="af-auth__alert" role="alert">
    <svg className="af-auth__alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
    {children}
  </div>
);

export const RememberToggle = ({ checked, onChange, disabled }) => (
  <label className="af-auth__toggle-row">
    <span className="af-auth__toggle">
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
      <span className="af-auth__toggle-track">
        <span className="af-auth__toggle-thumb" />
      </span>
    </span>
    <span className="af-auth__toggle-label">Rester connecté</span>
  </label>
);

export const getPasswordStrength = (password) => {
  if (!password) return { level: 0, label: '' };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (password.length < 8 || score <= 1) return { level: 1, label: 'Faible' };
  if (score <= 2) return { level: 2, label: 'Moyen' };
  return { level: 3, label: 'Fort' };
};

export const PasswordStrength = ({ password }) => {
  const { level, label } = getPasswordStrength(password);
  if (!password) return null;

  const levelClass = level === 1 ? 'weak' : level === 2 ? 'medium' : 'strong';

  return (
    <div className="af-auth__strength" aria-live="polite">
      <div className="af-auth__strength-bars">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`af-auth__strength-bar${i <= level ? ` af-auth__strength-bar--${levelClass}` : ''}`}
          />
        ))}
      </div>
      <span className={`af-auth__strength-label af-auth__strength-label--${levelClass}`}>{label}</span>
    </div>
  );
};

export const AuthHero = () => {
  const illuRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.innerWidth < 1024) return;
    const wrap = illuRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / rect.width;
    const dy = (e.clientY - cy) / rect.height;
    wrap.style.transform = `translate(${dx * 6}px, ${dy * 6}px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const wrap = illuRef.current;
    if (wrap) wrap.style.transform = '';
  }, []);

  return (
    <aside
      className="af-auth__hero"
      aria-label="Présentation"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="af-auth__hero-inner">
        <div className="af-auth__illustration-wrap" ref={illuRef}>
          <HeroIllustration />
        </div>
        <h1 className="af-auth__hero-title">Optimisez la gestion de vos actifs</h1>
        <p className="af-auth__hero-text">
          Une solution complète pour le suivi, l&apos;inventaire et l&apos;amortissement de vos
          immobilisations en temps réel.
        </p>
        <p className="af-auth__social-proof">
          <span className="af-auth__avatars" aria-hidden>
            <span className="af-auth__avatar-dot" />
            <span className="af-auth__avatar-dot" />
            <span className="af-auth__avatar-dot" />
          </span>
          <em>+200 entreprises nous font confiance</em>
        </p>
      </div>
    </aside>
  );
};

export const AuthPage = ({ variant = 'split', children, shake = false }) => (
  <div className="af-auth">
    <SpinnerDefs />
    <div className={`af-auth__wrapper ${variant === 'centered' ? 'af-auth__wrapper--centered' : ''}`} role="main">
      {variant === 'split' && <AuthHero />}
      <div className="af-auth__card-wrap">
        <div
          className={`af-auth__glow ${variant === 'centered' ? 'af-auth__glow--centered' : 'af-auth__glow--right'}`}
          aria-hidden
        />
        <div className={`af-auth__card${shake ? ' af-auth__card--shake' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  </div>
);

export const AuthLoadingPage = () => (
  <div className="af-auth__loading-page" role="status" aria-label="Chargement">
    <SpinnerDefs />
    <AuthSpinner />
  </div>
);

export const AuthBackLink = ({ to = '/login', children = '← Retour à la connexion' }) => (
  <Link to={to} className="af-auth__back-link">{children}</Link>
);
