import React, { useState, useMemo } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import AppPage from '../ui/AppPage';
import PageHeader from '../ui/PageHeader';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import ValidationFourniture from './ValidationFourniture';
import useFournitures from '../../hooks/useFournitures';
import { formatDate } from '../../utils/formatters';
import {
  getStatutFournitureColor,
  BADGE_COLORS,
} from '../../utils/workflowEnums';
import { getStatutFournitureLabelI18n } from '../../utils/i18nWorkflow';
import { ArchiveBoxIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const PAGE_SIZES = [10, 25, 50];

const FournituresEnAttente = () => {
  const { t } = useTranslation();
  const { fournitures, loading, refreshing, error, refresh } = useFournitures({ poll: true });
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return fournitures;
    return fournitures.filter((f) =>
      String(f.id_besoin).includes(q) ||
      String(f.id_fourniture).includes(q)
    );
  }, [fournitures, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice(page * pageSize, page * pageSize + pageSize);

  const handleRefresh = () => refresh();

  const handleCloseModal = (success) => {
    setSelectedId(null);
    if (success) refresh({ silent: true });
  };

  if (loading && fournitures.length === 0) {
    return <LoadingSpinner message={t('common.loading')} />;
  }

  return (
    <AppPage>
      <PageHeader
        title={t('fournitures.attente.title')}
        subtitle={t('fournitures.attente.subtitleCount', { count: fournitures.length })}
        icon={ArchiveBoxIcon}
      />

      <div className="app-card mb-4 no-print">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <input
            type="search"
            placeholder={t('fournitures.attente.searchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="form-input w-full sm:max-w-xs"
            aria-label={t('common.search')}
          />
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
            className="form-input w-full sm:w-auto"
            aria-label={t('common.rowsPerPage')}
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>{t('fournitures.attente.perPage', { n })}</option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={refreshing}
            className="sm:ml-auto shrink-0"
            aria-label={t('fournitures.attente.refreshList')}
          >
            {!refreshing && <ArrowPathIcon className="w-4 h-4" />}
            {t('common.refresh')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="alert-error mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <Button type="button" variant="outline" size="sm" onClick={handleRefresh} isLoading={refreshing}>
            {!refreshing && <ArrowPathIcon className="w-4 h-4" />}
            {t('common.retry')}
          </Button>
        </div>
      )}

      {pageItems.length === 0 ? (
        <div className="app-card text-center py-12 text-gray-500 dark:text-slate-400">
          <ArchiveBoxIcon className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
          <p className="font-medium text-gray-700 dark:text-slate-300">{t('fournitures.attente.empty')}</p>
          <p className="text-sm mt-1">{t('fournitures.attente.emptyHint')}</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            isLoading={refreshing}
            className="mt-4"
          >
            {!refreshing && <ArrowPathIcon className="w-4 h-4" />}
            {t('common.refresh')}
          </Button>
        </div>
      ) : (
        <div className="app-card overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>{t('fournitures.attente.colBesoin')}</th>
                <th>{t('fournitures.attente.colDate')}</th>
                <th>{t('fournitures.attente.colPiece')}</th>
                <th>{t('fournitures.attente.colQty')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((f) => {
                const colorKey = getStatutFournitureColor(f.statut);
                return (
                  <tr
                    key={f.id_fourniture}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50"
                    onClick={() => setSelectedId(f.id_fourniture)}
                  >
                    <td>#{f.id_besoin}</td>
                    <td>{formatDate(f.date_creation)}</td>
                    <td>{t('fournitures.attente.pieceLine', { id: f.id_piece })}</td>
                    <td>{f.quantite_demandee}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${BADGE_COLORS[colorKey]}`}>
                        {getStatutFournitureLabelI18n(t, f.statut)}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="text-primary-600 hover:underline text-sm font-medium"
                        onClick={(e) => { e.stopPropagation(); setSelectedId(f.id_fourniture); }}
                        aria-label={t('fournitures.attente.processAria', { id: f.id_fourniture })}
                      >
                        {t('fournitures.attente.process')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-border-light dark:border-border-dark text-sm">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              {t('common.previous')}
            </Button>
            <span className="text-gray-600 dark:text-slate-400">{t('common.pageOf', { current: page + 1, total: totalPages })}</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      )}

      {selectedId && (
        <ValidationFourniture
          idFourniture={selectedId}
          onClose={handleCloseModal}
        />
      )}
    </AppPage>
  );
};

export default FournituresEnAttente;
