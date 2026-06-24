// frontend/src/components/ia/AssistantWidget.jsx
import React, { useState } from 'react';
import { iaService } from '../../services/ia';
import { useTranslation } from '../../context/LanguageContext';

const AssistantWidget = ({ onFullPage }) => {
    const { t } = useTranslation();
    const [question, setQuestion] = useState('');
    const [reponse, setReponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const result = await iaService.askAssistant(question);
            setReponse(result.reponse);
        } catch (err) {
            console.error('Erreur assistant:', err);
            setError(err.response?.data?.detail || t('ai.widgetError'));
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-all z-50"
                title={t('ai.assistantButton')}
            >
                <span className="text-2xl">🤖</span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 z-50 overflow-hidden">
            <div className="bg-primary-600 text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    <h3 className="font-semibold">{t('ai.widgetTitle')}</h3>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200" aria-label={t('ai.close')}>
                    ✕
                </button>
            </div>

            <div className="h-80 overflow-y-auto p-4 bg-gray-50 dark:bg-slate-800/50">
                {reponse ? (
                    <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3 mb-3">
                        <p className="text-sm text-gray-800 dark:text-slate-100">{reponse}</p>
                    </div>
                ) : (
                    <div className="text-center text-gray-400 dark:text-slate-500 py-8">
                        <p className="text-4xl mb-2">🤖</p>
                        <p className="text-sm">{t('ai.widgetPlaceholder')}</p>
                        <div className="mt-4 text-xs text-left space-y-1">
                            <p className="font-medium text-gray-500 dark:text-slate-400">{t('ai.examples')}</p>
                            <p>• {t('ai.example1')}</p>
                            <p>• {t('ai.example2')}</p>
                            <p>• {t('ai.example3')}</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 text-red-600 p-2 rounded-lg text-sm mb-3">
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="flex justify-center py-4">
                        <div className="animate-pulse text-primary-600">🤔 {t('ai.widgetAnalyzing')}</div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={t('ai.placeholder')}
                        className="form-input"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !question.trim()}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                        {t('ai.send')}
                    </button>
                </div>
                {onFullPage && (
                    <button
                        type="button"
                        onClick={onFullPage}
                        className="mt-2 text-xs text-primary-600 hover:text-primary-600 w-full text-center"
                    >
                        {t('ai.openFullscreen')}
                    </button>
                )}
            </form>
        </div>
    );
};

export default AssistantWidget;
