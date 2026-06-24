import React, { useState, useEffect } from 'react';
import {
  PencilSquareIcon,
  TrashIcon,
  NoSymbolIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import AppPage from '../ui/AppPage';
import PageHeader from '../ui/PageHeader';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { UsersIcon } from '@heroicons/react/24/outline';
import { AppIcon, PlusIcon } from '../ui/icons';
import { utilisateursService } from '../../services/utilisateurs';
import { getRoles } from '../../services/roles';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const actionBtnIcon =
  'inline-flex items-center justify-center h-9 w-9 rounded-lg border transition-colors shrink-0';
const actionBtnText =
  'inline-flex items-center justify-center gap-1.5 h-9 px-2.5 rounded-lg border text-xs font-medium transition-colors shrink-0 whitespace-nowrap';

const GestionUtilisateurs = () => {
    const { user, hasPermission } = useAuth();
    const { t } = useLanguage();
    const [utilisateurs, setUtilisateurs] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        nom: '',
        prenom: '',
        telephone: '',
        role_id: '',
        mot_de_passe: ''
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchUtilisateurs();
        fetchRoles();
    }, []);

    const fetchUtilisateurs = async () => {
        try {
            setLoading(true);
            const data = await utilisateursService.getAll();
            setUtilisateurs(data.items || []);
        } catch (err) {
            setError('Erreur chargement utilisateurs');
        } finally {
            setLoading(false);
        }
    };

    // frontend/src/components/utilisateurs/GestionUtilisateurs.jsx

    const fetchRoles = async () => {
        try {
            const data = await getRoles();
            
            
            
            setRoles(data);
            
        } catch (err) {
            console.error('Erreur chargement rôles:', err);
            setRoles([
                { id_role: 1, nom: "ADMIN" },
                { id_role: 2, nom: "DG" },
                { id_role: 3, nom: "COMPTABLE" },
                { id_role: 4, nom: "TECHNICIEN" },
                { id_role: 5, nom: "CAISSE" },
                { id_role: 6, nom: "MAGASINIER" }
            ]);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // ✅ Validation des données avant envoi
        if (!formData.role_id) {
            setError('Veuillez sélectionner un rôle');
            setTimeout(() => setError(null), 3000);
            return;
        }
        
        try {
            if (editingUser) {
                await utilisateursService.update(editingUser.id, formData);
                setSuccess('Utilisateur modifié avec succès');
            } else {
                await utilisateursService.create(formData);
                setSuccess('Utilisateur créé avec succès');
            }
            setShowModal(false);
            setFormData({ email: '', nom: '', prenom: '', telephone: '', role_id: '', mot_de_passe: '' });
            setEditingUser(null);
            fetchUtilisateurs();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            // ✅ Extraction correcte du message d'erreur
            let errorMessage = 'Erreur lors de l\'enregistrement';
            
            if (err.response?.data?.detail) {
                if (Array.isArray(err.response.data.detail)) {
                    errorMessage = err.response.data.detail.map(e => e.msg || e.message).join(', ');
                } else if (typeof err.response.data.detail === 'string') {
                    errorMessage = err.response.data.detail;
                }
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setError(errorMessage);
            setTimeout(() => setError(null), 5000);
        }
    };
    const handleToggleActif = async (id, actif) => {
        try {
            await utilisateursService.toggleActif(id, !actif);
            fetchUtilisateurs();
        } catch (err) {
            setError('Erreur lors du changement de statut');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer définitivement cet utilisateur ?')) return;
        try {
            await utilisateursService.delete(id);
            fetchUtilisateurs();
        } catch (err) {
            setError('Erreur lors de la suppression');
        }
    };

    if (loading) {
        return <div className="text-center py-12">Chargement...</div>;
    }

    return (
        <AppPage>
            <PageHeader
                title={t('userManagement')}
                subtitle="Administrez les comptes et leurs rôles"
                icon={UsersIcon}
                action={
                    hasPermission('users.create') ? (
                    <Button
                        onClick={() => {
                            setEditingUser(null);
                            setFormData({ email: '', nom: '', prenom: '', telephone: '', role_id: '', mot_de_passe: '' });
                            setShowModal(true);
                        }}
                    >
                        <AppIcon icon={PlusIcon} size="sm" className="text-white" />
                        {t('newUser')}
                    </Button>
                    ) : null
                }
            />

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
                                <th>Nom complet</th>
                                <th>Email</th>
                                <th>Téléphone</th>
                                <th>Rôle</th>
                                <th className="text-center">Statut</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {utilisateurs.map((u) => (
                                <tr key={u.id}>
                                    <td className="px-4 py-3 text-sm">{u.prenom} {u.nom}</td>
                                    <td className="px-4 py-3 text-sm">{u.email}</td>
                                    <td className="px-4 py-3 text-sm">{u.telephone || '-'}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-slate-800">
                                            {u.role_nom}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs ${u.est_actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {u.est_actif ? 'Actif' : 'Inactif'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2 flex-nowrap">
                                            <button
                                                type="button"
                                                title="Modifier"
                                                aria-label="Modifier"
                                                onClick={() => {
                                                    setEditingUser(u);
                                                    setFormData({
                                                        email: u.email,
                                                        nom: u.nom,
                                                        prenom: u.prenom,
                                                        telephone: u.telephone || '',
                                                        role_id: u.role_id,
                                                        mot_de_passe: ''
                                                    });
                                                    setShowModal(true);
                                                }}
                                                className={`${actionBtnIcon} border-border-light dark:border-border-dark text-primary-600 dark:text-primary-200 hover:bg-gray-50 dark:bg-slate-800/50 dark:hover:bg-gray-800`}
                                            >
                                                <PencilSquareIcon className="w-[18px] h-[18px]" />
                                            </button>
                                            <button
                                                type="button"
                                                title={u.est_actif ? 'Désactiver' : 'Activer'}
                                                aria-label={u.est_actif ? 'Désactiver' : 'Activer'}
                                                onClick={() => handleToggleActif(u.id, u.est_actif)}
                                                className={`${actionBtnText} ${
                                                    u.est_actif
                                                        ? 'border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                                                        : 'border-green-200 dark:border-green-800/50 text-success hover:bg-green-50 dark:hover:bg-green-900/20'
                                                }`}
                                            >
                                                {u.est_actif ? (
                                                    <>
                                                        <NoSymbolIcon className="w-4 h-4 shrink-0" />
                                                        <span className="hidden sm:inline">Désactiver</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircleIcon className="w-4 h-4 shrink-0" />
                                                        <span className="hidden sm:inline">Activer</span>
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                title="Supprimer"
                                                aria-label="Supprimer"
                                                onClick={() => handleDelete(u.id)}
                                                className={`${actionBtnIcon} border-red-200 dark:border-red-900/50 text-danger hover:bg-red-50 dark:hover:bg-red-900/20`}
                                            >
                                                <TrashIcon className="w-[18px] h-[18px]" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal Création/Modification */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="modal-panel p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-slate-100">
                            {editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="form-label">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="form-input"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">Prénom *</label>
                                    <input
                                        required
                                        value={formData.prenom}
                                        onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                                        className="form-input"
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Nom *</label>
                                    <input
                                        required
                                        value={formData.nom}
                                        onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                        className="form-input"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Téléphone</label>
                                <input
                                    type="tel"
                                    value={formData.telephone}
                                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                                    className="form-input"
                                />
                            </div>
                            <div>
                                <label className="form-label">Rôle *</label>
                                <select
                                    required
                                    value={formData.role_id}
                                    onChange={(e) => setFormData({ ...formData, role_id: parseInt(e.target.value) })}
                                    className="form-input"
                                >
                                    <option value="">Sélectionner un rôle</option>
                                    {roles.map((r) => (
                                        <option key={r.id_role} value={r.id_role}>
                                            {r.nom}  
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {!editingUser && (
                                <div>
                                    <label className="form-label">Mot de passe *</label>
                                    <input
                                        type="password"
                                        required
                                        value={formData.mot_de_passe}
                                        onChange={(e) => setFormData({ ...formData, mot_de_passe: e.target.value })}
                                        className="form-input"
                                        placeholder="Minimum 6 caractères"
                                    />
                                </div>
                            )}
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded">Annuler</button>
                                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">
                                    {editingUser ? 'Modifier' : 'Créer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppPage>
    );
};

export default GestionUtilisateurs;