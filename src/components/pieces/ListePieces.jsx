import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import AppPage from '../ui/AppPage';
import PageHeader from '../ui/PageHeader';
import StatCard from '../ui/StatCard';
import Card from '../ui/Card';
import Input from '../ui/Input';
import { piecesService } from '../../services/pieces';
import { formatPrice } from '../../utils/formatters';
import { CubeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import {
  AppIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  StatusBadge,
} from '../ui/icons';

const ListePieces = () => {
  const { t } = useTranslation();
    const [pieces, setPieces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLowStock, setFilterLowStock] = useState(false);
    const [error, setError] = useState(null);

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
            setError('Impossible de charger le catalogue');
        } finally {
            setLoading(false);
        }
    };

    const getFilteredPieces = () => {
        let filtered = [...pieces];

        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.designation.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterLowStock) {
            filtered = filtered.filter(p => p.stock_actuel < p.stock_minimum);
        }

        return filtered;
    };

    const isLowStock = (piece) => piece.stock_actuel < piece.stock_minimum;

    const filteredPieces = getFilteredPieces();
    const lowStockCount = pieces.filter(p => isLowStock(p)).length;
    const totalValue = pieces.reduce((sum, p) => sum + (p.stock_actuel * (p.prix_achat || 0)), 0);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-petrol"></div>
                <span className="ml-2 text-gray-500 dark:text-slate-400">Chargement...</span>
            </div>
        );
    }

    return (
        <AppPage>
            <PageHeader
                title="Catalogue des pièces de rechange"
                subtitle={`${pieces.length} pièce(s) enregistrée(s) • ${lowStockCount} alerte(s) stock`}
                icon={ArchiveBoxIcon}
            />

            <div className="app-stats-grid">
                <StatCard label="Total pièces" value={pieces.length} icon={CubeIcon} />
                <StatCard
                    label="Alertes stock"
                    value={lowStockCount}
                    icon={ExclamationTriangleIcon}
                    accent={lowStockCount > 0 ? 'danger' : 'success'}
                />
                <StatCard label="Valeur stock" value={formatPrice(totalValue)} icon={CubeIcon} />
                <StatCard label="Résultats filtrés" value={filteredPieces.length} icon={MagnifyingGlassIcon} />
            </div>

            <Card compact>
                <div className="app-filter-bar">
                    <div className="app-filter-field min-w-[200px] md:max-w-md">
                        <Input
                            placeholder="Rechercher par référence ou désignation..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <label className="flex items-center gap-2 h-10 px-1 shrink-0">
                        <input
                            type="checkbox"
                            checked={filterLowStock}
                            onChange={(e) => setFilterLowStock(e.target.checked)}
                            className="w-4 h-4 text-petrol rounded border-gray-300 dark:border-slate-700 focus:ring-petrol/20"
                        />
                        <span className="text-sm text-gray-600 dark:text-slate-300 inline-flex items-center gap-1.5">
                            <AppIcon icon={ExclamationTriangleIcon} size="xs" />
                            Afficher uniquement les stocks faibles
                        </span>
                    </label>
                </div>
            </Card>

            {error && (
                <div className="alert-error">{error}</div>
            )}

            {filteredPieces.length === 0 ? (
                <Card>
                    <p className="text-center text-gray-500 dark:text-slate-400 py-8">Aucune pièce trouvée</p>
                </Card>
            ) : (
                <div className="app-content-grid">
                    {filteredPieces.map(piece => {
                        const lowStock = isLowStock(piece);
                        return (
                            <div
                                key={piece.id_piece}
                                className={`app-card app-card-body ${lowStock ? 'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-900/10' : ''}`}
                            >
                                <div className="flex justify-between items-start gap-2 mb-2">
                                    <div className="min-w-0">
                                        <span className="font-mono text-xs text-gray-400 dark:text-slate-500">{piece.reference}</span>
                                        <h3 className="font-semibold text-gray-800 dark:text-slate-100 truncate">{piece.designation}</h3>
                                    </div>
                                    {lowStock && (
                                        <StatusBadge label="Stock faible" Icon={ExclamationTriangleIcon} color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300" />
                                    )}
                                </div>

                                {piece.description && (
                                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">{piece.description}</p>
                                )}

                                <div className="mt-3 grid grid-cols-2 gap-2 text-sm border-t border-border-light dark:border-border-dark pt-3">
                                    <div>
                                        <p className="text-gray-400 dark:text-slate-500 text-xs">Prix achat</p>
                                        <p className="font-medium text-petrol">{formatPrice(piece.prix_achat)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 dark:text-slate-500 text-xs">Stock</p>
                                        <p className={`font-medium ${lowStock ? 'text-red-600' : 'text-gray-800 dark:text-slate-200'}`}>
                                            {piece.stock_actuel} / {piece.stock_minimum} (min)
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 dark:text-slate-500 text-xs">Fournisseur</p>
                                        <p className="text-gray-700 dark:text-slate-300 truncate">{piece.fournisseur_principal || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 dark:text-slate-500 text-xs">Délai livraison</p>
                                        <p className="text-gray-700 dark:text-slate-300">{piece.delai_livraison_jours} jours</p>
                                    </div>
                                </div>

                                {piece.compatible_avec && (
                                    <div className="mt-2 text-xs text-gray-400 dark:text-slate-500 border-t border-border-light dark:border-border-dark pt-2 inline-flex items-center gap-1">
                                        <AppIcon icon={LinkIcon} size="xs" />
                                        Compatible: {piece.compatible_avec}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </AppPage>
    );
};

export default ListePieces;
