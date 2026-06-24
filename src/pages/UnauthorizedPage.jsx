// frontend/src/pages/UnauthorizedPage.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getAccessibleHomePath } from '../config/permissions';
import Button from '../components/ui/Button';

const ROLE_COLORS = {
  ADMIN: 'bg-purple-100 text-purple-700',
  DG: 'bg-primary-100 text-primary-600',
  COMPTABLE: 'bg-green-100 text-green-700',
  TECHNICIEN: 'bg-orange-100 text-orange-700',
  CAISSE: 'bg-cyan-100 text-cyan-700',
  MAGASINIER: 'bg-teal-100 text-teal-800',
  GESTIONNAIRE: 'bg-amber-100 text-amber-800',
};

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();

  const homePath = getAccessibleHomePath(user);
  const blockedPath = location.state?.from;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-amber-50 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-amber-500 px-6 py-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-white dark:bg-slate-900/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-4xl">🔒</span>
            </div>
          </div>
        </div>

        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
            {t('unauthorizedTitle')}
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mb-4">
            {t('unauthorizedMessage')}
          </p>

          {blockedPath && (
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">
              Page demandée : <code className="text-gray-600 dark:text-slate-300">{blockedPath}</code>
            </p>
          )}

          {user && (
            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                {t('yourRoles')}
              </p>
              <div className="flex flex-wrap gap-2">
                {user.roles?.map((role) => (
                  <span
                    key={role}
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      ROLE_COLORS[role] || 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              {t('goBack')}
            </Button>
            <Button onClick={() => navigate(homePath, { replace: true })}>
              {homePath === '/dashboard' ? t('goToDashboard') : 'Aller à mon espace'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
