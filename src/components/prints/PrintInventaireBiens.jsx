// frontend/src/components/prints/PrintInventaireBiens.jsx
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import PrintHeader from '../common/PrintHeader';
import PrintFooter from '../common/PrintFooter';
import { formatPrice } from '../../utils/formatters';
import { useTranslation } from '../../context/LanguageContext';
import {
  printPageStyle,
  PrintSection,
  PrintDataTable,
  PrintSignatures,
  PrintButton,
} from './PrintLayout';

const toAmount = (value) => {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isFinite(num) ? num : 0;
};

const formatAmount = (value) => {
  const num = toAmount(value);
  if (!num) return '—';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

// 🔥 Fonction pour extraire le nom de la localisation
const getLocalisationName = (loc) => {
  if (typeof loc === 'object' && loc !== null) {
    return loc.nom_localisation || '—';
  }
  return loc || '—';
};

const PrintInventaireBiens = ({ biens = [], onClose }) => {
  const { t } = useTranslation();

  const getTypeLabel = (type) => {
    const key = `status.type.${type}`;
    const label = t(key);
    return label !== key ? label : type;
  };

  const getEtatLabel = (etat) => {
    const key = `status.etat.${etat}`;
    const label = t(key);
    return label !== key ? label : etat;
  };

  const totalValeur = biens.reduce((sum, b) => sum + toAmount(b.prix_acquisition), 0);
  const parType = biens.reduce((acc, b) => {
    const key = b.type_bien || 'autre';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const content = (
    <>
      <div
        className="no-print fixed inset-0 z-[9998] bg-black/60 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="print-area print-inventaire-modal fixed left-1/2 top-1/2 z-[9999] w-[calc(100%-2rem)] max-w-4xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto bg-white rounded-xl shadow-2xl p-6 sm:p-8 text-gray-900"
        style={printPageStyle}
        role="dialog"
        aria-modal="true"
        aria-label={t('prints.inventaire.ariaLabel')}
      >
        <div className="no-print mb-4 flex justify-end gap-2 sticky top-0 bg-white/95 backdrop-blur-sm pb-2 z-10 border-b border-gray-100">
          <PrintButton onClick={() => window.print()}>{t('prints.print')}</PrintButton>
          {onClose && (
            <PrintButton variant="secondary" onClick={onClose}>
              {t('prints.close')}
            </PrintButton>
          )}
        </div>

        <PrintHeader
          title={t('prints.inventaire.title')}
          subtitle={t('prints.inventaire.subtitle')}
        />

        <PrintSection title={t('prints.inventaire.section1')}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
            <div className="border border-green-200 bg-green-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600 uppercase tracking-wide">{t('prints.inventaire.totalAssets')}</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{biens.length}</p>
            </div>
            <div className="border border-green-200 bg-green-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600 uppercase tracking-wide">{t('prints.inventaire.totalValue')}</p>
              <p className="text-lg font-bold text-green-900 mt-1">{formatPrice(totalValeur)}</p>
            </div>
            <div className="border border-green-200 bg-green-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600 uppercase tracking-wide">{t('prints.inventaire.vehicles')}</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{parType.vehicule || 0}</p>
            </div>
            <div className="border border-green-200 bg-green-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600 uppercase tracking-wide">{t('prints.inventaire.machinesIt')}</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {(parType.machine || 0) + (parType.ordinateur || 0)}
              </p>
            </div>
          </div>
        </PrintSection>

        <PrintSection title={t('prints.inventaire.section2')}>
          {biens.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4 text-center">{t('prints.inventaire.empty')}</p>
          ) : (
            <PrintDataTable
              columns={[
                { key: 'num', label: t('prints.inventaire.colNum'), align: 'center' },
                { key: 'type', label: t('prints.inventaire.colType') },
                { key: 'designation', label: t('prints.inventaire.colDesignation') },
                { key: 'serie', label: t('prints.inventaire.colSerial'), mono: true },
                { key: 'date', label: t('prints.inventaire.colDate') },
                { key: 'valeur', label: t('prints.inventaire.colValue'), align: 'right' },
                { key: 'etat', label: t('prints.inventaire.colState') },
                { key: 'localisation', label: t('prints.inventaire.colLocation') },
              ]}
              rows={biens.map((bien, idx) => ({
                num: idx + 1,
                type: getTypeLabel(bien.type_bien) || bien.type_bien || '—',
                designation: `${bien.marque || bien.fabricant || ''} ${bien.modele || ''}`.trim() || '—',
                serie: bien.numero_serie || bien.immatriculation || '—',
                date: bien.date_acquisition
                  ? new Date(bien.date_acquisition).toLocaleDateString('fr-FR')
                  : '—',
                valeur: formatAmount(bien.prix_acquisition),
                etat: getEtatLabel(bien.etat) || bien.etat || '—',
                // 🔥 CORRECTION : Utiliser getLocalisationName pour extraire le nom
                localisation: getLocalisationName(bien.localisation),
              }))}
              footer={
                <tr className="bg-gray-50 font-semibold">
                  <td className="border border-gray-200 px-2 py-2 text-right" colSpan={5}>
                    {t('prints.inventaire.grandTotal')}
                  </td>
                  <td className="border border-gray-200 px-2 py-2 text-right whitespace-nowrap">
                    {formatPrice(totalValeur)}
                  </td>
                  <td className="border border-gray-200 px-2 py-2" colSpan={2} />
                </tr>
              }
            />
          )}
        </PrintSection>

        <PrintSection title={t('prints.inventaire.section3')}>
          <PrintSignatures
            items={[
              { label: t('prints.inventaire.assetManager'), footer: t('prints.inventaire.stampSignature') },
              { label: t('prints.inventaire.generalManagement'), footer: t('prints.inventaire.stampSignature') },
              { label: t('prints.inventaire.date'), footer: t('prints.datePlaceholder') },
            ]}
          />
        </PrintSection>

        <PrintFooter />
      </div>
    </>
  );

  return createPortal(content, document.body);
};

export default PrintInventaireBiens;