// frontend/src/components/auth/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPostLoginPath } from '../../utils/postLoginRedirect';
import {
  AuthPage,
  AuthFooter,
  AuthSubmitButton,
  AuthAlert,
  RememberToggle,
  MailIcon,
  LockIcon,
  AuthBackLink,
} from './AuthUI';

const Login = () => {
  const [email, setEmail] = useState('');
  const [mot_de_passe, setMotDePasse] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const requestedPath = location.state?.from?.pathname || '/dashboard';

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  useEffect(() => {
    if (!blockedUntil) return undefined;

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [blockedUntil]);

  const secondsLeft = Math.max(
    0,
    Math.ceil((blockedUntil - now) / 1000)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || secondsLeft > 0) return;

    setError('');
    setLoading(true);

    try {
      const result = await login(email.trim(), mot_de_passe);

      if (result.success) {
        setBlockedUntil(0);
        if (rememberMe) {
          sessionStorage.setItem('rememberMe', 'true');
          sessionStorage.setItem('rememberedEmail', email);
        } else {
          sessionStorage.removeItem('rememberMe');
          sessionStorage.removeItem('rememberedEmail');
        }

        const target = result.data.user.doit_changer_mot_de_passe
          ? '/force-change-password'
          : getPostLoginPath(result.data.user, requestedPath);
        navigate(target, { replace: true });
      } else {
        if (result.status === 429 || result.remainingAttempts === 0) {
          const retryAfter = Number(result.retryAfter);
          const delay = Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter
            : 300;
          const currentTime = Date.now();
          setBlockedUntil(currentTime + delay * 1000);
          setNow(currentTime);
          setError('Trop de tentatives incorrectes. Patientez avant de réessayer.');
        } else if (typeof result.remainingAttempts === 'number') {
          setError(
            `${result.error || 'Email ou mot de passe incorrect'} ` +
            `Tentatives restantes : ${result.remainingAttempts}.`
          );
        } else {
          setError(result.error || 'Email ou mot de passe incorrect');
        }
        triggerShake();
      }
    } catch {
      setError('Connexion impossible pour le moment. Veuillez réessayer.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const rememberedEmail = sessionStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <AuthPage variant="split" shake={shake}>
      <div className="af-auth__panel-body">
        <header className="af-auth__header">
          <span className="af-auth__badge">ENTERPRISE</span>
          <h2 className="af-auth__title">Bienvenue sur OKAPI Immobilisation</h2>
          <p className="af-auth__subtitle">Connectez-vous pour gérer vos immobilisations</p>
        </header>

        <form onSubmit={handleSubmit} className="af-auth__form" noValidate>
          {error && (
            <AuthAlert>
              {error}
              {secondsLeft > 0 && (
                ` Réessayez dans ${Math.floor(secondsLeft / 60)}:${String(
                  secondsLeft % 60
                ).padStart(2, '0')}.`
              )}
            </AuthAlert>
          )}

          <div className="af-auth__field">
            <label className="af-auth__label" htmlFor="email">
              Adresse e-mail
            </label>
            <div className="af-auth__input-wrap">
              <MailIcon />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@entreprise.fr"
                required
                autoComplete="email"
                autoFocus
                disabled={loading || secondsLeft > 0}
                className="af-auth__input"
              />
            </div>
          </div>

          <div className="af-auth__field">
            <div className="flex justify-between items-center">
              <label className="af-auth__label" htmlFor="mot_de_passe">
                Mot de passe
              </label>
              <Link to="/forgot-password" className="af-auth__link-forgot-inline">
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="af-auth__input-wrap af-auth__input-wrap--password">
              <LockIcon />
              <input
                type="password"
                id="mot_de_passe"
                value={mot_de_passe}
                onChange={(e) => setMotDePasse(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                disabled={loading || secondsLeft > 0}
                className="af-auth__input"
              />
            </div>
          </div>

          <RememberToggle
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={loading || secondsLeft > 0}
          />

          <hr className="af-auth__form-divider" aria-hidden />

          <fieldset
            disabled={loading || secondsLeft > 0}
            style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
          >
            <AuthSubmitButton loading={loading}>Se connecter</AuthSubmitButton>
          </fieldset>
          <AuthBackLink to="/">← Retour à l&apos;accueil</AuthBackLink>
        </form>
      </div>
      <AuthFooter />
    </AuthPage>
  );
};

export default Login;
