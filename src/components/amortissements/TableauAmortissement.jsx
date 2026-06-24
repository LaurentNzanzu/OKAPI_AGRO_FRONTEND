import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { amortissementsService } from '../../services/amortissements';
import { formatPrice } from '../../utils/formatters';
import { useTranslation } from '../../context/LanguageContext';
import { Box, Typography, Button, Switch, FormControlLabel } from '@mui/material';
import { Download, Print } from '@mui/icons-material';

const TableauAmortissement = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const [plan, setPlan] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFiscal, setShowFiscal] = useState(true);

    useEffect(() => {
        if (id) {
            setLoading(true);
            amortissementsService.getPlan(id)
                .then(res => setPlan(res?.data || res || []))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [id]);

    const handleExportCSV = () => {
        if (plan.length === 0) return;
        const headers = [
            t('amortissementsTableau.colAnnee'),
            t('amortissementsTableau.colVncDebut'),
            t('amortissementsTableau.colAnnuite'),
            t('amortissementsTableau.colCumul'),
            t('amortissementsTableau.colVncFin'),
        ];
        if (showFiscal) {
            headers.splice(3, 0,
                t('amortissementsTableau.colAnnuiteFiscale'),
                t('amortissementsTableau.colEcart'),
                t('amortissementsTableau.colCumulFiscal'),
                t('amortissementsTableau.colVncFinFiscale'),
            );
        }

        const rows = plan.map(row => {
            const base = [
                row.annee,
                formatPrice(row.vnc_debut_c),
                formatPrice(row.annuite_c),
                formatPrice(row.cumul_c),
                formatPrice(row.vnc_fin_c)
            ];
            if (showFiscal) {
                const fiscal = [
                    formatPrice(row.annuite_f),
                    formatPrice(row.ecart),
                    formatPrice(row.cumul_f),
                    formatPrice(row.vnc_fin_f)
                ];
                base.splice(3, 0, ...fiscal);
            }
            return base.map(val => `"${val}"`).join(',');
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `plan_amortissement_${id}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}>{t('amortissementsTableau.loading')}</Box>;
    if (plan.length === 0) return <Box sx={{ p: 4, textAlign: 'center' }}>{t('amortissementsTableau.empty')}</Box>;

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">{t('amortissementsTableau.title')}</Typography>
                <Box>
                    <FormControlLabel
                        control={<Switch checked={showFiscal} onChange={(e) => setShowFiscal(e.target.checked)} />}
                        label={t('amortissementsTableau.fiscalData')}
                    />
                    <Button startIcon={<Download />} onClick={handleExportCSV} sx={{ mr: 1 }}>CSV</Button>
                    <Button startIcon={<Print />} onClick={() => window.print()}>{t('print')}</Button>
                </Box>
            </Box>

            <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#e3f2fd' }}>
                            <th style={{ padding: '10px', textAlign: 'left' }}>{t('amortissementsTableau.colAnnee')}</th>
                            <th style={{ padding: '10px', textAlign: 'right' }}>{t('amortissementsTableau.colVncDebut')}</th>
                            <th style={{ padding: '10px', textAlign: 'right' }}>{t('amortissementsTableau.colAnnuite')}</th>
                            {showFiscal && <>
                                <th style={{ padding: '10px', textAlign: 'right' }}>{t('amortissementsTableau.colAnnuiteFiscale')}</th>
                                <th style={{ padding: '10px', textAlign: 'right' }}>{t('amortissementsTableau.colEcart')}</th>
                                <th style={{ padding: '10px', textAlign: 'right' }}>{t('amortissementsTableau.colCumulFiscal')}</th>
                                <th style={{ padding: '10px', textAlign: 'right' }}>{t('amortissementsTableau.colVncFinFiscale')}</th>
                            </>}
                            <th style={{ padding: '10px', textAlign: 'right' }}>{t('amortissementsTableau.colCumul')}</th>
                            <th style={{ padding: '10px', textAlign: 'right' }}>{t('amortissementsTableau.colVncFin')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {plan.map((row, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '8px' }}>{row.annee}</td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>{formatPrice(row.vnc_debut_c)}</td>
                                <td style={{ padding: '8px', textAlign: 'right', color: 'green' }}>{formatPrice(row.annuite_c)}</td>
                                {showFiscal && <>
                                    <td style={{ padding: '8px', textAlign: 'right' }}>{formatPrice(row.annuite_f)}</td>
                                    <td style={{ padding: '8px', textAlign: 'right', color: 'red' }}>{formatPrice(row.ecart)}</td>
                                    <td style={{ padding: '8px', textAlign: 'right' }}>{formatPrice(row.cumul_f)}</td>
                                    <td style={{ padding: '8px', textAlign: 'right' }}>{formatPrice(row.vnc_fin_f)}</td>
                                </>}
                                <td style={{ padding: '8px', textAlign: 'right' }}>{formatPrice(row.cumul_c)}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{formatPrice(row.vnc_fin_c)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Box>
        </Box>
    );
};
export default TableauAmortissement;
