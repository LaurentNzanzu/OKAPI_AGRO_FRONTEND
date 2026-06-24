import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import authService from '../../services/auth';
import {
  AuthPage,
  AuthFooter,
  AuthSubmitButton,
  AuthAlert,
  AuthLoadingPage,
  AuthBackLink,
  LockIcon,
  PasswordStrength,
} from './AuthUI';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setValidToken(false);
        return;
      }
      try {
        const res = await authService.verifyResetToken(token);
        setValidToken(res.valid);
      } catch {
        setValidToken(false);
      }
    };
    verify();
  }, [token]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      triggerShake();
      return;
    }
    if (password.length < 8) {
      setError('Minimum 8 caractères requis');
      triggerShake();
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Doit contenir au moins une majuscule');
      triggerShake();
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError('Doit contenir au moins une minuscule');
      triggerShake();
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError('Doit contenir au moins un chiffre');
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login', { state: { message: 'Mot de passe mis à jour' } }), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la réinitialisation');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  if (validToken === null) {
    return <AuthLoadingPage />;
  }

  if (validToken === false) {
    return (
      <AuthPage variant="centered">
        <div className="af-auth__success-body">
          <div className="af-auth__icon-badge af-auth__icon-badge--error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="af-auth__title">Lien invalide</h2>
          <p className="af-auth__subtitle" style={{ marginBottom: 24 }}>
            Ce lien a expiré ou n&apos;est plus valide. Demandez-en un nouveau pour continuer.
          </p>
          <button
            type="button"
            className="af-auth__submit"
            onClick={() => navigate('/forgot-password')}
          >
            Demander un nouveau lien
          </button>
        </div>
        <AuthFooter />
      </AuthPage>
    );
  }

  if (success) {
    return (
      <AuthPage variant="centered">
        <div className="af-auth__success-body">
          <div className="af-auth__icon-badge af-auth__icon-badge--success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="af-auth__title">Mot de passe mis à jour</h2>
          <p className="af-auth__subtitle">Redirection vers la connexion...</p>
        </div>
        <AuthFooter />
      </AuthPage>
    );
  }

  return (
    <AuthPage variant="centered" shake={shake}>
      <div className="af-auth__panel-body af-auth__panel-body--centered">
        <div className="af-auth__icon-badge">
          <LockIcon />
        </div>
        <header className="af-auth__header af-auth__header--centered">
          <h2 className="af-auth__title">Nouveau mot de passe</h2>
          <p className="af-auth__subtitle">Définissez un mot de passe sécurisé pour votre compte</p>
        </header>

        <form onSubmit={handleSubmit} className="af-auth__form" noValidate>
          {error && <AuthAlert>{error}</AuthAlert>}

          <div className="af-auth__field">
            <label className="af-auth__label" htmlFor="new-password">
              Nouveau mot de passe
            </label>
            <div className="af-auth__input-wrap">
              <LockIcon />
              <input
                type="password"
                id="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                disabled={loading}
                className="af-auth__input"
              />
            </div>
            <PasswordStrength password={password} />
          </div>

          <div className="af-auth__field">
            <label className="af-auth__label" htmlFor="confirm-password">
              Confirmer le mot de passe
            </label>
            <div className="af-auth__input-wrap">
              <LockIcon />
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                disabled={loading}
                className="af-auth__input"
              />
            </div>
          </div>

          <hr className="af-auth__form-divider" aria-hidden />

          <AuthSubmitButton loading={loading} disabled={!password || !confirmPassword}>
            Réinitialiser
          </AuthSubmitButton>
          <AuthBackLink />
        </form>
      </div>
      <AuthFooter />
    </AuthPage>
  );
};

export default ResetPassword;
