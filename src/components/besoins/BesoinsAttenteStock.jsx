import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import AppPage from '../ui/AppPage';
import PageHeader from '../ui/PageHeader';
import LoadingSpinner from '../ui/LoadingSpinner';
import { besoinsService } from '../../services/besoins';
import { piecesService } from '../../services/pieces';
import { formatDate, formatPrice } from '../../utils/formatters';
import { getStatutBesoinLabel, BADGE_COLORS, getStatutBesoinColor } from '../../utils/workflowEnums';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const BesoinsAttenteStock = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [besoins, setBesoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [piecesInfo, setPiecesInfo] = useState({});

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await besoinsService.getEnAttenteStock();
      setBesoins(data);
      const info = {};
      for (const b of data) {
        if (b.lignes) {
          for (const l of b.lignes) {
            try {
              const p = await piecesService.getById(l.id_piece);
              info[`${b.id_besoin}-${l.id_piece}`] = p;
            } catch {
              /* ignore */
            }
          }
        }
      }
      setPiecesInfo(info);
    } catch (err) {
      setError(err.response?.data?.detail || 'Impossible de charger les besoins');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Chargement..." />;

  return (
    <AppPage>
      <PageHeader
        title="Besoins en attente de stock"
        subtitle="Besoins approuvés bloqués par manque de pièces"
        icon={ExclamationTriangleIcon}
      />

      {error && <div className="alert-error mb-4">{error}</div>}

      {besoins.length === 0 ? (
        <div className="app-card text-center py-12 text-gray-500">Aucun besoin en attente de stock</div>
      ) : (
        <div className="app-card overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>N° besoin</th>
                <th>Date</th>
                <th>Montant</th>
                <th>Pièces manquantes</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {besoins.map((b) => {
                const colorKey = getStatutBesoinColor(b.statut);
                const manquantes = (b.lignes || []).map((l) => {
                  const p = piecesInfo[`${b.id_besoin}-${l.id_piece}`];
                  const stock = p?.stock_actuel ?? 0;
                  if (stock >= l.quantite) return null;
                  return `${p?.designation || `Pièce #${l.id_piece}`}: stock ${stock} / demandé ${l.quantite}`;
                }).filter(Boolean);

                return (
                  <tr key={b.id_besoin}>
                    <td>{b.numero_demande}</td>
                    <td>{formatDate(b.date_creation)}</td>
                    <td>{formatPrice(b.montant_total)}</td>
                    <td className="text-sm max-w-xs">
                      {manquantes.length ? manquantes.join('; ') : '—'}
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${BADGE_COLORS[colorKey]}`}>
                        {getStatutBesoinLabel(b.statut)}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="text-primary-600 text-sm hover:underline"
                        onClick={() => navigate(`/besoins/${b.id_besoin}`)}
                      >
                        Voir le détail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppPage>
  );
};

export default BesoinsAttenteStock;
