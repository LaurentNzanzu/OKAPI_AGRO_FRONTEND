// frontend/src/components/permissions/GestionPermissionsRole.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext';
import api from '../../services/api';
import permissionsService from '../../services/permissions';
import AppPage from '../ui/AppPage';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PageLoader from '../common/PageLoader';
import { ShieldCheckIcon, CheckCircleIcon, XCircleIcon, DocumentTextIcon } from '../ui/icons';

const GestionPermissionsRole = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/roles/').catch(() => ({ data: [] })),
        permissionsService.list({ actif: true }),
      ]);
      const rolesData = Array.isArray(rolesRes.data) ? rolesRes.data : rolesRes.data?.items || [];
      setRoles(rolesData);
      setPermissions(Array.isArray(permsRes) ? permsRes : []);
      if (rolesData.length > 0 && !selectedRole) {
        setSelectedRole(rolesData[0]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [selectedRole]);

  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadRolePerms = async () => {
      if (!selectedRole) return;
      try {
        const data = await permissionsService.listerRole(selectedRole.id_role || selectedRole.id);
        setRolePermissions(Array.isArray(data) ? data : []);
      } catch {
        setRolePermissions([]);
      }
    };
    loadRolePerms();
  }, [selectedRole]);

  const isAttributed = (permId) =>
    rolePermissions.some((p) => p.id_permission === permId);

  const togglePermission = async (perm) => {
    if (!selectedRole) return;
    const roleId = selectedRole.id_role || selectedRole.id;
    setSaving(true);
    try {
      if (isAttributed(perm.id_permission)) {
        await permissionsService.revoquer(roleId, [perm.id_permission]);
        setRolePermissions((prev) =>
          prev.filter((p) => p.id_permission !== perm.id_permission)
        );
      } else {
        await permissionsService.attribuer(roleId, [perm.id_permission]);
        setRolePermissions((prev) => [...prev, perm]);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const filteredPermissions = permissions.filter((p) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      p.nom.toLowerCase().includes(term) ||
      (p.description || '').toLowerCase().includes(term) ||
      (p.module || '').toLowerCase().includes(term)
    );
  });

  if (loading) return <PageLoader />;

  return (
    <AppPage>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-200">
            <ShieldCheckIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-page-title text-gray-900 dark:text-slate-100">
              Permissions par rôle
            </h1>
            <p className="text-page-subtitle text-gray-500 dark:text-slate-400">
              Attribuez ou révoquez des permissions pour chaque rôle
            </p>
          </div>
        </div>
        <div>
          <Button
            variant="secondary"
            onClick={() => navigate('/permissions')}
          >
            <DocumentTextIcon className="w-4 h-4" /> Catalogue des permissions
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card title="Rôles" compact className="lg:col-span-1">
          <div className="space-y-1">
            {roles.map((r) => {
              const rid = r.id_role || r.id;
              const isActive = selectedRole && (selectedRole.id_role || selectedRole.id) === rid;
              return (
                <button
                  key={rid}
                  onClick={() => setSelectedRole(r)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-night-active'
                  }`}
                >
                  {r.nom}
                </button>
              );
            })}
          </div>
        </Card>

        <Card
          title={selectedRole ? `Permissions du rôle « ${selectedRole.nom} »` : 'Permissions'}
          className="lg:col-span-3"
          actions={
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark"
            />
          }
        >
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger">
              {error}
            </div>
          )}

          {!selectedRole ? (
            <p className="text-center py-8 text-sm text-gray-500 dark:text-slate-400">
              Sélectionnez un rôle
            </p>
          ) : filteredPermissions.length === 0 ? (
            <p className="text-center py-8 text-sm text-gray-500 dark:text-slate-400">
              Aucune permission
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredPermissions.map((p) => {
                const attributed = isAttributed(p.id_permission);
                return (
                  <button
                    key={p.id_permission}
                    onClick={() => togglePermission(p)}
                    disabled={saving}
                    className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors border ${
                      attributed
                        ? 'bg-success/10 border-success/30 text-gray-900 dark:text-slate-100'
                        : 'bg-white dark:bg-surface-dark border-border-light dark:border-border-dark hover:border-primary-400'
                    } disabled:opacity-60`}
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-semibold truncate">{p.nom}</p>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                        {p.description || `${p.module}:${p.action}`}
                      </p>
                    </div>
                    {attributed ? (
                      <CheckCircleIcon className="w-5 h-5 text-success shrink-0" />
                    ) : (
                      <XCircleIcon className="w-5 h-5 text-gray-300 dark:text-gray-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </AppPage>
  );
};

export default GestionPermissionsRole;