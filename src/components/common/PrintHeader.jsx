// frontend/src/components/common/PrintHeader.jsx
import React from 'react';
import { useTranslation } from '../../context/LanguageContext';
import logoOkapi from '../../assets/Logo.jpeg';

const PrintHeader = ({ title, subtitle, documentRef, date, logoSrc = logoOkapi }) => {
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
        <div className="flex gap-3 items-center">
          <div className="w-16 h-12 flex-shrink-0 flex items-center justify-center overflow-hidden rounded-xl">
            <img src={logoSrc} alt="Logo OKAPI Agro" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-green-700 tracking-wide m-0">{t('prints.header.company')}</h1>
            <p className="text-xs text-gray-500 dark:text-slate-400 my-0.5">{t('prints.header.legalForm')}</p>
            <div className="text-[9px] text-gray-400 dark:text-slate-500 mt-1">
              <span>RCCM: CD/KNG/RCCM/21-B-03234</span>
              <span className="mx-1">|</span>
              <span>Id. Nat.: 01-A0101-N93880K</span>
              <span className="mx-1">|</span>
              <span>Impôt: A2283297Q</span>
            </div>
          </div>
        </div>

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
