// frontend/src/components/parametres/Parametres.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import {
    SunIcon,
    MoonIcon,
    LanguageIcon,
    ComputerDesktopIcon,
    BellIcon,
    ShieldCheckIcon,
    GlobeAltIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

const Parametres = () => {
    const navigate = useNavigate();
    const { language, changeLanguage, t } = useLanguage();
    const [settings, setSettings] = useState({
        theme: 'light',
        language: language,
        notifications: true,
        autoSave: true,
        compactView: false
    });
    const [message, setMessage] = useState({ type: '', text: '' });

    // Charger les paramètres depuis localStorage
    useEffect(() => {
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            setSettings(prev => ({ ...prev, ...parsed, language: language }));
            applyTheme(parsed.theme);
        }
    }, []);

    useEffect(() => {
        setSettings(prev => ({ ...prev, language: language }));
    }, [language]);

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const handleChange = (key, value) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        localStorage.setItem('userSettings', JSON.stringify(newSettings));
        
        if (key === 'theme') {
            applyTheme(value);
        }
        
        if (key === 'language') {
            changeLanguage(value);
        }
        
        setMessage({ type: 'success', text: t('common.success') });
        setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    };

    const themes = [
        { id: 'light', label: t('settings.light'), icon: SunIcon, color: 'bg-yellow-100 text-yellow-700' },
        { id: 'dark', label: t('settings.dark'), icon: MoonIcon, color: 'bg-gray-700 text-white' }
    ];

    const languages = [
        { id: 'fr', label: t('settings.french'), flag: '🇫🇷' },
        { id: 'en', label: t('settings.english'), flag: '🇬🇧' }
    ];

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
                    ← {t('common.cancel')}
                </button>
                <h1 className="text-2xl font-bold text-gray-900">⚙️ {t('settings.title')}</h1>
            </div>

            {message.text && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200 flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5" />
                    {message.text}
                </div>
            )}

            <div className="space-y-4">
                {/* Thème */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <ComputerDesktopIcon className="w-5 h-5 text-gray-500" />
                        <h2 className="text-lg font-semibold text-gray-800">{t('settings.appearance')}</h2>
                    </div>
                    <div className="flex gap-4">
                        {themes.map((theme) => (
                            <button
                                key={theme.id}
                                onClick={() => handleChange('theme', theme.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                                    settings.theme === theme.id
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className={`p-2 rounded-full ${theme.color}`}>
                                    <theme.icon className="w-5 h-5" />
                                </div>
                                <span className="font-medium">{theme.label}</span>
                                {settings.theme === theme.id && (
                                    <CheckCircleIcon className="w-5 h-5 text-primary-500" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Langue */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <LanguageIcon className="w-5 h-5 text-gray-500" />
                        <h2 className="text-lg font-semibold text-gray-800">{t('settings.language')}</h2>
                    </div>
                    <div className="flex gap-4">
                        {languages.map((lang) => (
                            <button
                                key={lang.id}
                                onClick={() => handleChange('language', lang.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                                    settings.language === lang.id
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <span className="text-2xl">{lang.flag}</span>
                                <span className="font-medium">{lang.label}</span>
                                {settings.language === lang.id && (
                                    <CheckCircleIcon className="w-5 h-5 text-primary-500" />
                                )}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                        {t('settings.language')}
                    </p>
                </div>

                {/* Notifications */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <BellIcon className="w-5 h-5 text-gray-500" />
                        <h2 className="text-lg font-semibold text-gray-800">{t('settings.notifications')}</h2>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-800">{t('settings.systemNotifications')}</p>
                            <p className="text-sm text-gray-500">{t('settings.notificationsDesc')}</p>
                        </div>
                        <button
                            onClick={() => handleChange('notifications', !settings.notifications)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                                settings.notifications ? 'bg-primary-500' : 'bg-gray-300'
                            }`}
                        >
                            <span
                                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                    settings.notifications ? 'translate-x-6' : 'translate-x-0.5'
                                }`}
                            />
                        </button>
                    </div>
                </div>

                {/* Préférences d'affichage */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <GlobeAltIcon className="w-5 h-5 text-gray-500" />
                        <h2 className="text-lg font-semibold text-gray-800">{t('settings.display')}</h2>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-800">{t('settings.autoSave')}</p>
                                <p className="text-sm text-gray-500">{t('settings.autoSaveDesc')}</p>
                            </div>
                            <button
                                onClick={() => handleChange('autoSave', !settings.autoSave)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${
                                    settings.autoSave ? 'bg-primary-500' : 'bg-gray-300'
                                }`}
                            >
                                <span
                                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                        settings.autoSave ? 'translate-x-6' : 'translate-x-0.5'
                                    }`}
                                />
                            </button>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div>
                                <p className="font-medium text-gray-800">{t('settings.compactView')}</p>
                                <p className="text-sm text-gray-500">{t('settings.compactViewDesc')}</p>
                            </div>
                            <button
                                onClick={() => handleChange('compactView', !settings.compactView)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${
                                    settings.compactView ? 'bg-primary-500' : 'bg-gray-300'
                                }`}
                            >
                                <span
                                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                        settings.compactView ? 'translate-x-6' : 'translate-x-0.5'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Informations système */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <ShieldCheckIcon className="w-5 h-5 text-gray-500" />
                        <h2 className="text-lg font-semibold text-gray-800">{t('settings.systemInfo')}</h2>
                    </div>
                    <div className="space-y-2 text-sm">
                        <p><span className="text-gray-500">{t('settings.version')} :</span> 1.0.0</p>
                        <p><span className="text-gray-500">{t('settings.lastUpdate')} :</span> 08/06/2026</p>
                        <p><span className="text-gray-500">{t('settings.browser')} :</span> {navigator.userAgent.split(' ').slice(-2).join(' ')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Parametres;