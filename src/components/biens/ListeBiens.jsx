import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AppPage from '../ui/AppPage';
import { useNavigate } from 'react-router-dom';
import { biensService } from '../../services/biens';
import usePermissions from '../../hooks/usePermissions';
import { useTranslation } from '../../context/LanguageContext';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  QrCodeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PageHeader from '../ui/PageHeader';
import LoadingSpinner from '../ui/LoadingSpinner';
import { CubeIcon } from '@heroicons/react/24/outline';
import ConfirmDialog from '../common/ConfirmDialog';
import QRCodeGenerator from '../common/QRCodeGenerator';
import PrintInventaireBiens from '../prints/PrintInventaireBiens';
import { formatDate, formatPrice } from '../../utils/formatters';

const ETAT_KEYS = ['NEUF', 'BON', 'USAGE', 'PANNE', 'REFORME', 'MAINTENANCE'];

const ETAT_COLORS = {
  NEUF: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  BON: 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-200',
  USAGE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  PANNE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  REFORME: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300',
  MAINTENANCE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};

const TYPE_COLORS = {
  vehicule: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  machine: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  ordinateur: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
};

const TechnicianModeBanner = () => {
  const { t } = useTranslation();
  return (
    <div
      className="mb-4 flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-100"
      role="status"
    >
      <WrenchScrewdriverIcon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
      <div>
        <p className="font-semibold">{t('assets.technicianBannerTitle')}</p>
        <p className="mt-0.5 text-orange-800/90 dark:text-orange-200/90">
          {t('assets.technicianBannerDesc')}
        </p>
      </div>
    </div>
  );
};

