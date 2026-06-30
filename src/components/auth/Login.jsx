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

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const requestedPath = location.state?.from?.pathname || '/dashboard';

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, mot_de_passe);

    if (result.success) {
      if (rememberMe) {
        sessionStorage.setItem('rememberMe', 'true');
        sessionStorage.setItem('rememberedEmail', email);
      } else {
        sessionStorage.removeItem('rememberMe');
        sessionStorage.removeItem('rememberedEmail');
      }

      const target = getPostLoginPath(result.user, requestedPath);
      navigate(target, { replace: true });
    } else {
      setError(result.error || 'Email ou mot de passe incorrect');
      triggerShake();
    }

    setLoading(false);
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
          {error && <AuthAlert>{error}</AuthAlert>}

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
                disabled={loading}
                className="af-auth__input"
              />
            </div>
          </div>

          <div className="af-auth__field">
            <label className="af-auth__label" htmlFor="mot_de_passe">
              Mot de passe
            </label>
            <div className="af-auth__input-wrap af-auth__input-wrap--password">
              <Link to="/forgot-password" className="af-auth__link-forgot-inline">
                Mot de passe oublié ?
              </Link>
              <LockIcon />
              <input
                type="password"
                id="mot_de_passe"
                value={mot_de_passe}
                onChange={(e) => setMotDePasse(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                disabled={loading}
                className="af-auth__input"
              />
            </div>
          </div>

          <RememberToggle
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={loading}
          />

          <hr className="af-auth__form-divider" aria-hidden />

          <AuthSubmitButton loading={loading}>Se connecter</AuthSubmitButton>
          <AuthBackLink to="/">← Retour à l&apos;accueil</AuthBackLink>
        </form>
      </div>
      <AuthFooter />
    </AuthPage>
  );
};

export default Login;
