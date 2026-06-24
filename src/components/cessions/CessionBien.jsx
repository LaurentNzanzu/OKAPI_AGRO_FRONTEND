import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppPage from '../ui/AppPage';
import PageHeader from '../ui/PageHeader';
import { biensService } from '../../services/biens';
import { cessionsService } from '../../services/cessions';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';

const CessionBien = ({ embedded = false, bienId: bienIdProp, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bienIdFromUrl = bienIdProp || searchParams.get('bien_id');

  const [formData, setFormData] = useState({
    id_bien: bienIdFromUrl || '',
    prix_vente: '',
    valeur_nette_comptable: '',
    type_cession: 'courante',
    date_cession: new Date().toISOString().slice(0, 10),
    acheteur: '',
    mode_reglement: 'credit',
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
      const brut = parseFloat(data.prix_acquisition || 0);
      const cumulAmo = parseFloat(data.cumul_amortissement || 0);
      const cumulDep = parseFloat(data.cumul_depreciation || 0);
      const vnc = Math.max(0, brut - cumulAmo - cumulDep);
      setFormData((prev) => ({
        ...prev,
        id_bien: id,
        prix_vente: prev.prix_vente || brut,
        valeur_nette_comptable: vnc,
      }));
    } catch {
      setError('Impossible de charger le bien');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await cessionsService.creer({
        id_bien: Number(formData.id_bien),
        prix_vente: parseFloat(formData.prix_vente),
        valeur_nette_comptable: parseFloat(formData.valeur_nette_comptable),
        type_cession: formData.type_cession,
        date_cession: formData.date_cession,
        acheteur: formData.acheteur || null,
        mode_reglement: formData.mode_reglement,
        motif: formData.motif || null,
      });
      const nbEcritures = result.ecritures?.length || 0;
      setSuccess(`${result.message || 'Cession enregistrée'} (${nbEcritures} écriture(s))`);
      if (onClose) {
        setTimeout(() => onClose(true), 1500);
      } else {
        setTimeout(() => navigate('/amortissements/ecritures'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Erreur lors de la cession');
    } finally {
      setLoading(false);
    }
  };

  const comptesInfo =
    formData.type_cession === 'non_courante'
      ? 'VNC : 81 — Produit : 82 — Résultat : 775'
      : 'VNC : 654 — Produit : 754';

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
          {bien.marque || bien.fabricant} {bien.modele} — Acquisition : {bien.prix_acquisition} FCFA
        </p>
      )}

      <div>
        <label className="form-label block mb-2">Type de cession *</label>
        <div className="flex flex-col sm:flex-row gap-3" role="radiogroup" aria-label="Type de cession">
          <label className="flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-3 flex-1">
            <input
              type="radio"
              name="type_cession"
              value="courante"
              checked={formData.type_cession === 'courante'}
              onChange={(e) => setFormData({ ...formData, type_cession: e.target.value })}
            />
            <span><strong>Courante</strong><span className="block text-xs text-gray-500">654 / 754</span></span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-3 flex-1">
            <input
              type="radio"
              name="type_cession"
              value="non_courante"
              checked={formData.type_cession === 'non_courante'}
              onChange={(e) => setFormData({ ...formData, type_cession: e.target.value })}
            />
            <span><strong>Non courante</strong><span className="block text-xs text-gray-500">81 / 82</span></span>
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-2">{comptesInfo}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Prix de vente (FCFA) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="form-input w-full"
            value={formData.prix_vente}
            onChange={(e) => setFormData({ ...formData, prix_vente: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="form-label">VNC (FCFA) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="form-input w-full"
            value={formData.valeur_nette_comptable}
            onChange={(e) => setFormData({ ...formData, valeur_nette_comptable: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Acheteur</label>
          <input
            type="text"
            className="form-input w-full"
            value={formData.acheteur}
            onChange={(e) => setFormData({ ...formData, acheteur: e.target.value })}
          />
        </div>
        <div>
          <label className="form-label">Mode de règlement</label>
          <select
            className="form-input w-full"
            value={formData.mode_reglement}
            onChange={(e) => setFormData({ ...formData, mode_reglement: e.target.value })}
          >
            <option value="credit">Crédit (411)</option>
            <option value="comptant">Comptant (512)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="form-label">Date de cession</label>
        <input
          type="date"
          className="form-input w-full"
          value={formData.date_cession}
          onChange={(e) => setFormData({ ...formData, date_cession: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="form-label">Motif (optionnel)</label>
        <textarea
          className="form-input w-full"
          rows={2}
          value={formData.motif}
          onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
        />
      </div>

      {error && <div className="alert-error text-sm">{error}</div>}
      {success && <div className="text-green-700 text-sm">{success}</div>}

      <div className="flex gap-2 justify-end">
        <button type="button" className="btn-secondary" onClick={() => (onClose ? onClose(false) : navigate(-1))}>
          Annuler
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Enregistrement...' : 'Enregistrer la cession'}
        </button>
      </div>
    </form>
  );

  if (embedded) return form;

  return (
    <AppPage>
      <PageHeader title="Cession de bien" subtitle="3 écritures comptables OHADA" icon={CurrencyDollarIcon} />
      <div className="app-card p-6 max-w-2xl">{form}</div>
    </AppPage>
  );
};

export default CessionBien;
