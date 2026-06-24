import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguageOptional } from '../../context/LanguageContext';

const NotFound = () => {
  const lang = useLanguageOptional();
  const title = lang?.t('common.notFound.title') ?? 'Page non trouvée';
  const description = lang?.t('common.notFound.description') ?? "L'adresse demandée n'existe pas ou a été déplacée.";
  const backLabel = lang?.t('common.notFound.backToDashboard') ?? 'Retour au tableau de bord';

  return (
    <div className="text-center py-20 px-4" role="main">
      <h1 className="text-6xl font-bold text-gray-300 dark:text-slate-600">404</h1>
      <p className="text-xl text-gray-600 dark:text-slate-300 mt-4">{title}</p>
      <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">{description}</p>
      <Link
        to="/dashboard"
        className="inline-block mt-6 px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
      >
        {backLabel}
      </Link>
    </div>
  );
};

export default NotFound;