const ListeBiens = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    canViewPurchasePrice,
    canCreateBien,
    canDeleteBien,
    canEditBien,
    canViewQRCode,
    canPreviewInventory,
    isTechnicianMode,
    authReady,
  } = usePermissions();

  const etatConfig = useMemo(
    () => Object.fromEntries(
      ETAT_KEYS.map((key) => [key, { label: t(`status.etat.${key}`), color: ETAT_COLORS[key] }])
    ),
    [t]
  );

  const typeConfig = useMemo(
    () => ({
      vehicule: { label: t('status.type.vehicule'), color: TYPE_COLORS.vehicule },
      machine: { label: t('status.type.machine'), color: TYPE_COLORS.machine },
      ordinateur: { label: t('status.type.ordinateur'), color: TYPE_COLORS.ordinateur },
    }),
    [t]
  );

  const [biens, setBiens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedBien, setSelectedBien] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ search: '', type_bien: '', etat: '' });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, nom: '' });
  const [showInventairePreview, setShowInventairePreview] = useState(false);
  const [inventaireBiens, setInventaireBiens] = useState([]);
  const [loadingInventaire, setLoadingInventaire] = useState(false);

  const visibleColumnCount = 6 + (canViewPurchasePrice ? 1 : 0);

  const fetchBiens = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await biensService.getAll({
        page: page,
        limit: rowsPerPage,
        type_bien: filters.type_bien || undefined,
        etat: filters.etat || undefined,
        search: filters.search || undefined,
      });
      
      setBiens(response?.biens || []);
      setTotal(response?.total || 0);
    } catch (err) {
      console.error('Erreur fetchBiens:', err);
      setError(err.response?.data?.detail || t('assets.loadListError'));
      setBiens([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filters.type_bien, filters.etat, filters.search, t]);

  useEffect(() => {
    if (authReady) fetchBiens();
  }, [fetchBiens, authReady]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (!canDeleteBien) return;
    try {
      await biensService.delete(id);
      fetchBiens();
    } catch (err) {
      setError(err.response?.data?.detail || t('assets.deleteError'));
    }
  };

  const handleApercuInventaire = async () => {
    if (!canPreviewInventory) return;
    try {
      setLoadingInventaire(true);
      const result = await biensService.getAll({
        skip: 0,
        limit: 500,
        type_bien: filters.type_bien,
        etat: filters.etat,
        search: filters.search,
      });
      setInventaireBiens(result?.biens || []);
      setShowInventairePreview(true);
    } catch {
      setError(t('assets.loadInventoryError'));
    } finally {
      setLoadingInventaire(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  };

  if (!authReady || loading) {
    return <LoadingSpinner message={t('assets.loadingAssets')} />;
  }

  return (
    <AppPage>
      <PageHeader
        title={t('assets.listTitle')}
        subtitle={
          isTechnicianMode
            ? t('assets.listSubtitleTechnician')
            : t('assets.listSubtitle')
        }
        icon={CubeIcon}
        action={
          <div className="flex flex-wrap gap-2">
            {canPreviewInventory && (
              <Button variant="secondary" onClick={handleApercuInventaire} disabled={loadingInventaire}>
                <EyeIcon className="w-4 h-4" />
                {loadingInventaire ? t('common.loading') : t('assets.previewInventory')}
              </Button>
            )}
            {canCreateBien && (
              <Button onClick={() => navigate('/biens/nouveau')}>
                <PlusIcon className="w-4 h-4" />
                {t('assets.newAsset')}
              </Button>
            )}
          </div>
        }
      />

      {isTechnicianMode && <TechnicianModeBanner />}

      <Card compact>
        <div className="app-filter-bar">
          <div className="app-filter-field">
            <label className="form-label">{t('assets.search')}</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder={t('assets.searchPlaceholder')}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="form-input pl-9"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <label className="form-label">{t('assets.fieldType')}</label>
            <select
              value={filters.type_bien}
              onChange={(e) => handleFilterChange('type_bien', e.target.value)}
              className="form-input"
            >
              <option value="">{t('assets.filterAll')}</option>
              <option value="vehicule">{t('status.type.vehicule')}</option>
              <option value="machine">{t('status.type.machine')}</option>
              <option value="ordinateur">{t('status.type.ordinateur')}</option>
            </select>
          </div>
          <div className="w-full md:w-48">
            <label className="form-label">{t('assets.fieldState')}</label>
            <select
              value={filters.etat}
              onChange={(e) => handleFilterChange('etat', e.target.value)}
              className="form-input"
            >
              <option value="">{t('assets.filterAll')}</option>
              {ETAT_KEYS.map((key) => (
                <option key={key} value={key}>{etatConfig[key].label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={fetchBiens}
              className="p-2 text-gray-500 dark:text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-night-hover rounded-lg transition-colors"
              title={t('common.refresh')}
              aria-label={t('assets.refreshList')}
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Card>

      {error && <div className="alert-error">{error}</div>}

      <Card noPadding>
        <div className="app-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('assets.colType')}</th>
                <th>{t('assets.colBrandModel')}</th>
                <th>{t('assets.colAcquisition')}</th>
                {canViewPurchasePrice && <th>{t('assets.colPrice')}</th>}
                <th>{t('assets.colState')}</th>
                <th>{t('assets.colLocation')}</th>
                <th className="text-center">{t('assets.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {biens.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumnCount} className="text-center py-12 text-gray-400 dark:text-slate-500">
                    {t('assets.noAssetsFound')}
                  </td>
                </tr>
              ) : (
                biens.map((bien) => {
                  const typeCfg = typeConfig[bien.type_bien] || {
                    label: t(`status.type.${bien.type_bien}`) !== `status.type.${bien.type_bien}`
                      ? t(`status.type.${bien.type_bien}`)
                      : (bien.type_bien || t('status.type.autre')),
                    color: 'bg-gray-100 text-gray-700',
                  };
                  const etatCfg = etatConfig[bien.etat] || etatConfig.BON;
                  const bienId = bien.id_bien || bien.id;
                  const label = `${bien.marque || bien.fabricant || 'N/A'} ${bien.modele || ''}`.trim();

                  const getLocalisationName = (loc) => {
                    if (typeof loc === 'object' && loc !== null) {
                      return loc.nom_localisation || '—';
                    }
                    return loc || '—';
                  };

                  return (
                    <tr key={bienId}>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${typeCfg.color}`}>
                          {typeCfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-slate-100">{label}</div>
                        {(bien.immatriculation || bien.numero_serie) && (
                          <div className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                            {bien.immatriculation || t('assets.serialNumberPrefix', { sn: bien.numero_serie })}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300">
                        {formatDate(bien.date_acquisition)}
                      </td>
                      {canViewPurchasePrice && (
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-slate-100">
                          {bien.prix_acquisition != null ? formatPrice(bien.prix_acquisition) : '—'}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${etatCfg.color}`}>
                          {etatCfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                        {getLocalisationName(bien.localisation)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => navigate(`/biens/${bienId}`)}
                            className="p-1.5 text-primary-600 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title={t('common.view')}
                            aria-label={`${t('common.view')} ${label}`}
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          {canEditBien && (
                            <button
                              type="button"
                              onClick={() => navigate(`/biens/${bienId}/edit`)}
                              className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                              title={isTechnicianMode ? t('assets.editTechnician') : t('common.edit')}
                              aria-label={`${t('common.edit')} ${label}`}
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          )}
                          {canViewQRCode && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBien(bien);
                                setQrDialogOpen(true);
                              }}
                              className="p-1.5 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                              title={t('assets.qrCode')}
                              aria-label={`${t('assets.qrCode')} ${label}`}
                            >
                              <QrCodeIcon className="w-4 h-4" />
                            </button>
                          )}
                          {canDeleteBien && (
                            <button
                              type="button"
                              onClick={() => setConfirmDelete({ open: true, id: bienId, nom: label })}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title={t('common.delete')}
                              aria-label={`${t('common.delete')} ${label}`}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && (
          <div className="app-pagination">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-slate-400">{t('common.rowsPerPage')}</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  const newRows = parseInt(e.target.value, 10);
                  setRowsPerPage(newRows);
                  setPage(1);
                }}
                className="form-input"
                aria-label={t('common.rowsPerPage')}
              >
                {[5, 10, 25, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={page === 1}
                className="p-2 text-gray-500 dark:text-slate-400 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label={t('common.previousPage')}
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              {Array.from({ length: totalPages }).map((_, index) => {
                const pageNumber = index + 1;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      page === pageNumber
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-night-hover'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={handleNextPage}
                disabled={page === totalPages}
                className="p-2 text-gray-500 dark:text-slate-400 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label={t('common.nextPage')}
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {selectedBien && (
        <QRCodeGenerator
          bienId={selectedBien.id_bien}
          qrCode={selectedBien.qr_code}
          open={qrDialogOpen}
          onClose={() => {
            setQrDialogOpen(false);
            setSelectedBien(null);
          }}
        />
      )}

      {canDeleteBien && (
        <ConfirmDialog
          open={confirmDelete.open}
          title={t('assets.deleteTitle')}
          content={t('assets.deleteConfirmContent', { name: confirmDelete.nom })}
          onConfirm={() => {
            if (confirmDelete.id) handleDelete(confirmDelete.id);
            setConfirmDelete({ open: false, id: null, nom: '' });
          }}
          onCancel={() => setConfirmDelete({ open: false, id: null, nom: '' })}
          type="danger"
        />
      )}

      {showInventairePreview && (
        <PrintInventaireBiens
          biens={inventaireBiens}
          onClose={() => setShowInventairePreview(false)}
        />
      )}
    </AppPage>
  );
};

export default ListeBiens;