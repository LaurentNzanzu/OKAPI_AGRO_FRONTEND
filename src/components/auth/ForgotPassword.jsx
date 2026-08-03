import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/auth';
import {
  AuthPage,
  AuthFooter,
  AuthSubmitButton,
  AuthAlert,
  AuthBackLink,
  MailIcon,
} from './AuthUI';

const KeyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);

const MailSuccessIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  
  // États pour le mode développement
  const [devLink, setDevLink] = useState(null);
  const [resetToken, setResetToken] = useState(null);
  const [countdown, setCountdown] = useState(5);
  
  const navigate = useNavigate();

  // Gestion du décompte pour l'affichage du lien de test
  useEffect(() => {
    let timer;
    if (success && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (success && countdown === 0 && !devLink && !resetToken) {
      // Si le décompte est fini mais qu'aucun lien n'est disponible, afficher un message
      setDevLink(null);
    }
    return () => clearTimeout(timer);
  }, [success, countdown, devLink, resetToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await authService.forgotPassword(email);
      setSuccess(true);
      
      console.log("Réponse API forgotPassword :", response);

      // Récupération du token et du lien de développement
      const token = response?.data?.reset_token || response?.reset_token;
      const link = response?.data?.dev_reset_link || response?.dev_reset_link;

      if (token) {
        setResetToken(token);
      }

      if (link) {
        // On conserve le lien pour l'affichage après le décompte
        setTimeout(() => {
          setDevLink(link);
        }, 5000); // 5 secondes
      }
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la demande');
      setShake(true);
      setTimeout(() => setShake(false), 400);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = () => {
    if (resetToken) {
      navigate(`/reset-password?token=${resetToken}`);
    } else if (devLink) {
      window.location.href = devLink;
    }
  };

  if (success) {
    return (
      <AuthPage variant="centered">
        <div className="af-auth__success-body">
          <div className="af-auth__icon-badge af-auth__icon-badge--success">
            <MailSuccessIcon />
          </div>
          <h2 className="af-auth__title">Vérifiez votre boîte mail</h2>
          <p className="af-auth__subtitle" style={{ marginBottom: 24 }}>
            Si un compte est associé à cette adresse, vous recevrez un lien sécurisé sous 2 minutes.
            Pensez à vérifier vos spams.
          </p>

          {/* Bloc d'affichage du lien de test en mode développement */}
          {countdown > 0 ? (
            <p className="text-xs text-slate-400 mb-6 italic">
              Affichage du lien direct de test dans {countdown} secondes...
            </p>
          ) : (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center animate-fade-in">
              <p className="text-xs text-emerald-800 font-semibold mb-2 uppercase tracking-wider">
                Mode Développement — Accès rapide
              </p>
              {(devLink || resetToken) ? (
                <button
                  onClick={handleResetPassword}
                  className="inline-block w-full py-2.5 px-4 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 shadow-sm transition-colors text-center"
                  style={{ textDecoration: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {resetToken ? '🔑' : '📧'} Réinitialiser mon mot de passe maintenant
                </button>
              ) : (
                <p className="text-sm text-emerald-700 font-medium">
                  Aucun lien de réinitialisation disponible pour cet email
                </p>
              )}
            </div>
          )}

          <Link to="/login" className="af-auth__submit af-auth__submit--outline" style={{ textDecoration: 'none', display: 'inline-flex' }}>
            Retour à la connexion
          </Link>
        </div>
        <AuthFooter />
      </AuthPage>
    );
  }

  return (
    <AuthPage variant="centered" shake={shake}>
      <div className="af-auth__panel-body af-auth__panel-body--centered">
        <div className="af-auth__icon-badge">
          <KeyIcon />
        </div>
        <header className="af-auth__header af-auth__header--centered">
          <h2 className="af-auth__title">Mot de passe oublié ?</h2>
          <p className="af-auth__subtitle">
            Saisissez votre adresse professionnelle. Si un compte existe, vous recevrez un lien
            sécurisé sous 2 minutes.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="af-auth__form" noValidate>
          {error && <AuthAlert>{error}</AuthAlert>}

          <div className="af-auth__field">
            <label className="af-auth__label" htmlFor="forgot-email">
              Adresse e-mail
            </label>
            <div className="af-auth__input-wrap">
              <MailIcon />
              <input
                type="email"
                id="forgot-email"
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

          <hr className="af-auth__form-divider" aria-hidden />

          <AuthSubmitButton loading={loading}>Envoyer le lien</AuthSubmitButton>
          <AuthBackLink />
        </form>
      </div>
      <AuthFooter />
    </AuthPage>
  );
};

export default ForgotPassword;