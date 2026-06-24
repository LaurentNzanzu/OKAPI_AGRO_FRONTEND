import React from 'react';
import { Link } from 'react-router-dom';
import useFournitures from '../../hooks/useFournitures';
import { formatDate } from '../../utils/formatters';
import { ArchiveBoxIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../context/LanguageContext';

const FournituresEnAttenteWidget = () => {
  const { t } = useTranslation();
  const { fournitures, count, loading } = useFournitures({ poll: true });

  return (
    <div className="app-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <ArchiveBoxIcon className="w-5 h-5 text-primary-600" />
        <h3 className="font-semibold">{t('fournituresWidget.title')}</h3>
      </div>
      <p className="text-3xl font-bold text-primary-600">{loading ? '…' : count}</p>
      <p className="text-xs text-gray-500 mb-3">{t('fournituresWidget.pending')}</p>
      <Link to="/fournitures/en-attente" className="text-sm text-primary-600 hover:underline">
        {t('fournituresWidget.viewAll')}
      </Link>
      {fournitures.slice(0, 5).map((f) => (
        <div key={f.id_fourniture} className="text-xs text-gray-500 mt-2 border-t pt-1">
          {t('fournituresWidget.needLine', { id: f.id_besoin, date: formatDate(f.date_creation) })}
        </div>
      ))}
    </div>
  );
};

export default FournituresEnAttenteWidget;
