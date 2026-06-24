// frontend/src/components/rapports/ExportRapport.jsx
import React, { useState } from 'react';
import { exporterRapport } from '../../services/rapports';
import { useTranslation } from '../../context/LanguageContext';

const ExportRapport = ({ typeRapport, dateDebut, dateFin, annee, onExportStart, onExportEnd }) => {
    const { t } = useTranslation();
    const [format, setFormat] = useState('pdf');
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState(null);

    const handleExport = async () => {
        setExporting(true);
        setError(null);
        
        if (onExportStart) onExportStart();
        
        try {
            let params = {};
            if (typeRapport === 'amortissements') {
                if (!annee) {
                    throw new Error(t('rapportsExport.selectYear'));
                }
                params = { annee };
            } else {
                if (!dateDebut || !dateFin) {
                    throw new Error(t('rapportsExport.selectPeriod'));
                }
                params = { dateDebut, dateFin };
            }
            
            await exporterRapport(typeRapport, format, params);
            
            if (onExportEnd) onExportEnd(true);
        } catch (err) {
            console.error('Erreur lors de l\'export:', err);
            setError(err.response?.data?.detail || err.message || t('rapportsExport.exportError'));
            if (onExportEnd) onExportEnd(false);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-4">
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('rapportsExport.formatLabel')}</span>
                    <select
                        value={format}
                        onChange={(e) => setFormat(e.target.value)}
                        className="form-input"
                        disabled={exporting}
                    >
                        <option value="pdf">PDF</option>
                        <option value="excel">Excel (.xlsx)</option>
                        <option value="csv">CSV</option>
                    </select>
                </div>
                
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {exporting ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>{t('rapportsExport.exporting')}</span>
                        </>
                    ) : (
                        <>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>{t('export')}</span>
                        </>
                    )}
                </button>
                
                {error && (
                    <div className="text-red-600 text-sm flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExportRapport;
