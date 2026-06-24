import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import AppPage from '../ui/AppPage';
import PageHeader from '../ui/PageHeader';
import Card from '../ui/Card';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { getRoles, getPermissionsCatalog, getRolePermissions, updateRolePermissions } from '../../services/roles';
import { useLanguage } from '../../context/LanguageContext';

const PERMISSION_LABELS = {
  'dashboard.view': { fr: 'Voir le tableau de bord', en: 'View dashboard' },
  'users.view': { fr: 'Gérer les utilisateurs (consultation)', en: 'Manage users (view)' },
  'users.create': { fr: 'Créer un utilisateur', en: 'Create user' },
  'users.update': { fr: 'Modifier un utilisateur', en: 'Update user' },
  'users.delete': { fr: 'Supprimer un utilisateur', en: 'Delete user' },
  'users.permissions.manage': { fr: 'Gérer les permissions', en: 'Manage permissions' },
  'biens.view': { fr: 'Gérer les biens (consultation)', en: 'Manage assets (view)' },
  'biens.create': { fr: 'Créer un bien', en: 'Create asset' },
  'biens.update': { fr: 'Modifier un bien', en: 'Update asset' },
  'biens.delete': { fr: 'Supprimer un bien', en: 'Delete asset' },
  'pannes.view': { fr: 'Voir les pannes', en: 'View breakdowns' },
  'pannes.create': { fr: 'Créer une panne', en: 'Create breakdown' },
  'pannes.update': { fr: 'Modifier une panne', en: 'Update breakdown' },
  'pannes.close': { fr: 'Valider / clôturer une panne', en: 'Validate / close breakdown' },
  'maintenances.view': { fr: 'Gérer les maintenances', en: 'Manage maintenance' },
  'maintenances.create': { fr: 'Créer une maintenance', en: 'Create maintenance' },
  'maintenances.update': { fr: 'Modifier une maintenance', en: 'Update maintenance' },
  'maintenances.close': { fr: 'Clôturer une maintenance', en: 'Close maintenance' },
  'amortissements.view': { fr: 'Gérer les amortissements', en: 'Manage depreciation' },
  'amortissements.generate': { fr: 'Générer un amortissement', en: 'Generate depreciation' },
  'amortissements.update': { fr: 'Modifier les règles', en: 'Update rules' },
  'amortissements.ecritures': { fr: 'Écritures comptables', en: 'Accounting entries' },
  'validations.view': { fr: 'Voir les validations', en: 'View validations' },
  'validations.validate': { fr: 'Valider une demande', en: 'Validate request' },
  'pieces.view': { fr: 'Voir les pièces / scanner', en: 'View parts / scan' },
  'pieces.create': { fr: 'Créer une pièce', en: 'Create part' },
  'pieces.update': { fr: 'Modifier une pièce', en: 'Update part' },
  'pieces.stock.manage': { fr: 'Gérer le stock', en: 'Manage stock' },
  'rapports.view': { fr: 'Voir les rapports', en: 'View reports' },
  'rapports.export': { fr: 'Exporter les rapports', en: 'Export reports' },
  'rapports.financiers.view': { fr: 'Rapport financier', en: 'Financial report' },
  'rapports.techniques.view': { fr: 'Rapport technique', en: 'Technical report' },
  'audit.view': { fr: "Accéder à l'audit", en: 'Access audit' },
  'notifications.view': { fr: 'Voir les notifications', en: 'View notifications' },
  'settings.view': { fr: 'Voir les paramètres', en: 'View settings' },
  'settings.manage': { fr: 'Gérer les paramètres', en: 'Manage settings' },
};

const ROLE_LABELS = {
  ADMIN: { fr: 'Administrateur', en: 'Administrator' },
  DG: { fr: 'Directeur général', en: 'General Manager' },
  COMPTABLE: { fr: 'Comptable', en: 'Accountant' },
  TECHNICIEN: { fr: 'Technicien', en: 'Technician' },
  MAGASINIER: { fr: 'Magasinier', en: 'Storekeeper' },
  CAISSE: { fr: 'Caisse', en: 'Cashier' },
};

