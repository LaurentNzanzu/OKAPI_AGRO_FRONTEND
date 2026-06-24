import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import AppPage from '../ui/AppPage';
import PageHeader from '../ui/PageHeader';
import StatCard from '../ui/StatCard';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { piecesService } from '../../services/pieces';
import { useAuth } from '../../hooks/useAuth';
import { formatPrice } from '../../utils/formatters';
import {
  CubeIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import {
  AppIcon,
  ArchiveBoxIcon,
  ChartBarIcon,
  PlusIcon,
  MinusIcon,
} from '../ui/icons';

const GestionStockPieces = () => {
  const { t } = useTranslation();
    const { hasPermission } = useAuth();
    const [pieces, setPieces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [selectedPiece, setSelectedPiece] = useState(null);
    const [showStockModal, setShowStockModal] = useState(false);
    const [stockOperation, setStockOperation] = useState({ type: 'add', quantite: 1 });

    const canEdit = hasPermission('edit_piece');

    useEffect(() => {
        fetchPieces();
    }, []);

    const fetchPieces = async () => {
        try {
            setLoading(true);
            const data = await piecesService.getAll({ est_active: true });
            setPieces(data);
        } catch (err) {
            console.error('Erreur chargement pièces:', err);
            setError('Impossible de charger les pièces');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStock = async () => {
        if (!selectedPiece) return;
        if (stockOperation.quantite < 1) {
            setError('La quantité doit être au moins 1');
            return;
        }

        try {
            const newStock = stockOperation.type === 'add'
                ? selectedPiece.stock_actuel + stockOperation.quantite
                : Math.max(0, selectedPiece.stock_actuel - stockOperation.quantite);

            await piecesService.update(selectedPiece.id_piece, {
                stock_actuel: newStock
            });

            setSuccess(`Stock mis à jour: ${selectedPiece.reference} → ${newStock} unités`);
            fetchPieces();
            setShowStockModal(false);
            setSelectedPiece(null);
            setStockOperation({ type: 'add', quantite: 1 });
        } catch (err) {
            setError(err.response?.data?.detail || 'Erreur lors de la mise à jour');
        }
    };

    const openStockModal = (piece) => {
        setSelectedPiece(piece);
        setStockOperation({ type: 'add', quantite: 1 });
        setShowStockModal(true);
        setError(null);
    };

    const isLowStock = (piece) => piece.stock_actuel < piece.stock_minimum;

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-petrol"></div>
                <span className="ml-2 text-gray-500 dark:text-slate-400">Chargement...</span>
            </div>
        );
    }

    const lowStockCount = pieces.filter(p => isLowStock(p)).length;
    const totalValue = pieces.reduce((sum, p) => sum + (p.stock_actuel * (p.prix_achat || 0)), 0);

    return (
        <AppPage>
            <PageHeader
                title="Gestion des stocks"
                subtitle={`${pieces.length} pièce(s) en stock • ${lowStockCount} alerte(s)`}
                icon={ChartBarIcon}
            />

            <div className="app-stats-grid">
                <StatCard label="Total pièces" value={pieces.length} icon={CubeIcon} />
                <StatCard
                    label="Alertes stock"
                    value={lowStockCount}
                    icon={ExclamationTriangleIcon}
                    accent={lowStockCount > 0 ? 'danger' : 'success'}
                />
                <StatCard label="Valeur stock" value={formatPrice(totalValue)} icon={CurrencyDollarIcon} />
            </div>

            {error && <div className="alert-error">{error}</div>}
            {success && (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-3 rounded-lg text-sm border border-green-200 dark:border-green-800">
                    {success}
                </div>
            )}

            <Card noPadding>
                <div className="app-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Référence</th>
                                <th>Désignation</th>
                                <th className="text-center">Stock actuel</th>
                                <th className="text-center">Stock min.</th>
                                <th className="text-right">Prix unitaire</th>
                                <th className="text-right">Valeur stock</th>
                                {canEdit && <th className="text-center">Action</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {pieces.map(piece => {
                                const lowStock = isLowStock(piece);
                                return (
                                    <tr key={piece.id_piece} className={lowStock ? 'bg-red-50/30 dark:bg-red-900/10' : ''}>
                                        <td className="font-mono text-sm">{piece.reference}</td>
                                        <td>
                                            <span className="font-medium">{piece.designation}</span>
                                            {piece.compatible_avec && (
                                                <div className="text-xs text-gray-400 dark:text-slate-500">{piece.compatible_avec}</div>
                                            )}
                                        </td>
                                        <td className="text-center">
                                            <span className={`font-bold ${lowStock ? 'text-red-600' : ''}`}>
                                                {piece.stock_actuel}
                                            </span>
                                        </td>
                                        <td className="text-center text-gray-500 dark:text-slate-400">{piece.stock_minimum}</td>
                                        <td className="text-right">{formatPrice(piece.prix_achat)}</td>
                                        <td className="text-right font-medium">
                                            {formatPrice(piece.stock_actuel * piece.prix_achat)}
                                        </td>
                                        {canEdit && (
                                            <td className="text-center">
                                                <Button size="sm" onClick={() => openStockModal(piece)} className="inline-flex items-center gap-1.5">
                                                    <AppIcon icon={ArchiveBoxIcon} size="xs" />
                                                    Gérer stock
                                                </Button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {showStockModal && selectedPiece && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md border border-border-light dark:border-border-dark shadow-xl">
                        <h3 className="text-lg font-semibold mb-1">Gérer le stock - {selectedPiece.reference}</h3>
                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">{selectedPiece.designation}</p>

                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-slate-400">Stock actuel:</span>
                                <span className="font-bold">{selectedPiece.stock_actuel} unités</span>
                            </div>
                            <div className="flex justify-between mt-1">
                                <span className="text-gray-600 dark:text-slate-400">Stock minimum:</span>
                                <span>{selectedPiece.stock_minimum} unités</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setStockOperation({ ...stockOperation, type: 'add' })}
                                    className={`flex-1 py-2 rounded-lg border text-sm font-medium inline-flex items-center justify-center gap-1.5 ${stockOperation.type === 'add' ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-slate-300'}`}
                                >
                                    <AppIcon icon={PlusIcon} size="xs" />
                                    Ajouter
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStockOperation({ ...stockOperation, type: 'remove' })}
                                    className={`flex-1 py-2 rounded-lg border text-sm font-medium inline-flex items-center justify-center gap-1.5 ${stockOperation.type === 'remove' ? 'bg-red-600 border-red-600 text-white' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-slate-300'}`}
                                >
                                    <AppIcon icon={MinusIcon} size="xs" />
                                    Retirer
                                </button>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Quantité</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={stockOperation.quantite}
                                    onChange={(e) => setStockOperation({ ...stockOperation, quantite: parseInt(e.target.value) || 1 })}
                                    className="form-input w-full"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border-light dark:border-border-dark">
                            <Button
                                variant="ghost"
                                onClick={() => { setShowStockModal(false); setSelectedPiece(null); setError(null); }}
                            >
                                Annuler
                            </Button>
                            <Button onClick={handleUpdateStock}>
                                Valider
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AppPage>
    );
};

export default GestionStockPieces;
