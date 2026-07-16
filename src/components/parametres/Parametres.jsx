// frontend/src/components/parametres/Parametres.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
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
    const { lang, setLanguage, t } = useLanguage();
    const { theme, setTheme } = useTheme();
    const [settings, setSettings] = useState({
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
            setSettings({
                notifications: parsed.notifications ?? true,
                autoSave: parsed.autoSave ?? true,
                compactView: parsed.compactView ?? false
            });
        }
    }, []);

    const handleChange = (key, value) => {
        if (key === 'theme') {
            setTheme(value);
        } else if (key === 'language') {
            setLanguage(value);
        } else {
            const newSettings = { ...settings, [key]: value };
            setSettings(newSettings);
            localStorage.setItem('userSettings', JSON.stringify(newSettings));
        }
        
        setMessage({ type: 'success', text: t('common.success') || 'Succès' });
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
        <div className="p-4 sm:p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300">
                    ← {t('common.cancel')}
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">⚙️ {t('settings.title')}</h1>
            </div>

            {message.text && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-800 flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    {message.text}
                </div>
            )}

            <div className="space-y-4">
                {/* Thème */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800/80 p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <ComputerDesktopIcon className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-200">{t('settings.appearance')}</h2>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                        {themes.map((themeOption) => (
                            <button
                                key={themeOption.id}
                                onClick={() => handleChange('theme', themeOption.id)}
                                className={`flex items-center justify-between sm:justify-start gap-3 px-4 py-3 rounded-lg border-2 transition-all w-full sm:flex-1 ${
                                    theme === themeOption.id
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20 text-primary-900 dark:text-primary-300'
                                        : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 text-gray-700 dark:text-slate-300'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${themeOption.color}`}>
                                        <themeOption.icon className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium text-sm sm:text-base">{themeOption.label}</span>
                                </div>
                                {theme === themeOption.id && (
                                    <CheckCircleIcon className="w-5 h-5 text-primary-500 shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Langue */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800/80 p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <LanguageIcon className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-200">{t('settings.language')}</h2>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                        {languages.map((langOption) => (
                            <button
                                key={langOption.id}
                                onClick={() => handleChange('language', langOption.id)}
                                className={`flex items-center justify-between sm:justify-start gap-3 px-4 py-3 rounded-lg border-2 transition-all w-full sm:flex-1 ${
                                    lang === langOption.id
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20 text-primary-900 dark:text-primary-300'
                                        : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 text-gray-700 dark:text-slate-300'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{langOption.flag}</span>
                                    <span className="font-medium text-sm sm:text-base">{langOption.label}</span>
                                </div>
                                {lang === langOption.id && (
                                    <CheckCircleIcon className="w-5 h-5 text-primary-500 shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">
                        {t('settings.language')}
                    </p>
                </div>

                {/* Notifications */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800/80 p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <BellIcon className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-200">{t('settings.notifications')}</h2>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <p className="font-medium text-gray-800 dark:text-slate-200">{t('settings.systemNotifications')}</p>
                            <p className="text-sm text-gray-500 dark:text-slate-400">{t('settings.notificationsDesc')}</p>
                        </div>
                        <button
                            onClick={() => handleChange('notifications', !settings.notifications)}
                            className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
                                settings.notifications ? 'bg-primary-500' : 'bg-gray-300 dark:bg-slate-700'
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
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800/80 p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <GlobeAltIcon className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-200">{t('settings.display')}</h2>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                                <p className="font-medium text-gray-800 dark:text-slate-200">{t('settings.autoSave')}</p>
                                <p className="text-sm text-gray-500 dark:text-slate-400">{t('settings.autoSaveDesc')}</p>
                            </div>
                            <button
                                onClick={() => handleChange('autoSave', !settings.autoSave)}
                                className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
                                    settings.autoSave ? 'bg-primary-500' : 'bg-gray-300 dark:bg-slate-700'
                                }`}
                            >
                                <span
                                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                        settings.autoSave ? 'translate-x-6' : 'translate-x-0.5'
                                    }`}
                                />
                            </button>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-800/80 gap-4">
                            <div className="min-w-0">
                                <p className="font-medium text-gray-800 dark:text-slate-200">{t('settings.compactView')}</p>
                                <p className="text-sm text-gray-500 dark:text-slate-400">{t('settings.compactViewDesc')}</p>
                            </div>
                            <button
                                onClick={() => handleChange('compactView', !settings.compactView)}
                                className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
                                    settings.compactView ? 'bg-primary-500' : 'bg-gray-300 dark:bg-slate-700'
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
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800/80 p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <ShieldCheckIcon className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-200">{t('settings.systemInfo')}</h2>
                    </div>
                    <div className="space-y-2 text-sm text-gray-900 dark:text-slate-200">
                        <p><span className="text-gray-500 dark:text-slate-400">{t('settings.version')} :</span> 1.0.0</p>
                        <p><span className="text-gray-500 dark:text-slate-400">{t('settings.lastUpdate')} :</span> 08/06/2026</p>
                        <p><span className="text-gray-500 dark:text-slate-400">{t('settings.browser')} :</span> {navigator.userAgent.split(' ').slice(-2).join(' ')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Parametres;