const GestionPermissions = () => {
  const { t, lang } = useLanguage();
  const [roles, setRoles] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedPerms, setSelectedPerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const isAdminRole = roles.find((r) => String(r.id_role) === String(selectedRoleId))?.nom?.toUpperCase() === 'ADMIN';

  const loadInitial = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [rolesData, catalogData] = await Promise.all([
        getRoles(),
        getPermissionsCatalog(),
      ]);
      setRoles(rolesData || []);
      setCatalog(catalogData || []);
      if (rolesData?.length && !selectedRoleId) {
        setSelectedRoleId(String(rolesData[0].id_role));
      }
    } catch (err) {
      console.error(err);
      setError(t('permissionsLoadError'));
    } finally {
      setLoading(false);
    }
  }, [selectedRoleId, t]);

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    if (!selectedRoleId) return;
    const loadRolePerms = async () => {
      try {
        setError(null);
        const data = await getRolePermissions(selectedRoleId);
        setSelectedPerms(data.permissions || []);
      } catch (err) {
        console.error(err);
        setError(t('permissionsLoadError'));
      }
    };
    loadRolePerms();
  }, [selectedRoleId, t]);

  const togglePermission = (nom) => {
    if (isAdminRole) return;
    setSelectedPerms((prev) =>
      prev.includes(nom) ? prev.filter((p) => p !== nom) : [...prev, nom]
    );
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const result = await updateRolePermissions(selectedRoleId, selectedPerms);
      setSelectedPerms(result.permissions || []);
      setSuccess(t('permissionsSaveSuccess'));
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || t('permissionsSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const getPermLabel = (nom) => {
    const entry = PERMISSION_LABELS[nom];
    if (entry) return entry[lang] || entry.fr;
    return nom;
  };

  const getRoleLabel = (nom) => {
    const entry = ROLE_LABELS[nom?.toUpperCase()];
    if (entry) return entry[lang] || entry.fr;
    return nom;
  };

  const grouped = catalog.reduce((acc, perm) => {
    const mod = perm.module || 'autre';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(perm);
    return acc;
  }, {});

  if (loading) {
    return <LoadingSpinner message={t('permissionsLoading')} />;
  }

  return (
    <AppPage>
      <PageHeader
        title={t('permissionsTitle')}
        subtitle={t('permissionsSubtitle')}
        icon={ShieldCheckIcon}
      />

      {error && <div className="alert-error">{error}</div>}
      {success && (
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 text-sm">
          {success}
        </div>
      )}

      <Card compact>
        <div className="app-filter-bar">
          <div className="app-filter-field">
            <label className="form-label">{t('permissionsSelectRole')}</label>
            <select
              className="form-input"
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
            >
              {roles.map((role) => (
                <option key={role.id_role} value={role.id_role}>
                  {getRoleLabel(role.nom)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isAdminRole && (
          <p className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
            {t('permissionsAdminNote')}
          </p>
        )}

        <div className="space-y-6 mt-4">
          {Object.entries(grouped).map(([module, perms]) => (
            <div key={module}>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-3">
                {module}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {perms.map((perm) => {
                  const checked = selectedPerms.includes(perm.nom);
                  return (
                    <label
                      key={perm.id_permission}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                        ${checked
                          ? 'border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/20'
                          : 'border-border-light dark:border-border-dark bg-gray-50/50 dark:bg-gray-800/30'
                        }
                        ${isAdminRole ? 'opacity-75 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-night-hover'}`}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 rounded border-gray-300 dark:border-slate-600"
                        checked={checked}
                        disabled={isAdminRole}
                        onChange={() => togglePermission(perm.nom)}
                      />
                      <span className="text-sm text-gray-800 dark:text-slate-200">
                        {getPermLabel(perm.nom)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="app-form-actions mt-6">
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving || isAdminRole}
          >
            {saving ? t('permissionsSaving') : t('permissionsSave')}
          </Button>
        </div>
      </Card>
    </AppPage>
  );
};

export default GestionPermissions;
