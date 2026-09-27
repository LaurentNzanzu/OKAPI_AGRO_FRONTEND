// frontend/src/components/common/PrintFooter.jsx
import React from 'react';

const PrintFooter = ({ pageNumber, totalPages, organisation }) => {
  return (
    <div className="print-footer">
      <div className="border-t border-gray-200 dark:border-slate-700 mb-2"></div>
      <div className="flex justify-between items-center flex-wrap text-[9px] text-gray-400 dark:text-slate-500">
        <div>
          <p className="m-0 text-gray-500 dark:text-slate-400 text-[9px]">
            {organisation?.ville ? `Fait à ${organisation.ville}, le` : 'Édité le'} {new Date().toLocaleDateString('fr-FR')}
          </p>
          <p className="m-0 text-[8px]">
            Document généré par OKAPI Immobilisation{organisation?.nom ? ` pour ${organisation.nom}` : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="m-0 font-bold text-gray-500 dark:text-slate-400">Page {pageNumber || '1'} / {totalPages || '1'}</p>
          <p className="m-0 text-[8px]">Document authentifié - Version électronique</p>
        </div>
      </div>
    </div>
  );
};

export default PrintFooter;