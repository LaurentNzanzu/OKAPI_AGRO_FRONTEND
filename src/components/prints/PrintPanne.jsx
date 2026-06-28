// frontend/src/components/prints/PrintPanne.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PrintHeader from '../common/PrintHeader';
import PrintFooter from '../common/PrintFooter';
import { pannesService } from '../../services/pannes';
import { biensService } from '../../services/biens';
import { formatDate, formatPrice } from '../../utils/formatters';
import { useTranslation } from '../../context/LanguageContext';
import { PrintLoading, PrintError, PrintButton } from './PrintLayout';

const PrintPanne = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [panne, setPanne] = useState(null);
  const [bien, setBien] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const panneData = await pannesService.getById(id);
        setPanne(panneData);
        
        if (panneData.id_bien) {
          const bienData = await biensService.getById(panneData.id_bien);
          setBien(bienData);
        }
      } catch (err) {
        setError(err.response?.data?.detail || t('prints.loadError'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, t]);

  if (loading) return <PrintLoading message="Chargement de la fiche panne..." />;
  if (error || !panne) return <PrintError message={error || t('prints.noData')} />;

  const getTypeLabel = (type) => {
    const labels = {
      MECANIQUE: 'Mécanique',
      ELECTRIQUE: 'Électrique',
      ELECTRONIQUE: 'Électronique',
      AUTRE: 'Autre'
    };
    return labels[type] || type;
  };

  const getStatutLabel = (statut) => {
    const labels = {
      DECLAREE: 'Déclarée',
      DIAGNOSTIQUEE: 'Diagnostiquée',
      EN_ATTENTE_PIECES: 'En attente pièces',
      EN_VALIDATION: 'En validation',
      EN_COURS: 'En cours',
      EN_TEST: 'En test',
      TERMINEE: 'Terminée',
      ANNULEE: 'Annulée'
    };
    return labels[statut] || statut;
  };

  const getPrioriteLabel = (priorite) => {
    const labels = {
      BASSE: 'Basse',
      MOYENNE: 'Moyenne',
      HAUTE: 'Haute',
      CRITIQUE: 'Critique'
    };
    return labels[priorite] || priorite;
  };

  const getStatutColor = (statut) => {
    const colors = {
      DECLAREE: 'bg-yellow-100 text-yellow-800',
      DIAGNOSTIQUEE: 'bg-blue-100 text-blue-800',
      EN_ATTENTE_PIECES: 'bg-orange-100 text-orange-800',
      EN_VALIDATION: 'bg-purple-100 text-purple-800',
      EN_COURS: 'bg-indigo-100 text-indigo-800',
      EN_TEST: 'bg-cyan-100 text-cyan-800',
      TERMINEE: 'bg-green-100 text-green-800',
      ANNULEE: 'bg-gray-100 text-gray-800'
    };
    return colors[statut] || 'bg-gray-100 text-gray-800';
  };

  const demandeurNom = panne.demandeur 
    ? `${panne.demandeur.prenom || ''} ${panne.demandeur.nom || ''}`.trim() 
    : 'N/A';

  return (
    <div className="print-area max-w-4xl mx-auto p-8 bg-white text-gray-900">
      <div className="no-print mb-4 flex justify-end gap-2">
        <PrintButton onClick={() => window.print()}>Imprimer</PrintButton>
        <PrintButton variant="secondary" onClick={() => window.close()}>Fermer</PrintButton>
      </div>

      <PrintHeader
        title="FICHE DE PANNE"
        subtitle={`Panne #${panne.id_panne}`}
        documentRef={`PANNE-${panne.id_panne}`}
      />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-gray-600 text-sm uppercase tracking-wider mb-2">Informations générales</h3>
          <div className="space-y-1 text-sm">
            <p><span className="text-gray-500">N° Panne :</span> #{panne.id_panne}</p>
            <p><span className="text-gray-500">Date déclaration :</span> {formatDate(panne.date_declaration)}</p>
            <p><span className="text-gray-500">Statut :</span> <span className={`px-2 py-0.5 rounded-full text-xs ${getStatutColor(panne.statut)}`}>{getStatutLabel(panne.statut)}</span></p>
            <p><span className="text-gray-500">Priorité :</span> {getPrioriteLabel(panne.priorite)}</p>
            <p><span className="text-gray-500">Type :</span> {panne.type_panne_personnalise || getTypeLabel(panne.type_panne)}</p>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-gray-600 text-sm uppercase tracking-wider mb-2">Demandeur / Technicien</h3>
          <div className="space-y-1 text-sm">
            <p><span className="text-gray-500">Technicien :</span> {demandeurNom}</p>
            <p><span className="text-gray-500">ID Technicien :</span> {panne.id_technicien || 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-600 text-sm uppercase tracking-wider mb-2">Bien concerné</h3>
        {bien ? (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p><span className="text-gray-500">Désignation :</span> {bien.marque || bien.fabricant} {bien.modele}</p>
            <p><span className="text-gray-500">Type :</span> {bien.type_bien}</p>
            <p><span className="text-gray-500">N° Série / Immat :</span> {bien.numero_serie || bien.immatriculation || 'N/A'}</p>
            <p><span className="text-gray-500">Localisation :</span> {bien.localisation?.nom_localisation || bien.localisation || 'N/A'}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Bien non disponible</p>
        )}
      </div>

      <div className="border rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-600 text-sm uppercase tracking-wider mb-2">Diagnostic du technicien</h3>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{panne.diagnostic || 'Aucun diagnostic enregistré'}</p>
      </div>

      {panne.solution_apportee && (
        <div className="border rounded-lg p-4 mb-6 border-green-200 bg-green-50">
          <h3 className="font-semibold text-green-700 text-sm uppercase tracking-wider mb-2">Solution apportée</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{panne.solution_apportee}</p>
        </div>
      )}

      {panne.cout_total_reparation > 0 && (
        <div className="border rounded-lg p-4 mb-6 border-blue-200 bg-blue-50">
          <h3 className="font-semibold text-blue-700 text-sm uppercase tracking-wider mb-2">Coût de réparation</h3>
          <p className="text-lg font-bold text-blue-700">{formatPrice(panne.cout_total_reparation)} USD</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mt-8 pt-4 border-t">
        <div className="text-center">
          <p className="text-xs text-gray-400 uppercase">Le Technicien</p>
          <div className="h-12"></div>
          <p className="text-sm text-gray-500">({demandeurNom})</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 uppercase">Le Responsable</p>
          <div className="h-12"></div>
          <p className="text-sm text-gray-500">(Cachet et signature)</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 uppercase">Date</p>
          <div className="h-12"></div>
          <p className="text-sm text-gray-500">____ / ____ / ______</p>
        </div>
      </div>

      <PrintFooter />
    </div>
  );
};

export default PrintPanne;