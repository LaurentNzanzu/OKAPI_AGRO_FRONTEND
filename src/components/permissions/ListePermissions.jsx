// frontend/src/components/permissions/ListePermissions.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import permissionsService from '../../services/permissions';
import AppPage from '../ui/AppPage';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import PageLoader from '../common/PageLoader';
import FichePermission from './FichePermission';
import {
  ShieldCheckIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  UserGroupIcon,
} from '../ui/icons';

const ListePermissions = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);

  const canGerer = hasPermission('permission.gerer');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (moduleFilter) params.module = moduleFilter;
      const [data, mods] = await Promise.all([
        permissionsService.list(params),
        permissionsService.modules().catch(() => []),
      ]);
      setPermissions(Array.isArray(data) ? data : []);
      setModules(Array.isArray(mods) ? mods : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  }, [search, moduleFilter]);

  useEffect(() => {
    const timeout = setTimeout(fetchData, 300);
    return () => clearTimeout(timeout);
  }, [fetchData]);

  const handleDelete = async (perm) => {
    if (!window.confirm(`Supprimer la permission "${perm.nom}" ?`)) return;
    try {
      await permissionsService.remove(perm.id_permission);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur suppression');
    }
  };

  if (loading && permissions.length === 0) return <PageLoader />;

  return (
    <AppPage>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-200">
            <ShieldCheckIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-page-title text-gray-900 dark:text-slate-100">
              Permissions
            </h1>
            <p className="text-page-subtitle text-gray-500 dark:text-slate-400">
              Gestion granulaire des droits d'accès
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate('/permissions/roles')}
          >
            <UserGroupIcon className="w-4 h-4" /> Permissions par rôle
          </Button>
          {canGerer && (
            <Button
              variant="primary"
              onClick={() => {
                setEditingPermission(null);
                setModalOpen(true);
              }}
            >
              <PlusIcon className="w-4 h-4" /> Nouvelle permission
            </Button>
          )}
        </div>
      </div>

      <Card compact>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1">
            <Input
              icon={MagnifyingGlassIcon}
              placeholder="Rechercher par nom ou description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-sm"
          >
            <option value="">Tous les modules</option>
            {modules.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button
            onClick={fetchData}
            className="p-2.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-night-active text-gray-600 dark:text-slate-300"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger">
            {error}
          </div>
        )}

        {permissions.length === 0 ? (
          <p className="text-center py-12 text-sm text-gray-500 dark:text-slate-400">
            Aucune permission
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border-light dark:border-border-dark text-left text-xs uppercase text-gray-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-3">Nom</th>
                  <th className="py-3 px-3">Module</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Actif</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {permissions.map((p) => (
                  <tr key={p.id_permission} className="hover:bg-gray-50 dark:hover:bg-night-active/40">
                    <td className="py-3 px-3 font-mono text-xs font-semibold">{p.nom}</td>
                    <td className="py-3 px-3">{p.module}</td>
                    <td className="py-3 px-3">{p.action}</td>
                    <td className="py-3 px-3">
                      {p.actif ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-success/10 text-success">
                          Actif
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-slate-300">
                          Inactif
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {canGerer && (
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => {
                              setEditingPermission(p);
                              setModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-600"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-danger/10 hover:text-danger"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modalOpen && (
        <FichePermission
          permission={editingPermission}
          modules={modules}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            fetchData();
          }}
        />
      )}
    </AppPage>
  );
};

export default ListePermissions;