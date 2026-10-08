import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AppPage from '../ui/AppPage';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PageLoader from '../common/PageLoader';
import chauffeursService from '../../services/chauffeurs';
import missionsService from '../../services/missions';
import affectationsService from '../../services/affectations';
import trajetsService from '../../services/trajets';
import { useAuth } from '../../context/AuthContext';

const RESOURCES = {
  chauffeurs: {
    title: 'Chauffeurs', service: chauffeursService,
    permission: 'CHAUFFEUR_GERER',
    fields: [
      { name: 'nom', label: 'Nom', required: true },
      { name: 'prenom', label: 'Prénom', required: true },
      { name: 'numero_permis', label: 'Numéro de permis', required: true },
      { name: 'telephone', label: 'Téléphone' },
      { name: 'date_expiration_permis', label: 'Expiration permis', type: 'date' },
      { name: 'utilisateur_id', label: 'Utilisateur (ID)', type: 'number' },
    ], columns: ['nom', 'prenom', 'numero_permis', 'telephone', 'date_expiration_permis', 'actif'],
  },
  missions: {
    title: 'Missions', service: missionsService,
    createPermission: 'MISSION_CREATE',
    permission: 'MISSION_VOIR',
    fields: [
      { name: 'description', label: 'Objet', required: true },
      { name: 'projet_id', label: 'Projet (ID)', type: 'number' },
      { name: 'lieu_depart', label: 'Lieu de départ' },
      { name: 'lieu_arrivee', label: 'Lieu d’arrivée' },
      { name: 'date_debut', label: 'Début', type: 'datetime-local' },
      { name: 'date_fin', label: 'Fin', type: 'datetime-local' },
    ], columns: ['id', 'description', 'lieu_depart', 'lieu_arrivee', 'statut'],
  },
  affectations: {
    title: 'Affectations', service: affectationsService,
    createPermission: 'MISSION_AFFECTER',
    permission: 'MISSION_VOIR',
    fields: [
      { name: 'mission_id', label: 'Mission (ID)', type: 'number', required: true },
      { name: 'vehicule_id', label: 'Véhicule (ID)', type: 'number' },
      { name: 'chauffeur_id', label: 'Chauffeur (ID)', type: 'number' },
      { name: 'date_debut', label: 'Début', type: 'datetime-local', required: true },
      { name: 'date_fin', label: 'Fin', type: 'datetime-local', required: true },
      { name: 'commentaire', label: 'Commentaire' },
    ], columns: ['id', 'mission_id', 'vehicule_id', 'chauffeur_id', 'date_debut', 'date_fin', 'statut'],
  },
  trajets: {
    title: 'Trajets', service: trajetsService,
    permission: 'TRAJET_GERER',
    fields: [
      { name: 'mission_id', label: 'Mission (ID)', type: 'number' },
      { name: 'vehicule_id', label: 'Véhicule (ID)', type: 'number' },
      { name: 'chauffeur_id', label: 'Chauffeur (ID)', type: 'number' },
      { name: 'date_debut', label: 'Début', type: 'datetime-local' },
      { name: 'date_fin', label: 'Fin', type: 'datetime-local' },
      { name: 'kilometrage_debut', label: 'Kilométrage départ', type: 'number' },
      { name: 'kilometrage_fin', label: 'Kilométrage arrivée', type: 'number' },
    ], columns: ['id', 'mission_id', 'vehicule_id', 'chauffeur_id', 'distance_km', 'statut'],
  },
};

const blankValues = (fields) => Object.fromEntries(fields.map(({ name }) => [name, '']));

const GestionFlotte = () => {
  const location = useLocation();
  const { hasPermission } = useAuth();
  const resourceKey = location.pathname.split('/')[1];
  const resource = RESOURCES[resourceKey];
  const canManage = resource && hasPermission(resource.permission);
  const canCreate = canManage || (resource?.createPermission && hasPermission(resource.createPermission));
  const [rows, setRows] = useState([]);
  const [values, setValues] = useState(() => blankValues(resource?.fields || []));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadRows = useCallback(async () => {
    if (!resource) return;
    setLoading(true);
    setError('');
    try {
      const result = await resource.service.list();
      setRows(Array.isArray(result) ? result : result?.items || []);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Impossible de charger les données.');
    } finally {
      setLoading(false);
    }
  }, [resource]);

  useEffect(() => {
    setValues(blankValues(resource?.fields || []));
    loadRows();
  }, [loadRows, resource]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = Object.fromEntries(Object.entries(values)
      .filter(([, value]) => value !== '')
      .map(([key, value]) => [key, ['projet_id', 'mission_id', 'vehicule_id', 'chauffeur_id', 'kilometrage_debut', 'kilometrage_fin'].includes(key) ? Number(value) : value]));
    try {
      await resource.service.create(payload);
      setValues(blankValues(resource.fields));
      await loadRows();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'La création a échoué.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Supprimer l’élément ${row.id}?`)) return;
    try {
      await resource.service.delete(row.id);
      await loadRows();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'La suppression a échoué.');
    }
  };

  if (!resource) return null;
  if (loading && rows.length === 0) return <PageLoader />;

  return (
    <AppPage>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-page-title text-gray-900 dark:text-slate-100">{resource.title}</h1>
          <p className="text-page-subtitle text-gray-500 dark:text-slate-400">{rows.length} enregistrement(s)</p>
        </div>
        <Button variant="secondary" onClick={loadRows} disabled={loading}>Actualiser</Button>
      </header>

      {error && <div className="alert-error mb-4" role="alert">{error}</div>}

      {canCreate && <Card compact>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {resource.fields.map((field) => (
            <label className="block" key={field.name}>
              <span className="form-label">{field.label}</span>
              <input
                className="form-input"
                type={field.type || 'text'}
                value={values[field.name]}
                required={field.required}
                onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
              />
            </label>
          ))}
          <div className="flex items-end"><Button type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Créer'}</Button></div>
        </form>
      </Card>}

      <Card noPadding>
        <div className="app-table-wrap">
          <table className="w-full text-sm">
            <thead className="border-b border-border-light text-left text-xs uppercase text-gray-500 dark:border-border-dark dark:text-slate-400">
              <tr>{resource.columns.map((column) => <th className="px-3 py-3" key={column}>{column.replaceAll('_', ' ')}</th>)}<th className="px-3 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {rows.map((row) => (
                <tr key={row.id}>
                  {resource.columns.map((column) => <td className="px-3 py-3" key={column}>{row[column] ?? '—'}</td>)}
                  <td className="px-3 py-3 text-right">{canManage && <button className="text-danger hover:underline" onClick={() => remove(row)}>Supprimer</button>}</td>
                </tr>
              ))}
              {!rows.length && <tr><td className="px-3 py-8 text-center text-gray-500" colSpan={resource.columns.length + 1}>Aucun enregistrement</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </AppPage>
  );
};

export default GestionFlotte;