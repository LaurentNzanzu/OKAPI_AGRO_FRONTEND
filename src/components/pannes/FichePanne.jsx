import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pannesService } from '../../services/pannes';
import { besoinsService } from '../../services/besoins';
import { maintenancesService } from '../../services/maintenances';
import { useAuth } from '../../hooks/useAuth';
import useBienAccess from '../../hooks/useBienAccess';
import { useTranslation } from '../../context/LanguageContext';
import { normalizeStatusForDisplay } from '../../utils/statusNormalizer';
import { formatDate } from '../../utils/formatters';
import ResoudrePanneModal from './ResoudrePanneModal';
import { StatutPanne } from '../../utils/workflowEnums';
import {
  AppIcon,
  getPanneStatutConfig,
  getMaintenanceStatutConfig,
  PANNE_TYPE_CONFIG,
  StatusBadge,
  ArrowLeftIcon,
  MapPinIcon,
  WrenchScrewdriverIcon,
  BoltIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  HourglassIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ArchiveBoxIcon,
  ClockIcon,
  PencilSquareIcon,
  ArrowDownTrayIcon,
  PlusIcon,
} from '../ui/icons';

const FichePanne = () => {
  const { t } = useTranslation();
  const panneStatutConfig = useMemo(() => getPanneStatutConfig(t), [t]);
  const maintenanceStatutConfig = useMemo(() => getMaintenanceStatutConfig(t), [t]);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { resolveBienFromPanne } = useBienAccess();

  const [panne, setPanne] = useState(null);
  const [bien, setBien] = useState(null);
  const [bienAccessWarning, setBienAccessWarning] = useState(null);
  const [besoins, setBesoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [diagnosticText, setDiagnosticText] = useState('');
  const [maintenances, setMaintenances] = useState([]);
  const [showResoudreModal, setShowResoudreModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchPanneDetails();
  }, [id]);

  const fetchPanneDetails = async () => {
    try {
      setLoading(true);
      setBienAccessWarning(null);

      const panneData = await pannesService.getById(id);
      setPanne(panneData);

      const bienResult = await resolveBienFromPanne(panneData);
      setBien(bienResult.data);
      if (bienResult.error) {
        setBienAccessWarning(bienResult.error);
      }

      const besoinsData = await besoinsService.getByPanneId(id);
      setBesoins(besoinsData);

      try {
        const maintData = await maintenancesService.getByPanne(id);
        setMaintenances(Array.isArray(maintData) ? maintData : []);
      } catch {
        setMaintenances([]);
      }

      setDiagnosticText(panneData.diagnostic || '');
      setError(null);
    } catch (err) {
      if (err.response?.status === 403) {
        setError(t('pannes.fiche.unauthorized'));
      } else {
        setError(t('pannes.fiche.loadError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangerStatut = async (nouveauStatut) => {
    if (!window.confirm(t('pannes.fiche.confirmStatus', { statut: nouveauStatut }))) {
      return;
    }

    try {
      setUpdating(true);
      await pannesService.changerStatut(id, nouveauStatut);
      await fetchPanneDetails();
    } catch (err) {
      alert(t('pannes.fiche.statusChangeError'));
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveDiagnostic = async () => {
    try {
      setUpdating(true);
      await pannesService.update(id, { diagnostic: diagnosticText });
      await fetchPanneDetails();
      setShowDiagnostic(false);
    } catch (err) {
      alert(t('pannes.fiche.diagnosticSaveError'));
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const getStatutActions = () => {
    if (!panne) return null;
    
    const isTechnicien = user?.roles?.some(r => r.toUpperCase() === 'TECHNICIEN');
    const isAdmin = user?.roles?.some(r => r.toUpperCase() === 'ADMIN');
    
    if (!isTechnicien && !isAdmin) return null;

    const actions = [];
    
    if (panne.statut === 'DECLAREE') {
      actions.push({ 
        label: t('pannes.fiche.actionDiagnose'),
        Icon: MagnifyingGlassIcon,
        statut: 'DIAGNOSTIQUEE',
        color: 'bg-primary-600 hover:bg-primary-700' 
      });
    } else if (panne.statut === 'DIAGNOSTIQUEE') {
      actions.push({ 
        label: t('pannes.fiche.actionAwaitParts'),
        Icon: HourglassIcon,
        statut: 'EN_ATTENTE_PIECES',
        color: 'bg-yellow-600 hover:bg-yellow-700' 
      });
      actions.push({ 
        label: t('pannes.fiche.actionCreateNeeds'),
        Icon: DocumentTextIcon,
        action: () => navigate(`/besoins/nouveau?panne_id=${id}`),
        color: 'bg-purple-600 hover:bg-purple-700' 
      });
    } else if (panne.statut === 'EN_ATTENTE_PIECES') {
      actions.push({ 
        label: t('pannes.fiche.actionStartIntervention'),
        Icon: Cog6ToothIcon,
        statut: 'EN_COURS',
        color: 'bg-orange-600 hover:bg-orange-700' 
      });
    } else if (panne.statut === 'EN_COURS') {
      actions.push({ 
        label: t('pannes.fiche.actionClose'),
        Icon: CheckCircleIcon,
        statut: 'TERMINEE',
        color: 'bg-green-600 hover:bg-green-700' 
      });
    }
    
    return actions;
  };

  const maintenanceCorrective = maintenances.find((m) => m.type_maintenance === 'CORRECTIVE') || maintenances[0];
  const canResoudre =
    panne?.statut === StatutPanne.EN_TEST &&
    maintenanceCorrective?.statut === 'TERMINEE' &&
    user?.roles?.some((r) => ['TECHNICIEN', 'ADMIN'].includes(r.toUpperCase()));

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !panne) {
    return (
      <div className="app-page max-w-4xl mx-auto w-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">
            {error || t('pannes.fiche.notFound')}
          </h2>
          <button 
            onClick={() => navigate('/pannes/mes-pannes')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 inline-flex items-center gap-2"
          >
            <AppIcon icon={ArrowLeftIcon} size="sm" className="text-white" />
            {t('pannes.fiche.backToList')}
          </button>
        </div>
      </div>
    );
  }

  const statutActions = getStatutActions();
  const statutConfig = panneStatutConfig[panne.statut];
  const typeConfig = PANNE_TYPE_CONFIG[panne.type_panne] || PANNE_TYPE_CONFIG.AUTRE;

  return (
    <div className="app-page max-w-6xl mx-auto w-full">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/pannes/mes-pannes')}
            className="text-gray-500 hover:text-gray-700 dark:text-slate-300 p-1"
            aria-label={t('common.back')}
          >
            <AppIcon icon={ArrowLeftIcon} size="md" />
          </button>
          <div>
            <h1 className="text-2xl font-bold inline-flex items-center gap-2">
              {typeConfig.Icon && <AppIcon icon={typeConfig.Icon} size="md" />}
              {t('pannes.fiche.title', { id: panne.id_panne })}
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {t('pannes.fiche.declaredOn', { date: formatDate(panne.date_declaration) })}
            </p>
          </div>
        </div>
        {statutConfig ? (
          <StatusBadge label={statutConfig.label} Icon={statutConfig.Icon} color={statutConfig.color} iconSize="sm" />
        ) : (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
            {panne.statut}
          </span>
        )}
      </div>

      {bienAccessWarning && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {bienAccessWarning}
        </div>
      )}

      {/* Informations principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Bien concerné */}
        {bien ? (
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-4">
            <h3 className="font-semibold text-gray-700 dark:text-slate-300 mb-3 inline-flex items-center gap-2">
              <AppIcon icon={MapPinIcon} size="sm" />
              {t('pannes.fiche.assetTitle')}
            </h3>
            <div className="space-y-2 text-sm">
              <p className="font-medium">{bien.marque || bien.fabricant} {bien.modele}</p>
              <p className="text-gray-500 dark:text-slate-400">{bien.type_bien}</p>
              {(bien.numero_serie || bien.immatriculation) && (
                <p className="text-gray-500 dark:text-slate-400">
                  {bien.immatriculation || `SN: ${bien.numero_serie}`}
                </p>
              )}
              {bien.etat && (
                <p className="text-gray-500 dark:text-slate-400">
                  {t('pannes.fiche.state')} : {normalizeStatusForDisplay(bien.etat)}
                </p>
              )}
              {bien.localisation && (
                <p className="text-gray-500 dark:text-slate-400 inline-flex items-center gap-1">
                  <AppIcon icon={MapPinIcon} size="xs" />
                  {bien.localisation}
                </p>
              )}
              <button
                type="button"
                onClick={() => navigate(`/biens/${bien.id_bien}?panne_id=${panne.id_panne}`)}
                className="text-primary-600 hover:text-primary-700 text-xs mt-2"
              >
                {t('pannes.fiche.viewAsset')}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-4">
            <h3 className="font-semibold text-gray-700 dark:text-slate-300 mb-2">{t('pannes.fiche.assetTitle')}</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {bienAccessWarning || t('pannes.fiche.assetUnavailable')}
            </p>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-4">
          <h3 className="font-semibold text-gray-700 dark:text-slate-300 mb-3 inline-flex items-center gap-2">
            <AppIcon icon={WrenchScrewdriverIcon} size="sm" />
            {t('pannes.fiche.details')}
          </h3>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500 dark:text-slate-400">{t('pannes.fiche.type')}:</span> {panne.type_panne}</p>
            <p><span className="text-gray-500 dark:text-slate-400">{t('pannes.fiche.priority')}:</span> {panne.priorite}</p>
            <p><span className="text-gray-500 dark:text-slate-400">{t('pannes.fiche.declaredBy')}:</span> {t('pannes.fiche.technician', { id: panne.id_technicien })}</p>
            {panne.date_debut && (
              <p><span className="text-gray-500 dark:text-slate-400">{t('pannes.fiche.start')}:</span> {formatDate(panne.date_debut)}</p>
            )}
            {panne.cout_total_reparation > 0 && (
              <p className="font-semibold text-green-600 inline-flex items-center gap-1">
                <AppIcon icon={CurrencyDollarIcon} size="xs" />
                {t('pannes.fiche.cost')}: {panne.cout_total_reparation.toLocaleString()} USD
              </p>
            )}
          </div>
        </div>

        {statutActions && statutActions.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-4">
            <h3 className="font-semibold text-gray-700 dark:text-slate-300 mb-3 inline-flex items-center gap-2">
              <AppIcon icon={BoltIcon} size="sm" />
              {t('pannes.fiche.actions')}
            </h3>
            <div className="space-y-2">
              {statutActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => action.action ? action.action() : handleChangerStatut(action.statut)}
                  disabled={updating}
                  className={`w-full px-3 py-2 ${action.color} text-white rounded-lg text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2`}
                >
                  {action.Icon && <AppIcon icon={action.Icon} size="sm" className="text-white" />}
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Maintenance corrective associée */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-4 mb-6">
        <h3 className="font-semibold text-gray-700 dark:text-slate-300 mb-3 inline-flex items-center gap-2">
          <AppIcon icon={WrenchScrewdriverIcon} size="sm" />
          {t('pannes.fiche.maintenanceTitle')}
        </h3>
        {maintenanceCorrective ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <p><span className="text-gray-500">{t('pannes.fiche.maintenanceType')}:</span> CORRECTIVE</p>
            <p>
              <span className="text-gray-500">{t('pannes.fiche.maintenanceStatus')}:</span>{' '}
              {maintenanceStatutConfig[maintenanceCorrective.statut] ? (
                <StatusBadge
                  label={maintenanceStatutConfig[maintenanceCorrective.statut].label}
                  Icon={maintenanceStatutConfig[maintenanceCorrective.statut].Icon}
                  color={maintenanceStatutConfig[maintenanceCorrective.statut].color}
                />
              ) : maintenanceCorrective.statut}
            </p>
            <p><span className="text-gray-500">{t('pannes.fiche.maintenancePlanned')}:</span> {formatDate(maintenanceCorrective.date_planifiee)}</p>
            <p><span className="text-gray-500">{t('pannes.fiche.maintenanceTechnician')}:</span> #{maintenanceCorrective.id_technicien}</p>
            <p className="md:col-span-2 text-gray-600">{maintenanceCorrective.description}</p>
            <button
              type="button"
              onClick={() => navigate(`/maintenances/${maintenanceCorrective.id_maintenance}`)}
              className="text-primary-600 hover:underline text-left"
            >
              {t('pannes.fiche.viewMaintenance')}
            </button>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">{t('pannes.fiche.noMaintenance')}</p>
        )}
        {canResoudre && (
          <button
            type="button"
            onClick={() => setShowResoudreModal(true)}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center gap-2"
            aria-label={t('pannes.fiche.resolve')}
          >
            <AppIcon icon={CheckCircleIcon} size="sm" className="text-white" />
            {t('pannes.fiche.resolve')}
          </button>
        )}
      </div>

      {/* Onglets */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border">
        <div className="border-b">
          <div className="flex gap-4 px-4">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-3 text-sm font-medium border-b-2 inline-flex items-center gap-1.5 ${
                activeTab === 'details' 
                  ? 'border-primary-600 text-primary-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <AppIcon icon={ClipboardDocumentListIcon} size="xs" />
              {t('pannes.fiche.tabDetails')}
            </button>
            <button
              onClick={() => setActiveTab('besoins')}
              className={`px-4 py-3 text-sm font-medium border-b-2 inline-flex items-center gap-1.5 ${
                activeTab === 'besoins' 
                  ? 'border-primary-600 text-primary-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <AppIcon icon={ArchiveBoxIcon} size="xs" />
              {t('pannes.fiche.tabNeeds', { count: besoins.length })}
            </button>
            <button
              onClick={() => setActiveTab('historique')}
              className={`px-4 py-3 text-sm font-medium border-b-2 inline-flex items-center gap-1.5 ${
                activeTab === 'historique' 
                  ? 'border-primary-600 text-primary-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <AppIcon icon={ClockIcon} size="xs" />
              {t('pannes.fiche.tabHistory')}
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Onglet Détails */}
          {activeTab === 'details' && (
            <div className="app-page">
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-slate-300 mb-2">{t('pannes.fiche.descriptionTitle')}</h3>
                <p className="text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg">
                  {panne.description}
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-700 dark:text-slate-300">{t('pannes.fiche.diagnosticTitle')}</h3>
                  {!showDiagnostic && (user?.roles?.some(r => r.toUpperCase() === 'TECHNICIEN')) && (
                    <button
                      onClick={() => setShowDiagnostic(true)}
                      className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                    >
                      <AppIcon icon={PencilSquareIcon} size="xs" />
                      {t('common.edit')}
                    </button>
                  )}
                </div>
                
                {showDiagnostic ? (
                  <div className="space-y-3">
                    <textarea
                      value={diagnosticText}
                      onChange={(e) => setDiagnosticText(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-600"
                      placeholder={t('pannes.fiche.diagnosticPlaceholder')}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveDiagnostic}
                        disabled={updating}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 inline-flex items-center gap-2"
                      >
                        {updating ? t('pannes.fiche.saving') : (
                          <>
                            <AppIcon icon={ArrowDownTrayIcon} size="sm" className="text-white" />
                            {t('common.save')}
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowDiagnostic(false);
                          setDiagnosticText(panne.diagnostic || '');
                        }}
                        className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg">
                    {panne.diagnostic || t('pannes.fiche.noDiagnostic')}
                  </p>
                )}
              </div>

              {panne.solution_apportee && (
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-slate-300 mb-2">{t('pannes.fiche.solutionTitle')}</h3>
                  <p className="text-gray-600 dark:text-slate-300 bg-green-50 p-4 rounded-lg">
                    {panne.solution_apportee}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Onglet Besoins */}
          {activeTab === 'besoins' && (
            <div className="app-page">
              {besoins.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                  <p>{t('pannes.fiche.noNeeds')}</p>
                  {panne.statut === 'DIAGNOSTIQUEE' && (
                    <button
                      onClick={() => navigate(`/besoins/nouveau?panne_id=${id}`)}
                      className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-flex items-center gap-2"
                    >
                      <AppIcon icon={PlusIcon} size="sm" className="text-white" />
                      {t('pannes.fiche.createNeeds')}
                    </button>
                  )}
                </div>
              ) : (
                besoins.map((besoin) => (
                  <div key={besoin.id_besoin} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">{t('pannes.fiche.demand', { num: besoin.numero_demande })}</h4>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                          {t('pannes.fiche.createdOn', { date: formatDate(besoin.date_creation) })}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        besoin.statut === 'APPROUVEE' ? 'bg-green-100 text-green-700' :
                        besoin.statut === 'REJETE' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {besoin.statut}
                      </span>
                    </div>
                    
                    {besoin.lignes && besoin.lignes.length > 0 && (
                      <div className="mt-3">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('pannes.fiche.requestedParts')}</h5>
                        <div className="space-y-1">
                          {besoin.lignes.map((ligne) => (
                            <div key={ligne.id_ligne} className="flex justify-between text-sm bg-gray-50 dark:bg-slate-800/50 p-2 rounded">
                              <span>{ligne.designation_piece} x {ligne.quantite}</span>
                              <span className="font-medium">{ligne.prix_total.toLocaleString()} USD</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t text-right font-semibold">
                          {t('pannes.fiche.total')}: {besoin.montant_total.toLocaleString()} USD
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => navigate(`/besoins/${besoin.id_besoin}`)}
                      className="mt-3 text-sm text-primary-600 hover:text-primary-700"
                    >
                      {t('pannes.fiche.viewDetail')}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Onglet Historique */}
          {activeTab === 'historique' && (
            <div className="space-y-3">
              <div className="border-l-2 border-primary-600 pl-4 py-2">
                <p className="font-medium">{t('pannes.fiche.historyDeclared')}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">{formatDate(panne.date_declaration)}</p>
              </div>
              
              {panne.date_debut && (
                <div className="border-l-2 border-orange-600 pl-4 py-2">
                  <p className="font-medium">{t('pannes.fiche.historyStarted')}</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{formatDate(panne.date_debut)}</p>
                </div>
              )}
              
              {panne.date_fin && (
                <div className="border-l-2 border-green-600 pl-4 py-2">
                  <p className="font-medium">{t('pannes.fiche.historyClosed')}</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{formatDate(panne.date_fin)}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ResoudrePanneModal
        panneId={id}
        isOpen={showResoudreModal}
        onClose={() => setShowResoudreModal(false)}
        onSuccess={fetchPanneDetails}
      />
    </div>
  );
};

export default FichePanne;