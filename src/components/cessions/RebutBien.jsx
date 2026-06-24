import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppPage from '../ui/AppPage';
import PageHeader from '../ui/PageHeader';
import { biensService } from '../../services/biens';
import { cessionsService } from '../../services/cessions';
import { TrashIcon } from '@heroicons/react/24/outline';

const RebutBien = ({ embedded = false, bienId: bienIdProp, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bienIdFromUrl = bienIdProp || searchParams.get('bien_id');

  const [formData, setFormData] = useState({
    id_bien: bienIdFromUrl || '',
    date_rebut: new Date().toISOString().slice(0, 10),
    motif: '',
  });
  const [bien, setBien] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (bienIdFromUrl) loadBien(bienIdFromUrl);
  }, [bienIdFromUrl]);

  const loadBien = async (id) => {
    try {
      const data = await biensService.getById(id);
      setBien(data);
      setFormData((prev) => ({ ...prev, id_bien: id }));
    } catch {
      setError('Impossible de charger le bien');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await cessionsService.mettreAuRebut({
        id_bien: Number(formData.id_bien),
        date_rebut: formData.date_rebut,
        motif: formData.motif,
      });
      setSuccess('Bien mis au rebut. Écriture comptable de sortie générée.');
      if (onClose) {
        setTimeout(() => onClose(true), 1500);
      } else {
        setTimeout(() => navigate(`/biens/${formData.id_bien}`), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const form = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!bienIdFromUrl && (
        <div>
          <label className="form-label">ID du bien *</label>
          <input
            type="number"
            className="form-input w-full"
            value={formData.id_bien}
            onChange={(e) => {
              setFormData({ ...formData, id_bien: e.target.value });
              if (e.target.value) loadBien(e.target.value);
            }}
            required
          />
        </div>
      )}
      {bien && (
        <p className="text-sm text-gray-500">
          {bien.marque || bien.fabricant} {bien.modele} — Statut : {bien.statut_comptable || 'ACTIF'}
        </p>
      )}
      <div>
        <label className="form-label">Date de mise au rebut</label>
        <input
          type="date"
          className="form-input w-full"
          value={formData.date_rebut}
          onChange={(e) => setFormData({ ...formData, date_rebut: e.target.value })}
        />
      </div>
      <div>
        <label className="form-label">Motif *</label>
        <textarea
          className="form-input w-full"
          rows={3}
          value={formData.motif}
          onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
          required
          minLength={3}
          placeholder="Raison de la mise au rebut..."
        />
      </div>
      <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
        Une écriture de sortie (654 / compte immobilisation) sera générée. Le statut comptable passera à MIS_AU_REBUT.
      </p>
      {error && <div className="alert-error text-sm">{error}</div>}
      {success && <div className="text-green-700 text-sm">{success}</div>}
      <div className="flex gap-2 justify-end">
        <button type="button" className="btn-secondary" onClick={() => (onClose ? onClose(false) : navigate(-1))}>
          Annuler
        </button>
        <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700" disabled={loading}>
          {loading ? 'Traitement...' : 'Confirmer la mise au rebut'}
        </button>
      </div>
    </form>
  );

  if (embedded) return form;

  return (
    <AppPage>
      <PageHeader title="Mise au rebut" subtitle="Sortie comptable définitive du bien" icon={TrashIcon} />
      <div className="app-card p-6 max-w-2xl">{form}</div>
    </AppPage>
  );
};

export default RebutBien;
