import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid, FormControl, InputLabel, Select, MenuItem,
  Button as MuiButton,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import {
  WrenchScrewdriverIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import AppPage from '../ui/AppPage';
import PageHeader from '../ui/PageHeader';
import StatCard from '../ui/StatCard';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { piecesService } from '../../services/pieces';
import { useAuth } from '../../hooks/useAuth';
import ConfirmDialog from '../common/ConfirmDialog';
import { okapiMuiTheme } from '../../theme/muiTheme';
import { PIECE_COMPAT_CONFIG, StatusBadge } from '../ui/icons';

const GestionPieces = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('edit_piece') || hasPermission('create_piece');

  const [pieces, setPieces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStock, setFilterStock] = useState('all');
  const [filterCompatible, setFilterCompatible] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingPiece, setEditingPiece] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    numero_serie: '',
    designation: '',
    prix_achat: '',
    prix_vente: '',
    stock_actuel: 0,
    stock_minimum: 5,
    compatible_avec: 'VEHICULE',
    fournisseur: '',
  });

  const compatibleOptions = useMemo(() => [
    { value: 'VEHICULE', label: t('pieces.gestion.compatVehicule') },
    { value: 'ORDINATEUR', label: t('pieces.gestion.compatOrdinateur') },
    { value: 'MACHINE_PRODUCTION', label: t('pieces.gestion.compatMachine') },
  ], [t]);

  useEffect(() => {
    fetchPieces();
  }, [filterStock, filterCompatible]);

  const fetchPieces = async () => {
    try {
      setLoading(true);
      const params = { est_active: true };
      if (filterStock === 'low') params.stock_alert = true;
      const data = await piecesService.getAll(params);
      setPieces(data);
    } catch (err) {
      console.error('Erreur chargement pièces:', err);
      setError(t('pieces.gestion.loadError'));
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation du numéro de série UNIQUEMENT s'il est renseigné
    if (formData.numero_serie && !/^\d+$/.test(formData.numero_serie)) {
      setError(t('pieces.gestion.serialDigitsOnly'));
      return;
    }
    
    try {
      const payload = {
        ...formData,
        prix_achat: parseFloat(formData.prix_achat),
        prix_vente: formData.prix_vente ? parseFloat(formData.prix_vente) : null,
        stock_actuel: parseInt(formData.stock_actuel),
        stock_minimum: parseInt(formData.stock_minimum),
      };

      // Pour l'édition, ne pas envoyer numero_serie s'il est vide
      if (!editingPiece && !payload.numero_serie) {
        delete payload.numero_serie; // Le backend le générera automatiquement
      }

      if (editingPiece) {
        await piecesService.update(editingPiece.id_piece, payload);
        setSuccess(t('pieces.gestion.updateSuccess'));
      } else {
        await piecesService.create(payload);
        setSuccess(t('pieces.gestion.createSuccess'));
      }
      setShowForm(false);
      setEditingPiece(null);
      resetForm();
      fetchPieces();
    } catch (err) {
      setError(err.response?.data?.detail || t('pieces.gestion.saveError'));
    }
  };

  const handleDelete = async (id) => {
    try {
      await piecesService.delete(id);
      setSuccess(t('pieces.gestion.deleteSuccess'));
      fetchPieces();
    } catch (err) {
      setError(t('pieces.gestion.deleteError'));
    }
  };

  const resetForm = () => {
    setFormData({
      numero_serie: '',
      designation: '',
      prix_achat: '',
      prix_vente: '',
      stock_actuel: 0,
      stock_minimum: 5,
      compatible_avec: 'VEHICULE',
      fournisseur: '',
    });
  };

  const openEdit = (piece) => {
    setEditingPiece(piece);
    setFormData({
      numero_serie: piece.numero_serie,
      designation: piece.designation,
      prix_achat: piece.prix_achat.toString(),
      prix_vente: piece.prix_vente?.toString() || '',
      stock_actuel: piece.stock_actuel,
      stock_minimum: piece.stock_minimum,
      compatible_avec: piece.compatible_avec,
      fournisseur: piece.fournisseur || '',
    });
    setShowForm(true);
  };

  const getCompatibleLabel = (value) => {
    const option = compatibleOptions.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  const filteredPieces = pieces.filter((piece) => {
    const matchesSearch =
      searchTerm === '' ||
      piece.numero_serie.toLowerCase().includes(searchTerm.toLowerCase()) ||
      piece.designation.toLowerCase().includes(searchTerm.toLowerCase());

    const isLowStock = piece.stock_actuel < piece.stock_minimum;
    const matchesStock =
      filterStock === 'all' ||
      (filterStock === 'low' && isLowStock) ||
      (filterStock === 'ok' && !isLowStock);

    const matchesCompatible =
      filterCompatible === 'all' || piece.compatible_avec === filterCompatible;

    return matchesSearch && matchesStock && matchesCompatible;
  });

  const stats = {
    total: pieces.length,
    lowStock: pieces.filter((p) => p.stock_actuel < p.stock_minimum).length,
    totalValue: pieces.reduce((sum, p) => sum + p.prix_achat * p.stock_actuel, 0),
    byCompatible: {
      VEHICULE: pieces.filter((p) => p.compatible_avec === 'VEHICULE').length,
      ORDINATEUR: pieces.filter((p) => p.compatible_avec === 'ORDINATEUR').length,
      MACHINE_PRODUCTION: pieces.filter((p) => p.compatible_avec === 'MACHINE_PRODUCTION').length,
    },
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterStock('all');
    setFilterCompatible('all');
  };

  if (loading && pieces.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        <span className="ml-2 text-gray-500 dark:text-slate-400">{t('pieces.gestion.loading')}</span>
      </div>
    );
  }

  return (
    <>
      <AppPage>
        <PageHeader
          title={t('pieces.gestion.title')}
          subtitle={t('pieces.gestion.subtitle')}
          icon={WrenchScrewdriverIcon}
          action={
            canEdit && (
              <Button
                onClick={() => {
                  resetForm();
                  setEditingPiece(null);
                  setShowForm(true);
                }}
              >
                <PlusIcon className="w-4 h-4" />
                {t('pieces.gestion.newPiece')}
              </Button>
            )
          }
        />

        {error && <div className="alert-error">{error}</div>}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-3 rounded-lg text-sm border border-green-200 dark:border-green-800">
            {success}
          </div>
        )}

        <div className="app-stats-grid">
          <StatCard label={t('pieces.gestion.statTotal')} value={stats.total} icon={CubeIcon} />
          <StatCard
            label={t('pieces.gestion.statAlerts')}
            value={stats.lowStock}
            icon={ExclamationTriangleIcon}
            accent={stats.lowStock > 0 ? 'danger' : 'success'}
          />
          <StatCard
            label={t('pieces.gestion.statValue')}
            value={`${stats.totalValue.toLocaleString()} USD`}
            icon={CurrencyDollarIcon}
          />
          <StatCard
            label={t('pieces.gestion.statRepartition')}
            value={stats.total}
            icon={CubeIcon}
            hint={t('pieces.gestion.repartitionHint', {
              vehicule: stats.byCompatible.VEHICULE,
              ordinateur: stats.byCompatible.ORDINATEUR,
              machine: stats.byCompatible.MACHINE_PRODUCTION,
            })}
          />
        </div>

        <Card compact>
          <div className="app-filter-bar">
            <div className="app-filter-field min-w-[200px] md:max-w-md">
              <Input
                placeholder={t('pieces.gestion.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={MagnifyingGlassIcon}
              />
            </div>
            <div className="app-filter-field min-w-[160px]">
              <label className="form-label">{t('pieces.gestion.filterStock')}</label>
              <select
                value={filterStock}
                onChange={(e) => setFilterStock(e.target.value)}
                className="form-input"
              >
                <option value="all">{t('pieces.gestion.allPieces')}</option>
                <option value="low">{t('pieces.gestion.lowStock')}</option>
                <option value="ok">{t('pieces.gestion.okStock')}</option>
              </select>
            </div>
            <div className="app-filter-field min-w-[160px]">
              <label className="form-label">{t('pieces.gestion.filterCompat')}</label>
              <select
                value={filterCompatible}
                onChange={(e) => setFilterCompatible(e.target.value)}
                className="form-input"
              >
                <option value="all">{t('pieces.gestion.filterAll')}</option>
                <option value="VEHICULE">{t('pieces.gestion.compatVehicule')}</option>
                <option value="ORDINATEUR">{t('pieces.gestion.compatOrdinateur')}</option>
                <option value="MACHINE_PRODUCTION">{t('pieces.gestion.compatMachine')}</option>
              </select>
            </div>
            <Button variant="outline" onClick={resetFilters} className="md:self-end shrink-0">
              {t('common.reset')}
            </Button>
          </div>
        </Card>

        <Card noPadding>
          <div className="app-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('pieces.gestion.colSerial')}</th>
                  <th>{t('pieces.gestion.colDesignation')}</th>
                  <th>{t('pieces.gestion.colCompat')}</th>
                  <th className="text-right">{t('pieces.gestion.colPrice')}</th>
                  <th className="text-center">{t('pieces.gestion.colStock')}</th>
                  <th className="text-center">{t('common.status')}</th>
                  <th className="text-center">{t('common.supplier')}</th>
                  {canEdit && <th className="text-center">{t('common.actions')}</th>}
                </tr>
              </thead>
              <tbody>
                {filteredPieces.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 8 : 7} className="text-center py-10 text-gray-500 dark:text-slate-400">
                      {searchTerm || filterStock !== 'all' || filterCompatible !== 'all'
                        ? t('pieces.gestion.noMatch')
                        : t('pieces.gestion.empty')}
                    </td>
                  </tr>
                ) : (
                  filteredPieces.map((piece) => {
                    const isLowStock = piece.stock_actuel < piece.stock_minimum;
                    const compat = PIECE_COMPAT_CONFIG[piece.compatible_avec];
                    return (
                      <tr key={piece.id_piece}>
                        <td className="font-mono text-sm">{piece.numero_serie}</td>
                        <td className="font-medium">{piece.designation}</td>
                        <td>
                          {compat ? (
                            <StatusBadge
                              label={compat.label}
                              Icon={compat.Icon}
                              color="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-slate-300"
                            />
                          ) : (
                            getCompatibleLabel(piece.compatible_avec)
                          )}
                        </td>
                        <td className="text-right">
                          <div className="font-medium">{piece.prix_achat.toLocaleString()}</div>
                          {piece.prix_vente && (
                            <div className="text-xs text-gray-400 dark:text-slate-500">
                              {t('pieces.gestion.salePrice')} {piece.prix_vente.toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="text-center">
                          <div className="font-medium">
                            {piece.stock_actuel} / {piece.stock_minimum}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-slate-500">{t('pieces.gestion.minStockLabel')} {piece.stock_minimum}</div>
                        </td>
                        <td className="text-center">
                          {isLowStock ? (
                            <StatusBadge
                              label={t('pieces.gestion.stockLow')}
                              Icon={ExclamationTriangleIcon}
                              color="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            />
                          ) : (
                            <StatusBadge
                              label={t('pieces.gestion.stockOk')}
                              color="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            />
                          )}
                        </td>
                        <td className="text-center">{piece.fournisseur || '—'}</td>
                        {canEdit && (
                          <td className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEdit(piece)}
                                className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border-light dark:border-border-dark text-primary-600 hover:bg-gray-50 dark:bg-slate-800/50 dark:hover:bg-gray-800 transition-colors"
                                title={t('common.edit')}
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm({ open: true, id: piece.id_piece })}
                                className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-red-200 dark:border-red-900/50 text-danger hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title={t('common.delete')}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </AppPage>

      <ThemeProvider theme={okapiMuiTheme}>
        <Dialog
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingPiece(null);
            resetForm();
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingPiece ? t('pieces.gestion.editPiece') : t('pieces.gestion.newPieceDialogTitle')}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t('pieces.gestion.serialOptional')}
                    value={formData.numero_serie}
                    onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                    helperText={t('pieces.gestion.autoSerialHint')}
                    error={Boolean(formData.numero_serie && !/^[A-Za-z0-9]+$/.test(formData.numero_serie))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t('pieces.gestion.designationRequired')}
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>{t('pieces.gestion.compatibleWith')}</InputLabel>
                    <Select
                      value={formData.compatible_avec}
                      label={t('pieces.gestion.compatibleWith')}
                      onChange={(e) => setFormData({ ...formData, compatible_avec: e.target.value })}
                    >
                      {compatibleOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label={t('pieces.gestion.purchasePrice')}
                    type="number"
                    value={formData.prix_achat}
                    onChange={(e) => setFormData({ ...formData, prix_achat: e.target.value })}
                    required
                    inputProps={{ min: 0, step: 1 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label={t('pieces.gestion.salePriceField')}
                    type="number"
                    value={formData.prix_vente}
                    onChange={(e) => setFormData({ ...formData, prix_vente: e.target.value })}
                    inputProps={{ min: 0, step: 1 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label={t('common.supplier')}
                    value={formData.fournisseur}
                    onChange={(e) => setFormData({ ...formData, fournisseur: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t('pieces.gestion.currentStock')}
                    type="number"
                    value={formData.stock_actuel}
                    onChange={(e) => setFormData({ ...formData, stock_actuel: e.target.value })}
                    required
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t('pieces.gestion.minStockField')}
                    type="number"
                    value={formData.stock_minimum}
                    onChange={(e) => setFormData({ ...formData, stock_minimum: e.target.value })}
                    required
                    helperText={t('pieces.gestion.minStockHint')}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <MuiButton
                onClick={() => {
                  setShowForm(false);
                  setEditingPiece(null);
                  resetForm();
                }}
                color="inherit"
              >
                {t('common.cancel')}
              </MuiButton>
              <MuiButton type="submit" variant="contained">
                {editingPiece ? t('pieces.gestion.updateBtn') : t('pieces.gestion.addBtn')}
              </MuiButton>
            </DialogActions>
          </form>
        </Dialog>
      </ThemeProvider>

      <ConfirmDialog
        open={deleteConfirm.open}
        title={t('pieces.gestion.deleteTitle')}
        content={t('pieces.gestion.deleteContent')}
        onConfirm={() => {
          handleDelete(deleteConfirm.id);
          setDeleteConfirm({ open: false, id: null });
        }}
        onCancel={() => setDeleteConfirm({ open: false, id: null })}
      />
    </>
  );
};

export default GestionPieces;
