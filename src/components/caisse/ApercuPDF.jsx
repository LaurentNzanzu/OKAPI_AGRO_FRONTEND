// frontend/src/components/caisse/ApercuPDF.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { caisseService } from '../../services/caisse';
import Button from '../ui/Button';

export const ApercuPDF = ({ idMouvement, onClose }) => {
    const { t } = useTranslation();
    const [pdfUrl, setPdfUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPDF = async () => {
            try {
                setLoading(true);
                const blob = await caisseService.downloadPDF(idMouvement);
                const url = URL.createObjectURL(blob);
                setPdfUrl(url);
            } catch (err) {
                console.error('Erreur telechargement PDF:', err);
                setError('Impossible de charger le PDF du bon.');
            } finally {
                setLoading(false);
            }
        };

        fetchPDF();

        return () => {
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        };
    }, [idMouvement]);

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold border-b pb-2 mb-4">Aperçu de la Pièce Justificative</h3>
            
            {loading ? (
                <div className="flex justify-center items-center h-96">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                </div>
            ) : error ? (
                <div className="text-center py-8 text-rose-600 bg-rose-50 rounded-lg border border-rose-200">
                    {error}
                </div>
            ) : (
                <div className="flex flex-col h-[70vh]">
                    <iframe
                        src={pdfUrl}
                        title="Bon de caisse"
                        className="w-full flex-1 border rounded-lg"
                    />
                    <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                        <a
                            href={pdfUrl}
                            download={`bon_caisse_${idMouvement}.pdf`}
                            className="btn btn-primary"
                        >
                            Télécharger
                        </a>
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Fermer
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApercuPDF;
