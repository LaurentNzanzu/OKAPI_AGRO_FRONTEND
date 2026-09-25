import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PHONE_PREFIXES, cleanLocalPhone, splitPhone, buildPhone, userErrorMessage } from './utilisateurForm';
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
    const { hasPermission } = useAuth();
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
        post_nom: ''
    });
    const [phonePrefix, setPhonePrefix] = useState('+243');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [createdUser, setCreatedUser] = useState(null);
    const [copied, setCopied] = useState(false);
    const [copyError, setCopyError] = useState(null);
    const [saving, setSaving] = useState(false);
    const submitting = useRef(false);
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
            setError(userErrorMessage(err, t('userWorkflow.loadError')));
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
        if (submitting.current) return;
        setError(null);
        
        // ✅ Validation des données avant envoi
        if (!formData.role_id) {
            setError(t('userWorkflow.selectRole'));
            setTimeout(() => setError(null), 3000);
            return;
        }
        
        const originalPhone = editingUser ? splitPhone(editingUser.telephone || '') : null;
        const phoneUnchanged = originalPhone && phonePrefix === originalPhone.prefix && phoneNumber === originalPhone.number;
        const telephone = buildPhone(phonePrefix, phoneNumber);
        if (!phoneUnchanged && telephone === undefined) {
            setError(t('userWorkflow.invalidPhone'));
            return;
        }
        const payload = { ...formData, telephone };
        if (phoneUnchanged) delete payload.telephone;
        submitting.current = true;
        setSaving(true);
        try {
            if (editingUser) {
                await utilisateursService.update(editingUser.id, payload);
                setSuccess(t('userWorkflow.updated'));
            } else {
                const created = await utilisateursService.create(payload);
                setCreatedUser(created);
                setCopied(false);
                setCopyError(null);
                setSuccess(null);
            }
            setShowModal(false);
            setFormData({ email: '', nom: '', prenom: '', telephone: '', role_id: '', post_nom: '' });
            setEditingUser(null);
            fetchUtilisateurs();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            // ✅ Extraction correcte du message d'erreur
            let errorMessage = t('userWorkflow.saveError');
            
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
        } finally {
            submitting.current = false;
            setSaving(false);
        }
    };
    const handleToggleActif = async (id, actif) => {
        try {
            await utilisateursService.toggleActif(id, !actif);
            fetchUtilisateurs();
        } catch (err) {
            setError(userErrorMessage(err, t('userWorkflow.saveError')));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer définitivement cet utilisateur ?')) return;
        try {
            await utilisateursService.delete(id);
            fetchUtilisateurs();
        } catch (err) {
            setError(userErrorMessage(err, t('userWorkflow.saveError')));
        }
    };

    if (loading && !createdUser && !showModal) {
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
                            setFormData({ email: '', nom: '', prenom: '', telephone: '', role_id: '', post_nom: '' });
                            setPhonePrefix('+243');
                            setPhoneNumber('');
                            setError(null);
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
                                    <td className="px-4 py-3 text-sm"><Link className="text-primary-600 hover:underline" to={`/utilisateurs/${u.id}`}>{[u.prenom, u.nom, u.post_nom].filter(Boolean).join(' ')}</Link></td>
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
                                                    const phone = splitPhone(u.telephone || '');
                                                    setPhonePrefix(phone.prefix);
                                                    setPhoneNumber(phone.number);
                                                    setError(null);
                                                    setFormData({
                                                        email: u.email,
                                                        nom: u.nom,
                                                        prenom: u.prenom,
                                                        telephone: u.telephone || '',
                                                        role_id: u.role_id,
                                                        post_nom: u.post_nom || ''
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
                    <div role="dialog" aria-modal="true" aria-labelledby="user-form-title" className="modal-panel p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h2 id="user-form-title" className="text-xl font-bold mb-4 text-gray-900 dark:text-slate-100">
                            {editingUser ? t('userWorkflow.editTitle') : t('userWorkflow.addTitle')}
                        </h2>
                        {error && <div role="alert" className="alert-error">{error}</div>}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="user-email" className="form-label">{t('userWorkflow.email')} *</label>
                                <input
                                    type="email"
                                    required
                                    id="user-email" value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="form-input"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="user-prenom" className="form-label">{t('userWorkflow.prenom')} *</label>
                                    <input
                                        required
                                        id="user-prenom" value={formData.prenom}
                                        onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                                        className="form-input"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="user-nom" className="form-label">{t('userWorkflow.nom')} *</label>
                                    <input
                                        required
                                        id="user-nom" value={formData.nom}
                                        onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                        className="form-input"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="user-post-nom" className="form-label">{t('userWorkflow.postNom')}</label>
                                <input id="user-post-nom" value={formData.post_nom} onChange={(e) => setFormData({ ...formData, post_nom: e.target.value })} className="form-input" />
                            </div>
                            <div>
                                <label htmlFor="user-phone-number" className="form-label">{t('userWorkflow.telephone')}</label>
                                <div className="flex gap-2">
                                    <input aria-label={t('userWorkflow.prefix')} list="user-phone-prefixes" value={phonePrefix}
                                        onChange={(e) => setPhonePrefix('+' + e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                                        className="form-input w-28 shrink-0" inputMode="tel" maxLength={4} />
                                    <datalist id="user-phone-prefixes">{PHONE_PREFIXES.map((prefix) => <option key={prefix} value={prefix} />)}</datalist>
                                    <input id="user-phone-number" type="text" inputMode="numeric" pattern={editingUser && phoneNumber === splitPhone(editingUser.telephone || '').number ? undefined : '[0-9]{1,10}'} maxLength={10}
                                        value={phoneNumber} onChange={(e) => setPhoneNumber(cleanLocalPhone(e.target.value))}
                                        className="form-input min-w-0" aria-describedby="user-phone-help" />
                                </div>
                                <p id="user-phone-help" className="text-xs text-gray-500 mt-1">{t('userWorkflow.phoneHelp')}</p>
                            </div>
                            <div>
                                <label htmlFor="user-role" className="form-label">{t('userWorkflow.role')} *</label>
                                <select
                                    id="user-role"
                                    required
                                    value={formData.role_id}
                                    onChange={(e) => setFormData({ ...formData, role_id: parseInt(e.target.value) })}
                                    className="form-input"
                                >
                                    <option value="">{t('userWorkflow.selectRole')}</option>
                                    {roles.map((r) => (
                                        <option key={r.id_role} value={r.id_role}>
                                            {r.nom}  
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" disabled={saving} onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded">{t('userWorkflow.cancel')}</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">
                                    {saving ? t('userWorkflow.saving') : editingUser ? t('userWorkflow.save') : t('userWorkflow.create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {createdUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div role="dialog" aria-modal="true" aria-labelledby="created-user-title"
                        onKeyDown={(e) => { if (e.key === 'Escape') { setCreatedUser(null); setCopied(false); setCopyError(null); } }}
                        className="modal-panel p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h2 id="created-user-title" className="text-xl font-bold mb-4">{t('userWorkflow.created')}</h2>
                        <dl className="space-y-2 break-words">
                            <dt className="font-medium">{t('userWorkflow.fullName')}</dt>
                            <dd>{[createdUser.prenom, createdUser.nom, createdUser.post_nom].filter(Boolean).join(' ')}</dd>
                            <dt className="font-medium">{t('userWorkflow.email')}</dt><dd>{createdUser.email}</dd>
                            <dt className="font-medium">{t('userWorkflow.telephone')}</dt><dd>{createdUser.telephone || '—'}</dd>
                            <dt className="font-medium">{t('userWorkflow.role')}</dt><dd>{createdUser.role_nom}</dd>
                            <dt className="font-medium">{t('userWorkflow.temporaryPassword')}</dt>
                            <dd className="font-mono select-all p-3 bg-gray-100 dark:bg-slate-800 rounded">{createdUser.mot_de_passe_temporaire}</dd>
                        </dl>
                        <p className="my-4 text-sm">{t('userWorkflow.credentialsWarning')}</p>
                        {copyError && <p role="alert" className="alert-error">{copyError}</p>}
                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(createdUser.mot_de_passe_temporaire);
                                    setCopied(true);
                                    setCopyError(null);
                                } catch {
                                    setCopyError(t('userWorkflow.copyError'));
                                }
                            }}>{copied ? t('userWorkflow.copied') : t('userWorkflow.copyPassword')}</Button>
                            <Button autoFocus onClick={() => { setCreatedUser(null); setCopied(false); setCopyError(null); }}>{t('userWorkflow.close')}</Button>
                        </div>
                    </div>
                </div>
            )}
        </AppPage>
    );
};

export default GestionUtilisateurs;