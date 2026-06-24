// frontend/src/components/profil/Profil.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { utilisateursService } from '../../services/utilisateurs';
import { useNavigate } from 'react-router-dom';
import {
    UserIcon,
    EnvelopeIcon,
    PhoneIcon,
    IdentificationIcon,
    CalendarIcon,
    CheckBadgeIcon,
    PencilSquareIcon,
    CheckCircleIcon,
    XCircleIcon,
    EyeIcon,
    EyeSlashIcon
} from '@heroicons/react/24/outline';

const Profil = () => {
  const { t } = useTranslation();
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        prenom: '',
        nom: '',
        telephone: '',
        email: ''
    });
    const [passwordData, setPasswordData] = useState({
        ancien_mot_de_passe: '',
        nouveau_mot_de_passe: '',
        confirmation_mot_de_passe: ''
    });
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (user) {
            setFormData({
                prenom: user.prenom || '',
                nom: user.nom || '',
                telephone: user.telephone || '',
                email: user.email || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
        
        // Effacer le message d'erreur quand l'utilisateur commence à taper
        if (message.type === 'error') {
            setMessage({ type: '', text: '' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await utilisateursService.update(user.id, formData);
            if (response) {
                await updateUser();
                setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
                setIsEditing(false);
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            }
        } catch (error) {
            console.error('Erreur mise à jour profil:', error);
            let errorMessage = 'Erreur lors de la mise à jour';
            if (error.response?.data?.detail) {
                if (typeof error.response.data.detail === 'string') {
                    errorMessage = error.response.data.detail;
                } else if (Array.isArray(error.response.data.detail)) {
                    errorMessage = error.response.data.detail.map(d => d.msg).join(', ');
                }
            }
            setMessage({ type: 'error', text: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    // ✅ CORRECTION : Fonction pour changer le mot de passe
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        
        // Validation des champs
        if (!passwordData.ancien_mot_de_passe) {
            setMessage({ type: 'error', text: 'Veuillez entrer votre ancien mot de passe' });
            return;
        }
        
        if (!passwordData.nouveau_mot_de_passe) {
            setMessage({ type: 'error', text: 'Veuillez entrer un nouveau mot de passe' });
            return;
        }
        
        if (passwordData.nouveau_mot_de_passe !== passwordData.confirmation_mot_de_passe) {
            setMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas' });
            return;
        }
        
        if (passwordData.nouveau_mot_de_passe.length < 6) {
            setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères' });
            return;
        }
        
        if (passwordData.nouveau_mot_de_passe === passwordData.ancien_mot_de_passe) {
            setMessage({ type: 'error', text: 'Le nouveau mot de passe doit être différent de l\'ancien' });
            return;
        }
        
        setLoading(true);
        try {
            // Appel API avec le bon format
            await utilisateursService.changePassword({
                ancien_mot_de_passe: passwordData.ancien_mot_de_passe,
                nouveau_mot_de_passe: passwordData.nouveau_mot_de_passe
            });
            
            setMessage({ type: 'success', text: 'Mot de passe modifié avec succès !' });
            
            // Réinitialiser le formulaire
            setPasswordData({
                ancien_mot_de_passe: '',
                nouveau_mot_de_passe: '',
                confirmation_mot_de_passe: ''
            });
            setShowPasswordForm(false);
            
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            console.error('Erreur changement mot de passe:', error);
            let errorMessage = 'Erreur lors du changement de mot de passe';
            if (error.response?.data?.detail) {
                if (typeof error.response.data.detail === 'string') {
                    errorMessage = error.response.data.detail;
                } else if (Array.isArray(error.response.data.detail)) {
                    errorMessage = error.response.data.detail.map(d => d.msg).join(', ');
                }
            }
            setMessage({ type: 'error', text: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    const getRoleLabel = () => {
        const role = user?.roles?.[0] || user?.role?.nom || 'USER';
        const roleUpper = String(role).toUpperCase();
        const labels = {
            'ADMIN': 'Administrateur',
            'DG': 'Directeur Général',
            'COMPTABLE': 'Comptable',
            'TECHNICIEN': 'Technicien',
            'CAISSE': 'Caisse',
            'MAGASINIER': 'Magasinier'
        };
        return labels[roleUpper] || roleUpper;
    };

    const getRoleColor = () => {
        const role = user?.roles?.[0] || user?.role?.nom || 'USER';
        const roleUpper = String(role).toUpperCase();
        const colors = {
            'ADMIN': 'bg-purple-100 text-purple-800',
            'DG': 'bg-blue-100 text-blue-800',
            'COMPTABLE': 'bg-green-100 text-green-800',
            'TECHNICIEN': 'bg-orange-100 text-orange-800',
            'CAISSE': 'bg-cyan-100 text-cyan-800',
            'MAGASINIER': 'bg-teal-100 text-teal-800'
        };
        return colors[roleUpper] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
                    ← Retour
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
            </div>

            {message.text && (
                <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                    message.type === 'success' 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {message.type === 'success' 
                        ? <CheckCircleIcon className="w-5 h-5" /> 
                        : <XCircleIcon className="w-5 h-5" />
                    }
                    {message.text}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* En-tête avec avatar */}
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-8">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-3xl font-bold text-primary-600">
                                {formData.prenom?.charAt(0)}{formData.nom?.charAt(0)}
                            </span>
                        </div>
                        <div className="text-white">
                            <h2 className="text-2xl font-bold">{formData.prenom} {formData.nom}</h2>
                            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getRoleColor()}`}>
                                {getRoleLabel()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Informations personnelles */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-gray-500" />
                            Informations personnelles
                        </h3>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition"
                            >
                                <PencilSquareIcon className="w-4 h-4" />
                                Modifier
                            </button>
                        )}
                    </div>

                    {isEditing ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                                    <input
                                        type="text"
                                        name="prenom"
                                        value={formData.prenom}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                                    <input
                                        type="text"
                                        name="nom"
                                        value={formData.nom}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                <input
                                    type="tel"
                                    name="telephone"
                                    value={formData.telephone}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                                    disabled
                                />
                                <p className="text-xs text-gray-400 mt-1">L'email ne peut pas être modifié</p>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                                >
                                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <IdentificationIcon className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-600 w-32">Prénom et Nom :</span>
                                <span className="text-gray-800 font-medium">{formData.prenom} {formData.nom}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <PhoneIcon className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-600 w-32">Téléphone :</span>
                                <span className="text-gray-800">{formData.telephone || 'Non renseigné'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-600 w-32">Email :</span>
                                <span className="text-gray-800">{formData.email}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CalendarIcon className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-600 w-32">Dernière connexion :</span>
                                <span className="text-gray-800">{user?.last_login ? new Date(user.last_login).toLocaleString('fr-FR') : 'Première connexion'}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Section changement de mot de passe */}
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <CheckBadgeIcon className="w-5 h-5 text-gray-500" />
                            Sécurité
                        </h3>
                        {!showPasswordForm && (
                            <button
                                onClick={() => setShowPasswordForm(true)}
                                className="text-sm text-primary-600 hover:text-primary-700"
                            >
                                Changer le mot de passe →
                            </button>
                        )}
                    </div>

                    {showPasswordForm && (
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ancien mot de passe</label>
                                <div className="relative">
                                    <input
                                        type={showOldPassword ? "text" : "password"}
                                        name="ancien_mot_de_passe"
                                        value={passwordData.ancien_mot_de_passe}
                                        onChange={handlePasswordChange}
                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowOldPassword(!showOldPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        {showOldPassword ? <EyeSlashIcon className="w-4 h-4 text-gray-400" /> : <EyeIcon className="w-4 h-4 text-gray-400" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        name="nouveau_mot_de_passe"
                                        value={passwordData.nouveau_mot_de_passe}
                                        onChange={handlePasswordChange}
                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        {showNewPassword ? <EyeSlashIcon className="w-4 h-4 text-gray-400" /> : <EyeIcon className="w-4 h-4 text-gray-400" />}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Minimum 6 caractères</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le nouveau mot de passe</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmation_mot_de_passe"
                                        value={passwordData.confirmation_mot_de_passe}
                                        onChange={handlePasswordChange}
                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        {showConfirmPassword ? <EyeSlashIcon className="w-4 h-4 text-gray-400" /> : <EyeIcon className="w-4 h-4 text-gray-400" />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPasswordForm(false);
                                        setPasswordData({
                                            ancien_mot_de_passe: '',
                                            nouveau_mot_de_passe: '',
                                            confirmation_mot_de_passe: ''
                                        });
                                        setMessage({ type: '', text: '' });
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition"
                                >
                                    {loading ? 'Changement...' : 'Changer le mot de passe'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profil;