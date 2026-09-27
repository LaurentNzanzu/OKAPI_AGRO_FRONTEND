import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authErrorMessage, AUTH_UNAVAILABLE } from '../../utils/authError';
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
  const [token] = useState(() => searchParams.get('token'));
  const submitting = useRef(false);
  const redirectTimer = useRef(null);
  const [verificationAttempt, setVerificationAttempt] = useState(0);
  const [verificationError, setVerificationError] = useState('');

  useEffect(() => {
    if (searchParams.has('token')) {
      const clean = new URLSearchParams(searchParams);
      clean.delete('token');
      navigate({ search: clean.toString() }, { replace: true });
    }
  }, [navigate, searchParams]);

  useEffect(() => () => clearTimeout(redirectTimer.current), []);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setValidToken(null);
    setVerificationError('');
    const verify = async () => {
      if (!token) { setValidToken(false); return; }
      try {
        const res = await authService.verifyResetToken(token);
        if (!cancelled) setValidToken(res.valid === true);
      } catch (error) {
        if (cancelled) return;
        if ([400, 401, 422].includes(error.response?.status)) setValidToken(false);
        else setVerificationError(AUTH_UNAVAILABLE);
      }
    };
    verify();
    return () => { cancelled = true; };
  }, [token, verificationAttempt]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting.current || validToken !== true || success) return;

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

    submitting.current = true;
    setLoading(true);
    setError('');
    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
      redirectTimer.current = setTimeout(() => navigate('/login', { replace: true, state: { message: 'Mot de passe mis à jour' } }), 3000);
    } catch (err) {
      if ([400, 401].includes(err.response?.status)) setValidToken(false);
      setError(authErrorMessage(err, 'Impossible de réinitialiser le mot de passe. Vérifiez les champs.'));
      triggerShake();
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  if (verificationError) {
    return <AuthPage variant="centered"><div className="af-auth__success-body">
      <AuthAlert>{verificationError}</AuthAlert>
      <button type="button" className="af-auth__submit" onClick={() => setVerificationAttempt((n) => n + 1)}>Réessayer</button>
      <AuthBackLink />
    </div><AuthFooter /></AuthPage>;
  }

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
