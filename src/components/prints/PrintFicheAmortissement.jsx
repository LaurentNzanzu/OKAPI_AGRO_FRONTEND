import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PrintHeader from '../common/PrintHeader';
import PrintFooter from '../common/PrintFooter';
import etatsService from '../../services/etats';
import { formatPrice } from '../../utils/formatters';
import { useTranslation } from '../../context/LanguageContext';
import {
  printPageClass,
  printPageStyle,
  PrintSection,
  PrintKeyValueGrid,
  PrintDataTable,
  PrintSignatures,
  PrintActionBar,
  PrintButton,
  PrintLoading,
  PrintError,
} from './PrintLayout';

const PrintFicheAmortissement = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    etatsService
      .getFicheAmortissementData(id)
      .then(setData)
      .catch((err) => setError(err.response?.data?.detail || t('prints.loadError')))
      .finally(() => setLoading(false));
  }, [id, t]);

  const handleExportPdf = async () => {
    try {
      setExporting(true);
      await etatsService.exportFicheAmortissement(id);
    } catch (err) {
      alert(err.message || t('prints.pdfError'));
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <PrintLoading message={t('prints.ficheAmortissement.loading')} />;
  if (error || !data) return <PrintError message={error || t('prints.noData')} />;

  const { bien, amortissement, plan_amortissement, ecritures_comptables, statistiques } = data;
  const designation = `${bien.marque_fabricant || ''} ${bien.modele || ''}`.trim();

  return (
    <div className={printPageClass} style={printPageStyle}>
      <PrintActionBar>
        <PrintButton onClick={() => window.print()}>{t('prints.print')}</PrintButton>
        <PrintButton variant="secondary" onClick={handleExportPdf} disabled={exporting}>
          {exporting ? t('prints.generating') : t('prints.downloadPdf')}
        </PrintButton>
      </PrintActionBar>

      <PrintHeader
        title={t('prints.ficheAmortissement.title')}
        subtitle={`${(bien.type_bien || '').toUpperCase()} • ${designation || t('prints.ficheAmortissement.assetPrefix', { id: bien.id_bien })}`}
        documentRef={bien.qr_code}
      />

      <PrintSection title={t('prints.ficheAmortissement.section1')}>
        <PrintKeyValueGrid
          items={[
            [
              { label: t('prints.ficheAmortissement.designation'), value: designation || '—' },
              { label: t('prints.ficheAmortissement.type'), value: bien.type_bien || '—' },
            ],
            [
              { label: t('prints.ficheAmortissement.location'), value: bien.localisation || '—' },
              { label: t('prints.ficheAmortissement.state'), value: bien.etat || '—' },
            ],
            [
              { label: t('prints.ficheAmortissement.acquisitionDate'), value: bien.date_acquisition || '—' },
              { label: t('prints.ficheAmortissement.originValue'), value: `${formatPrice(bien.prix_acquisition)} USD` },
            ],
          ]}
        />
      </PrintSection>

      <PrintSection title={t('prints.ficheAmortissement.section2')}>
        <PrintKeyValueGrid
          items={[
            [
              { label: t('prints.ficheAmortissement.method'), value: amortissement.methode || '—' },
              { label: t('prints.ficheAmortissement.exercice'), value: String(amortissement.exercice_en_cours || '—') },
            ],
            [
              { label: t('prints.ficheAmortissement.accountingRate'), value: `${amortissement.taux_comptable || 0}%` },
              { label: t('prints.ficheAmortissement.fiscalRate'), value: `${amortissement.taux_fiscal || 0}%` },
            ],
            [
              { label: t('prints.ficheAmortissement.accountingDuration'), value: t('prints.ficheAmortissement.years', { count: amortissement.duree_vie_comptable_ans || 0 }) },
              { label: t('prints.ficheAmortissement.fiscalDuration'), value: t('prints.ficheAmortissement.years', { count: amortissement.duree_vie_fiscale_ans || 0 }) },
            ],
            [
              { label: t('prints.ficheAmortissement.startDate'), value: amortissement.date_debut || '—' },
              { label: t('prints.ficheAmortissement.status'), value: amortissement.statut || '—' },
            ],
          ]}
        />
      </PrintSection>

      <PrintSection title={t('prints.ficheAmortissement.section3')}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {[
            { label: t('prints.ficheAmortissement.originValue'), value: formatPrice(amortissement.valeur_origine) },
            { label: t('prints.ficheAmortissement.cumulAmorti'), value: formatPrice(amortissement.cumul_amorti) },
            { label: t('prints.ficheAmortissement.currentVnc'), value: formatPrice(amortissement.vnc_actuelle) },
            { label: t('prints.ficheAmortissement.progression'), value: `${statistiques?.pourcentage_amorti || 0}%` },
          ].map((card) => (
            <div key={card.label} className="border border-green-100 bg-green-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600">{card.label}</p>
              <p className="font-bold text-green-900">{card.value}</p>
            </div>
          ))}
        </div>
        <PrintKeyValueGrid
          items={[
            [
              { label: t('prints.ficheAmortissement.residualValue'), value: `${formatPrice(amortissement.valeur_residuelle)} USD` },
              { label: t('prints.ficheAmortissement.remainingYears'), value: String(statistiques?.annees_restantes ?? '—') },
            ],
          ]}
        />
      </PrintSection>

      {plan_amortissement?.length > 0 && (
        <PrintSection title={t('prints.ficheAmortissement.section4')}>
          <PrintDataTable
            columns={[
              { key: 'annee', label: t('prints.ficheAmortissement.colAnnee'), align: 'center' },
              { key: 'vnc_debut', label: t('prints.ficheAmortissement.colVncDebut'), align: 'right' },
              { key: 'annuite', label: t('prints.ficheAmortissement.colAnnuite'), align: 'right' },
              { key: 'cumul', label: t('prints.ficheAmortissement.colCumul'), align: 'right' },
              { key: 'vnc_fin', label: t('prints.ficheAmortissement.colVncFin'), align: 'right' },
            ]}
            rows={plan_amortissement.map((p) => ({
              annee: p.annee,
              vnc_debut: formatPrice(p.vnc_debut),
              annuite: formatPrice(p.annuite),
              cumul: formatPrice(p.cumul),
              vnc_fin: formatPrice(p.vnc_fin),
            }))}
          />
        </PrintSection>
      )}

      {ecritures_comptables?.length > 0 && (
        <PrintSection title={t('prints.ficheAmortissement.section5')}>
          <PrintDataTable
            columns={[
              { key: 'date', label: t('prints.ficheAmortissement.date') },
              { key: 'type', label: t('prints.ficheAmortissement.type') },
              { key: 'compte_debit', label: t('prints.ficheAmortissement.colDebit'), mono: true },
              { key: 'compte_credit', label: t('prints.ficheAmortissement.colCredit'), mono: true },
              { key: 'montant', label: t('prints.ficheAmortissement.colMontant'), align: 'right' },
            ]}
            rows={ecritures_comptables.map((e) => ({
              date: e.date,
              type: e.type,
              compte_debit: e.compte_debit,
              compte_credit: e.compte_credit,
              montant: formatPrice(e.montant),
            }))}
          />
        </PrintSection>
      )}

      <PrintSection title={t('prints.ficheAmortissement.signatures')}>
        <PrintSignatures
          items={[
            { label: t('prints.ficheAmortissement.accountingService'), footer: t('prints.signature') },
            { label: t('prints.ficheAmortissement.generalManagement'), footer: t('prints.signature') },
            { label: t('prints.ficheAmortissement.date'), footer: t('prints.datePlaceholder') },
          ]}
        />
      </PrintSection>

      <PrintFooter />
    </div>
  );
};

export default PrintFicheAmortissement;
