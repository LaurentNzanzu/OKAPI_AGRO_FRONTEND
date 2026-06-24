// frontend/src/components/ia/AssistantIA.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { iaService } from '../../services/ia';
import { useTranslation } from '../../context/LanguageContext';
import { AppIcon, ArrowLeftIcon, CpuChipIcon, ArrowPathIcon, ChartBarIcon } from '../ui/icons';

const AssistantIA = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        setMessages([{
            id: 1,
            type: 'assistant',
            content: t('ai.welcome'),
        }]);
    }, [t]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || loading) return;

        const userQuestion = inputValue.trim();
        
        setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'user',
            content: userQuestion
        }]);
        
        setInputValue('');
        setLoading(true);

        try {
            const result = await iaService.askAssistant(userQuestion);
            
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'assistant',
                content: result.reponse,
                data: result.donnees
            }]);
        } catch (err) {
            console.error('Erreur assistant:', err);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'assistant',
                content: t('ai.error'),
                isError: true
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setInputValue(suggestion);
    };

    const suggestions = [
        t('ai.suggestion1'),
        t('ai.suggestion2'),
        t('ai.suggestion3'),
        t('ai.suggestion4'),
        t('ai.suggestion5'),
        t('ai.suggestion6'),
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] bg-gray-50 dark:bg-slate-800/50 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
            <div className="bg-primary-600 text-white p-4 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="text-white hover:text-gray-200" aria-label={t('common.back')}>
                    <AppIcon icon={ArrowLeftIcon} size="md" className="text-white" />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <AppIcon icon={CpuChipIcon} size="md" className="text-white" />
                        {t('ai.title')}
                    </h1>
                    <p className="text-sm text-slate-200">{t('ai.subtitle')}</p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="text-white hover:text-gray-200 text-sm"
                    aria-label={t('common.refresh')}
                >
                    <AppIcon icon={ArrowPathIcon} size="sm" className="text-white" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                                msg.type === 'user'
                                    ? 'bg-primary-600 text-white'
                                    : msg.isError
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                                    : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-100'
                            }`}
                        >
                            <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                            
                            {msg.data && msg.data.length > 0 && (
                                <details className="mt-2 text-xs">
                                    <summary className="cursor-pointer opacity-70 flex items-center gap-1">
                                        <AppIcon icon={ChartBarIcon} size="xs" />
                                        {t('ai.seeDetails')}
                                    </summary>
                                    <pre className="mt-1 p-2 bg-gray-100 dark:bg-slate-800 rounded overflow-x-auto">
                                        {JSON.stringify(msg.data, null, 2)}
                                    </pre>
                                </details>
                            )}
                        </div>
                    </div>
                ))}
                
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce delay-100"></div>
                                <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce delay-200"></div>
                                <span className="text-sm text-gray-500 dark:text-slate-400 ml-1">{t('ai.thinking')}</span>
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {messages.length === 1 && (
                <div className="px-4 py-2 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">{t('ai.suggestions')}</p>
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 text-xs rounded-full hover:bg-gray-200 transition"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={t('ai.placeholder')}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !inputValue.trim()}
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition"
                    >
                        {loading ? '...' : t('ai.send')}
                    </button>
                </div>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-2 text-center">
                    {t('ai.footer')}
                </p>
            </form>
        </div>
    );
};

export default AssistantIA;
