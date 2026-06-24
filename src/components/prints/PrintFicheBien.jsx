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

const PrintFicheBien = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

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

  useEffect(() => {
    etatsService
      .getFicheBienData(id)
      .then(setData)
      .catch((err) => setError(err.response?.data?.detail || t('prints.loadError')))
      .finally(() => setLoading(false));
  }, [id, t]);

  const handleExportPdf = async () => {
    try {
      setExporting(true);
      await etatsService.exportFicheBien(id);
    } catch (err) {
      alert(err.message || t('prints.pdfError'));
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <PrintLoading message={t('prints.ficheBien.loading')} />;
  if (error || !data) return <PrintError message={error || t('prints.noData')} />;

  const { bien, composants, valeur_composants, valeur_structure, maintenances_recentes, pannes_recentes } = data;
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
        title={t('prints.ficheBien.title')}
        subtitle={`${getTypeLabel(bien.type_bien) || bien.type_bien} • ${designation || t('prints.ficheBien.assetPrefix', { id: bien.id_bien })}`}
        documentRef={bien.qr_code}
      />

      <PrintSection title={t('prints.ficheBien.section1')}>
        <PrintKeyValueGrid
          items={[
            [
              { label: t('prints.ficheBien.type'), value: getTypeLabel(bien.type_bien) || bien.type_bien },
              { label: t('prints.ficheBien.state'), value: getEtatLabel(bien.etat) || bien.etat },
            ],
            [
              { label: t('prints.ficheBien.designation'), value: designation || '—' },
              { label: t('prints.ficheBien.serial'), value: bien.numero_serie || '—' },
            ],
            [
              { label: t('prints.ficheBien.qrCode'), value: bien.qr_code || '—' },
              { label: t('prints.ficheBien.location'), value: bien.localisation || '—' },
            ],
            [
              { label: t('prints.ficheBien.age'), value: t('prints.ficheBien.years', { count: bien.age_ans || 0 }) },
              { label: t('prints.ficheBien.description'), value: bien.description || '—' },
            ],
          ]}
        />
      </PrintSection>

      <PrintSection title={t('prints.ficheBien.section2')}>
        <PrintKeyValueGrid
          items={[
            [
              { label: t('prints.ficheBien.acquisitionDate'), value: bien.date_acquisition || '—' },
              { label: t('prints.ficheBien.acquisitionPrice'), value: `${formatPrice(bien.prix_acquisition)} USD` },
            ],
            [
              { label: t('prints.ficheBien.structureValue'), value: `${formatPrice(valeur_structure)} USD` },
              { label: t('prints.ficheBien.componentsValue'), value: `${formatPrice(valeur_composants)} USD` },
            ],
          ]}
        />
      </PrintSection>

      {composants?.length > 0 && (
        <PrintSection title={t('prints.ficheBien.section3')}>
          <PrintDataTable
            columns={[
              { key: 'designation', label: t('prints.ficheBien.colDesignation') },
              { key: 'valeur', label: t('prints.ficheBien.colValue') },
              { key: 'duree_vie_ans', label: t('prints.ficheBien.colDuration') },
              { key: 'date_remplacement', label: t('prints.ficheBien.colReplacement') },
            ]}
            rows={composants.map((c) => ({
              designation: c.designation,
              valeur: formatPrice(c.valeur),
              duree_vie_ans: c.duree_vie_ans ?? '—',
              date_remplacement: c.date_remplacement || '—',
            }))}
          />
        </PrintSection>
      )}

      {maintenances_recentes?.length > 0 && (
        <PrintSection title={composants?.length ? t('prints.ficheBien.section4') : t('prints.ficheBien.section3alt')}>
          <PrintDataTable
            columns={[
              { key: 'date', label: t('prints.ficheBien.colDate') },
              { key: 'type', label: t('prints.ficheBien.colType') },
              { key: 'cout', label: t('prints.ficheBien.colCost') },
            ]}
            rows={maintenances_recentes.map((m) => ({
              date: m.date,
              type: m.type,
              cout: formatPrice(m.cout),
            }))}
          />
        </PrintSection>
      )}

      {pannes_recentes?.length > 0 && (
        <PrintSection title={t('prints.ficheBien.recentBreakdowns')}>
          <PrintDataTable
            columns={[
              { key: 'date', label: t('prints.ficheBien.colDate') },
              { key: 'type', label: t('prints.ficheBien.colType') },
              { key: 'statut', label: t('prints.ficheBien.colStatut') },
            ]}
            rows={pannes_recentes}
          />
        </PrintSection>
      )}

      <PrintSection title={t('prints.ficheBien.signatures')}>
        <PrintSignatures
          items={[
            { label: t('prints.ficheBien.assetManager'), footer: t('prints.signature') },
            { label: t('prints.ficheBien.techService'), footer: t('prints.signature') },
            { label: t('prints.ficheBien.date'), footer: t('prints.datePlaceholder') },
          ]}
        />
      </PrintSection>

      <PrintFooter />
    </div>
  );
};

export default PrintFicheBien;
