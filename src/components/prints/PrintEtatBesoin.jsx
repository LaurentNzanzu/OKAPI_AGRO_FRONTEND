import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PrintHeader from '../common/PrintHeader';
import PrintFooter from '../common/PrintFooter';
import etatsService from '../../services/etats';
import { formatPrice } from '../../utils/formatters';
import { useTranslation } from '../../context/LanguageContext';

const PrintEtatBesoin = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await etatsService.getEtatBesoinData(id);
        setData(result);
      } catch (err) {
        setError(err.response?.data?.detail || t('prints.etatBesoin.loadError'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, t]);

  if (loading) {
    return <div className="p-8 text-center">{t('prints.etatBesoin.loading')}</div>;
  }

  if (error || !data) {
    return <div className="p-8 text-center text-red-600">{error || t('prints.noData')}</div>;
  }

  const { besoin, panne, bien, lignes, circuit_validation, technicien } = data;

  return (
    <div className="print-area p-6 max-w-4xl mx-auto bg-white text-gray-900" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
      <div className="no-print mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800"
        >
          {t('prints.print')}
        </button>
      </div>

      <PrintHeader
        title={t('prints.etatBesoin.title')}
        subtitle={bien ? `${bien.designation} • ${t('prints.etatBesoin.breakdown')} #${panne?.id_panne}` : `${t('prints.etatBesoin.breakdown')} #${panne?.id_panne || '-'}`}
        documentRef={besoin.numero_demande}
      />

      <section className="mb-5">
        <h2 className="text-sm font-bold text-green-800 uppercase border-b border-gray-200 pb-1 mb-3">
          {t('prints.etatBesoin.section1')}
        </h2>
        <table className="w-full text-sm">
          <tbody>
            <tr>
              <td className="font-semibold text-gray-600 py-1 w-1/4">{t('prints.etatBesoin.requestNum')}</td>
              <td className="py-1">{besoin.numero_demande}</td>
              <td className="font-semibold text-gray-600 py-1 w-1/4">{t('prints.etatBesoin.creationDate')}</td>
              <td className="py-1">{besoin.date_creation}</td>
            </tr>
            <tr>
              <td className="font-semibold text-gray-600 py-1">{t('prints.etatBesoin.status')}</td>
              <td className="py-1">{besoin.statut}</td>
              <td className="font-semibold text-gray-600 py-1">{t('prints.etatBesoin.totalAmount')}</td>
              <td className="py-1 font-bold">{formatPrice(besoin.montant_total)}</td>
            </tr>
            <tr>
              <td className="font-semibold text-gray-600 py-1">{t('prints.etatBesoin.technician')}</td>
              <td className="py-1">{technicien}</td>
              <td className="font-semibold text-gray-600 py-1">{t('prints.etatBesoin.breakdown')}</td>
              <td className="py-1">#{panne?.id_panne || '-'}</td>
            </tr>
            {besoin.observations && (
              <tr>
                <td className="font-semibold text-gray-600 py-1 align-top">{t('prints.etatBesoin.observations')}</td>
                <td className="py-1" colSpan={3}>{besoin.observations}</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {bien && (
        <section className="mb-5">
          <h2 className="text-sm font-bold text-green-800 uppercase border-b border-gray-200 pb-1 mb-3">
            {t('prints.etatBesoin.section2')}
          </h2>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="font-semibold text-gray-600 py-1 w-1/4">{t('prints.etatBesoin.qrCode')}</td>
                <td className="py-1 font-mono">{bien.qr_code}</td>
                <td className="font-semibold text-gray-600 py-1 w-1/4">{t('prints.etatBesoin.type')}</td>
                <td className="py-1">{bien.type_bien}</td>
              </tr>
              <tr>
                <td className="font-semibold text-gray-600 py-1">{t('prints.etatBesoin.designation')}</td>
                <td className="py-1">{bien.designation}</td>
                <td className="font-semibold text-gray-600 py-1">{t('prints.etatBesoin.location')}</td>
                <td className="py-1">{bien.localisation || '-'}</td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      <section className="mb-5">
        <h2 className="text-sm font-bold text-green-800 uppercase border-b border-gray-200 pb-1 mb-3">
          {t('prints.etatBesoin.section3')}
        </h2>
        <table className="data-table w-full text-sm border-collapse">
          <thead>
            <tr className="bg-green-50">
              <th className="border border-gray-200 px-2 py-2 text-left">{t('prints.etatBesoin.colReference')}</th>
              <th className="border border-gray-200 px-2 py-2 text-left">{t('prints.etatBesoin.colDesignation')}</th>
              <th className="border border-gray-200 px-2 py-2 text-center">{t('prints.etatBesoin.colQty')}</th>
              <th className="border border-gray-200 px-2 py-2 text-center">{t('prints.etatBesoin.colStock')}</th>
              <th className="border border-gray-200 px-2 py-2 text-right">{t('prints.etatBesoin.colUnitPrice')}</th>
              <th className="border border-gray-200 px-2 py-2 text-right">{t('prints.etatBesoin.colTotal')}</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((ligne, idx) => (
              <tr key={idx}>
                <td className="border border-gray-200 px-2 py-2 font-mono">{ligne.reference}</td>
                <td className="border border-gray-200 px-2 py-2">{ligne.designation}</td>
                <td className="border border-gray-200 px-2 py-2 text-center">{ligne.quantite}</td>
                <td className="border border-gray-200 px-2 py-2 text-center">{ligne.stock_actuel}</td>
                <td className="border border-gray-200 px-2 py-2 text-right">{formatPrice(ligne.prix_unitaire)}</td>
                <td className="border border-gray-200 px-2 py-2 text-right">{formatPrice(ligne.prix_total)}</td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-bold">
              <td className="border border-gray-200 px-2 py-2 text-right" colSpan={5}>
                {t('prints.etatBesoin.total')}
              </td>
              <td className="border border-gray-200 px-2 py-2 text-right">{formatPrice(besoin.montant_total)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mb-5">
        <h2 className="text-sm font-bold text-green-800 uppercase border-b border-gray-200 pb-1 mb-3">
          {t('prints.etatBesoin.section4')}
        </h2>
        <table className="data-table w-full text-sm border-collapse">
          <thead>
            <tr className="bg-green-50">
              <th className="border border-gray-200 px-2 py-2 text-left">{t('prints.etatBesoin.colStep')}</th>
              <th className="border border-gray-200 px-2 py-2 text-left">{t('prints.etatBesoin.colValidator')}</th>
              <th className="border border-gray-200 px-2 py-2 text-left">{t('prints.etatBesoin.colDecision')}</th>
              <th className="border border-gray-200 px-2 py-2 text-left">{t('prints.etatBesoin.colDate')}</th>
            </tr>
          </thead>
          <tbody>
            {circuit_validation.map((etape) => (
              <tr key={etape.ordre}>
                <td className="border border-gray-200 px-2 py-2">{etape.libelle}</td>
                <td className="border border-gray-200 px-2 py-2">{etape.validateur || '—'}</td>
                <td className={`border border-gray-200 px-2 py-2 ${etape.decision === 'REJETE' ? 'text-red-600 font-semibold' : ''}`}>
                  {etape.decision}
                </td>
                <td className="border border-gray-200 px-2 py-2">{etape.date || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-bold text-green-800 uppercase border-b border-gray-200 pb-1 mb-3">
          {t('prints.etatBesoin.section5')}
        </h2>
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div className="border border-gray-200 p-4 min-h-[100px]">
            <p className="font-semibold mb-8">{t('prints.etatBesoin.requestingTechnician')}</p>
            <p>{technicien}</p>
            <p className="mt-6 border-t border-gray-400 pt-2">{t('prints.etatBesoin.signature')}</p>
          </div>
          <div className="border border-gray-200 p-4 min-h-[100px]">
            <p className="font-semibold mb-12">{t('prints.etatBesoin.storekeeper')}</p>
            <p className="mt-6 border-t border-gray-400 pt-2">{t('prints.etatBesoin.signature')}</p>
          </div>
          <div className="border border-gray-200 p-4 min-h-[100px]">
            <p className="font-semibold mb-12">{t('prints.etatBesoin.exitDate')}</p>
            <p className="mt-6">{t('prints.datePlaceholder')}</p>
          </div>
        </div>
      </section>

      <PrintFooter />
    </div>
  );
};

export default PrintEtatBesoin;
