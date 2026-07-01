// frontend/src/pages/CaissePage.jsx
import React, { useState } from 'react';
import { useTranslation } from '../context/LanguageContext';
import GestionCaisse from '../components/caisse/GestionCaisse';
import BonEntreeForm from '../components/caisse/BonEntreeForm';
import RapprochementForm from '../components/caisse/RapprochementForm';
import ApercuPDF from '../components/caisse/ApercuPDF';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';

export const CaissePage = () => {
    const { t } = useTranslation();
    const [showApprovisionner, setShowApprovisionner] = useState(false);
    const [showRapprochement, setShowRapprochement] = useState(false);
    const [viewPDFId, setViewPDFId] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleSuccess = () => {
        setShowApprovisionner(false);
        setShowRapprochement(false);
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-primary-100 dark:bg-primary-900/30 p-2.5 rounded-lg text-primary-600 dark:text-primary-400">
                        <CurrencyDollarIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold dark:text-white">Gestion de la Trésorerie & Caisse</h1>
                        <p className="text-gray-500 dark:text-slate-400 text-sm">
                            Suivi des flux financiers de caisse physique, BEC/BSC, et rapprochements
                        </p>
                    </div>
                </div>
            </div>

            <GestionCaisse
                key={refreshKey}
                onApprovisionner={() => setShowApprovisionner(true)}
                onRapprochement={() => setShowRapprochement(true)}
                onViewPDF={(id) => setViewPDFId(id)}
            />

            {/* Modal Approvisionner */}
            {showApprovisionner && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-lg p-6">
                        <BonEntreeForm
                            onClose={() => setShowApprovisionner(false)}
                            onSuccess={handleSuccess}
                        />
                    </div>
                </div>
            )}

            {/* Modal Rapprochement */}
            {showRapprochement && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-lg p-6">
                        <RapprochementForm
                            onClose={() => setShowRapprochement(false)}
                            onSuccess={handleSuccess}
                        />
                    </div>
                </div>
            )}

            {/* Modal PDF Viewer */}
            {viewPDFId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-4xl p-6">
                        <ApercuPDF
                            idMouvement={viewPDFId}
                            onClose={() => setViewPDFId(null)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default CaissePage;
