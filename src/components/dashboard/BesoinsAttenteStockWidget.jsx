import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { besoinsService } from '../../services/besoins';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import usePolling from '../../hooks/usePolling';
import { useTranslation } from '../../context/LanguageContext';

const BesoinsAttenteStockWidget = () => {
  const { t } = useTranslation();
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const data = await besoinsService.getEnAttenteStock();
      setCount(data?.length || 0);
    } catch {
      setCount(0);
    }
  }, []);

  usePolling(load, 30000);

  return (
    <div className="app-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
        <h3 className="font-semibold">{t('dashboardBesoinsWidget.title')}</h3>
      </div>
      <p className="text-3xl font-bold text-amber-600">{count}</p>
      <Link to="/besoins/attente-stock" className="text-sm text-primary-600 hover:underline mt-2 inline-block">
        {t('dashboardBesoinsWidget.viewList')}
      </Link>
    </div>
  );
};

export default BesoinsAttenteStockWidget;
