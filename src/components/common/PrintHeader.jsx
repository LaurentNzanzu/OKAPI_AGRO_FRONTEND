// frontend/src/components/common/PrintHeader.jsx
import React from 'react';
import { useTranslation } from '../../context/LanguageContext';
import OrganisationIdentity from '../organisations/OrganisationIdentity';

const PrintHeader = ({ title, subtitle, documentRef, date, organisation }) => {
  const { t } = useTranslation();
  const currentDate = date || new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <div className="mb-5 print:mb-5">
      <div className="border-t-4 border-green-700 mb-3"></div>
      
      <div className="flex justify-between items-start flex-wrap gap-4">
        <OrganisationIdentity organisation={organisation} />

        <div className="text-right border-l-2 border-green-700 pl-4">
          <div className="flex items-center gap-1.5">
            <span className="text-2xl">📄</span>
            <span className="text-base font-bold text-gray-800 dark:text-slate-100">{title}</span>
          </div>
          {subtitle && <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{subtitle}</p>}
          <div className="mt-2 text-[10px] text-gray-400 dark:text-slate-500">
            {documentRef && <div className="block">{t('prints.header.ref')}: {documentRef}</div>}
            <div className="block">{t('prints.header.date')}: {currentDate}</div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-slate-700 mt-3 mb-5"></div>
    </div>
  );
};

export default PrintHeader;
