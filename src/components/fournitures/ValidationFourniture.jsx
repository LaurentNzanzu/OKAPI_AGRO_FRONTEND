import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fournituresService } from '../../services/fournitures';
import { besoinsService } from '../../services/besoins';
import { piecesService } from '../../services/pieces';
import { pannesService } from '../../services/pannes';
import { biensService } from '../../services/biens';
import { formatDate, formatPrice } from '../../utils/formatters';
import { validateQuantiteFournie } from '../../utils/workflowEnums';
import { useTranslation } from '../../context/LanguageContext';
import LoadingSpinner from '../ui/LoadingSpinner';

/**
 * Modal de validation d'une ligne de fourniture.
 */
const ValidationFourniture = ({ idFourniture: idProp, onClose }) => {
  const { t } = useTranslation();
  const { id: idParam } = useParams();
  const idFourniture = idProp ?? idParam;
  const navigate = useNavigate();
  const handleClose = onClose || ((success) => {
    if (success) navigate('/fournitures/en-attente');
    else navigate(-1);
  });
  const [fourniture, setFourniture] = useState(null);
  const [besoin, setBesoin] = useState(null);
  const [panne, setPanne] = useState(null);
  const [bien, setBien] = useState(null);
  const [piece, setPiece] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState('valider');
  const [quantite, setQuantite] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [motifRefus, setMotifRefus] = useState('');
  const [formError, setFormError] = useState(null);
  const [showPartialConfirm, setShowPartialConfirm] = useState(false);

  useEffect(() => {
    loadData();
  }, [idFourniture]);

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await fournituresService.getEnAttente();
      const f = list.find((x) => x.id_fourniture === Number(idFourniture));
      if (!f) throw new Error(t('fournituresValidation.notFound'));
      setFourniture(f);
      setQuantite(String(f.quantite_demandee));

      const [b, p] = await Promise.all([
        besoinsService.getById(f.id_besoin),
        piecesService.getById(f.id_piece),
      ]);
      setBesoin(b);
      setPiece(p);

      if (b?.id_panne) {
        const panneData = await pannesService.getById(b.id_panne);
        setPanne(panneData);
        if (panneData?.id_bien) {
          const bienData = await biensService.getById(panneData.id_bien);
          setBien(bienData);
        }
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const stockDispo = piece?.stock_actuel ?? 0;
  const qteNum = parseInt(quantite, 10);
  const isPartial = qteNum > 0 && qteNum < (fourniture?.quantite_demandee || 0);

  const submitValider = async () => {
    const err = validateQuantiteFournie(qteNum, fourniture.quantite_demandee, stockDispo);
    if (err) {
      setFormError(err);
      return;
    }
    if (isPartial && !showPartialConfirm) {
      setShowPartialConfirm(true);
      return;
    }
    try {
      setSubmitting(true);
      setFormError(null);
      await fournituresService.valider(idFourniture, qteNum, commentaire || undefined);
      alert(isPartial ? t('fournituresValidation.validateSuccessPartial') : t('fournituresValidation.validateSuccess'));
      handleClose(true);
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitRefuser = async () => {
    if (!motifRefus || motifRefus.trim().length < 3) {
      setFormError(t('fournituresValidation.motifRequired'));
      return;
    }
    try {
      setSubmitting(true);
      await fournituresService.refuser(idFourniture, motifRefus.trim());
      alert(t('fournituresValidation.refuseSuccess'));
      handleClose(true);
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const supplyState = isPartial
    ? t('fournituresValidation.statePartial')
    : qteNum === fourniture?.quantite_demandee
      ? t('fournituresValidation.stateComplete')
      : '—';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="modal-panel bg-white dark:bg-slate-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">{t('fournituresValidation.title', { id: idFourniture })}</h2>
          <button type="button" onClick={() => handleClose(false)} className="text-gray-500 hover:text-gray-700" aria-label={t('prints.close')}>✕</button>
        </div>

        {loading ? (
          <LoadingSpinner message={t('loading')} />
        ) : formError && !fourniture ? (
          <div className="alert-error">{formError}</div>
        ) : (
          <>
            {besoin && (
              <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4 mb-4 text-sm space-y-1">
                <p><strong>{t('fournituresValidation.besoin')}:</strong> {besoin.numero_demande}</p>
                <p><strong>{t('fournituresValidation.date')}:</strong> {formatDate(besoin.date_creation)}</p>
                <p><strong>{t('fournituresValidation.amount')}:</strong> {formatPrice(besoin.montant_total)}</p>
                {panne && (
                  <button type="button" className="text-primary-600 text-xs" onClick={() => navigate(`/pannes/${panne.id_panne}`)}>
                    {t('fournituresValidation.viewPanne', { id: panne.id_panne })}
                  </button>
                )}
              </div>
            )}

            {bien && (
              <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4 mb-4 text-sm">
                <p><strong>{t('fournituresValidation.asset')}:</strong> {bien.marque || bien.fabricant} {bien.modele}</p>
                <p><strong>{t('fournituresValidation.location')}:</strong> {bien.localisation || '—'}</p>
                <p><strong>{t('fournituresValidation.state')}:</strong> {bien.etat}</p>
              </div>
            )}

            {piece && (
              <table className="data-table w-full mb-4 text-sm">
                <thead>
                  <tr>
                    <th>{t('fournituresValidation.colDesignation')}</th>
                    <th>{t('fournituresValidation.colSerial')}</th>
                    <th>{t('fournituresValidation.colRequested')}</th>
                    <th>{t('fournituresValidation.colStock')}</th>
                    <th>{t('fournituresValidation.colToSupply')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{piece.designation}</td>
                    <td>{piece.numero_serie || '—'}</td>
                    <td>{fourniture.quantite_demandee}</td>
                    <td>{stockDispo}</td>
                    <td>
                      {mode === 'valider' ? (
                        <input
                          type="number"
                          min={1}
                          max={Math.min(fourniture.quantite_demandee, stockDispo)}
                          value={quantite}
                          onChange={(e) => setQuantite(e.target.value)}
                          className="form-input w-20"
                        />
                      ) : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            {isPartial && showPartialConfirm && (
              <div className="alert-error mb-3 text-sm">
                {t('fournituresValidation.partialWarning')}
              </div>
            )}

            {formError && <div className="alert-error mb-3 text-sm">{formError}</div>}

            <div className="flex gap-2 mb-4">
              <button type="button" className={mode === 'valider' ? 'btn-primary' : 'btn-secondary'} onClick={() => setMode('valider')}>{t('fournituresValidation.validate')}</button>
              <button type="button" className={mode === 'refuser' ? 'btn-primary' : 'btn-secondary'} onClick={() => setMode('refuser')}>{t('fournituresValidation.refuse')}</button>
            </div>

            {mode === 'valider' ? (
              <>
                <textarea
                  placeholder={t('fournituresValidation.commentPlaceholder')}
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  className="form-input w-full mb-4"
                  rows={2}
                />
                <p className="text-sm text-gray-500 mb-4">
                  {t('fournituresValidation.totalSupplied', { qty: qteNum || 0, state: supplyState })}
                </p>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => handleClose(false)} className="btn-secondary">{t('common.cancel')}</button>
                  <button type="button" disabled={submitting} onClick={submitValider} className="btn-primary">
                    {submitting ? t('fournituresValidation.validating') : t('fournituresValidation.confirmSupply')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <textarea
                  placeholder={t('fournituresValidation.refusePlaceholder')}
                  value={motifRefus}
                  onChange={(e) => setMotifRefus(e.target.value)}
                  className="form-input w-full mb-4"
                  rows={3}
                  required
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => handleClose(false)} className="btn-secondary">{t('common.cancel')}</button>
                  <button type="button" disabled={submitting} onClick={submitRefuser} className="bg-red-600 text-white px-4 py-2 rounded-lg">
                    {submitting ? t('fournituresValidation.refusing') : t('fournituresValidation.confirmRefuse')}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ValidationFourniture;
