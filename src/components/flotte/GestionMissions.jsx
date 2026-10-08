import React, { useCallback, useEffect, useState, useMemo } from 'react';
import AppPage from '../ui/AppPage';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PageLoader from '../common/PageLoader';
import { useAuth } from '../../context/AuthContext';
import missionsService from '../../services/missions';
import vehiculesService from '../../services/vehicules';
import chauffeursService from '../../services/chauffeurs';
import projetsService from '../../services/projets';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TruckIcon,
  UserIcon,
  CalendarDaysIcon,
  MapPinIcon,
  UserGroupIcon,
  PlayIcon,
  XMarkIcon,
  TrashIcon,
  PencilSquareIcon,
  ExclamationTriangleIcon,
} from '../ui/icons';

const STATUTS_MISSION = [
  { value: '', label: 'Tous les statuts' },
  { value: 'BROUILLON', label: 'Brouillon' },
  { value: 'EN_ATTENTE_VALIDATION', label: 'En attente de validation' },
  { value: 'VALIDEE', label: 'Validée' },
  { value: 'PLANIFIEE', label: 'Planifiée' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'TERMINEE', label: 'Terminée' },
  { value: 'REJETEE', label: 'Rejetée' },
  { value: 'ANNULEE', label: 'Annulée' },
];

const getStatutBadge = (statut) => {
  switch (statut) {
    case 'BROUILLON':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          <ClockIcon className="w-3.5 h-3.5" /> Brouillon
        </span>
      );
    case 'EN_ATTENTE_VALIDATION':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
          <ClockIcon className="w-3.5 h-3.5" /> À valider
        </span>
      );
    case 'VALIDEE':
    case 'VALIDEE_LOG':
    case 'VALIDEE_DG':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
          <CheckCircleIcon className="w-3.5 h-3.5" /> Validée
        </span>
      );
    case 'PLANIFIEE':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
          <CalendarDaysIcon className="w-3.5 h-3.5" /> Planifiée
        </span>
      );
    case 'EN_COURS':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 animate-pulse">
          <PlayIcon className="w-3.5 h-3.5" /> En cours
        </span>
      );
    case 'TERMINEE':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
          <CheckCircleIcon className="w-3.5 h-3.5" /> Terminée
        </span>
      );
    case 'REJETEE':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
          <XCircleIcon className="w-3.5 h-3.5" /> Rejetée
        </span>
      );
    case 'ANNULEE':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-600 line-through dark:bg-gray-800 dark:text-gray-400">
          <XMarkIcon className="w-3.5 h-3.5" /> Annulée
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
          {statut}
        </span>
      );
  }
};

const formatDate = (isoStr) => {
  if (!isoStr) return '—';
  try {
    return new Date(isoStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoStr;
  }
};

const GestionMissions = () => {
  const { hasPermission } = useAuth();

  // Permissions
  const canCreate = hasPermission('MISSION_CREATE') || hasPermission('ADMIN');
  const canValidate =
    hasPermission('MISSION_VALIDATE_LOG') ||
    hasPermission('MISSION_VALIDATE_DG') ||
    hasPermission('MISSION_VALIDER') ||
    hasPermission('ADMIN');
  const canAffect = hasPermission('MISSION_AFFECTER') || hasPermission('ADMIN');
  const canClose = hasPermission('MISSION_CLOSE') || hasPermission('ADMIN');
  const canManage = hasPermission('MISSION_MODIFIER') || hasPermission('ADMIN');

  // State
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filtres
  const [statutFilter, setStatutFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [projetFilter, setProjetFilter] = useState('');

  // Références
  const [projets, setProjets] = useState([]);
  const [vehicules, setVehicules] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);

  // Modales
  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [modalAffecterOpen, setModalAffecterOpen] = useState(false);
  const [modalDemarrerOpen, setModalDemarrerOpen] = useState(false);
  const [modalTerminerOpen, setModalTerminerOpen] = useState(false);
  const [modalMotifOpen, setModalMotifOpen] = useState(false);
  const [motifAction, setMotifAction] = useState(null); // { type: 'REJETER' | 'ANNULER', mission: ... }

  const [activeMission, setActiveMission] = useState(null);

  // Formulaires
  const [createForm, setCreateForm] = useState({
    description: '',
    projet_id: '',
    lieu_depart: 'Goma',
    lieu_arrivee: '',
    date_debut: '',
    date_fin: '',
    devise: 'USD',
    passagers: [{ nom: '', fonction: '' }],
    observation: '',
  });

  const [affectForm, setAffectForm] = useState({
    vehicule_id: '',
    chauffeur_id: '',
    commentaire: '',
  });

  const [demarrerForm, setDemarrerForm] = useState({
    km_depart: '',
    heure_depart: '',
    photo_depart_url: '',
  });

  const [terminerForm, setTerminerForm] = useState({
    km_arrivee: '',
    heure_retour: '',
    observation: '',
  });

  const [motifText, setMotifText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Charger les données de référence (projets, véhicules, chauffeurs)
  const loadReferences = useCallback(async () => {
    try {
      const [projRes, vehRes, chaufRes] = await Promise.allSettled([
        projetsService.list(),
        vehiculesService.list(),
        chauffeursService.list(),
      ]);

      if (projRes.status === 'fulfilled') {
        setProjets(Array.isArray(projRes.value) ? projRes.value : projRes.value?.items || []);
      }
      if (vehRes.status === 'fulfilled') {
        const v = Array.isArray(vehRes.value) ? vehRes.value : vehRes.value?.vehicules || [];
        setVehicules(v);
      }
      if (chaufRes.status === 'fulfilled') {
        const c = Array.isArray(chaufRes.value) ? chaufRes.value : chaufRes.value?.items || [];
        setChauffeurs(c);
      }
    } catch (e) {
      console.warn('Erreur chargement références:', e);
    }
  }, []);

  // Charger la liste des missions avec filtres
  const loadMissions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statutFilter) params.statut = statutFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (projetFilter) params.projet_id = Number(projetFilter);

      const data = await missionsService.list(params);
      setMissions(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.detail || 'Erreur lors du chargement des missions.');
    } finally {
      setLoading(false);
    }
  }, [statutFilter, searchQuery, projetFilter]);

  useEffect(() => {
    loadReferences();
  }, [loadReferences]);

  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

  const notifySuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  // 1. Demande de mission (Création)
  const handleAddPassenger = () => {
    setCreateForm((prev) => ({
      ...prev,
      passagers: [...prev.passagers, { nom: '', fonction: '' }],
    }));
  };

  const handleRemovePassenger = (index) => {
    setCreateForm((prev) => ({
      ...prev,
      passagers: prev.passagers.filter((_, i) => i !== index),
    }));
  };

  const handlePassengerChange = (index, field, value) => {
    setCreateForm((prev) => {
      const list = [...prev.passagers];
      list[index][field] = value;
      return { ...prev, passagers: list };
    });
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    if (!createForm.date_debut || !createForm.date_fin) {
      setError('Veuillez renseigner les dates de début et de fin.');
      return;
    }
    if (new Date(createForm.date_fin) <= new Date(createForm.date_debut)) {
      setError('La date de retour doit être strictement postérieure à la date de départ.');
      return;
    }

    setActionLoading(true);
    setError('');
    try {
      const cleanedPassengers = createForm.passagers
        .filter((p) => p.nom.trim())
        .map((p) => ({ nom: p.nom.trim(), fonction: p.fonction.trim() }));

      const payload = {
        description: createForm.description.trim(),
        projet_id: createForm.projet_id ? Number(createForm.projet_id) : null,
        lieu_depart: createForm.lieu_depart.trim(),
        lieu_arrivee: createForm.lieu_arrivee.trim(),
        date_debut: new Date(createForm.date_debut).toISOString(),
        date_fin: new Date(createForm.date_fin).toISOString(),
        passagers: cleanedPassengers,
        observation: createForm.observation.trim() || null,
        devise: createForm.devise || 'USD',
      };

      await missionsService.create(payload);
      setModalCreateOpen(false);
      setCreateForm({
        description: '',
        projet_id: '',
        lieu_depart: 'Goma',
        lieu_arrivee: '',
        date_debut: '',
        date_fin: '',
        devise: 'USD',
        passagers: [{ nom: '', fonction: '' }],
        observation: '',
      });
      notifySuccess('Demande de mission créée avec succès.');
      await loadMissions();
    } catch (e) {
      setError(e.response?.data?.detail || 'Erreur lors de la création de la mission.');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Soumission au workflow
  const handleSoumettre = async (mission) => {
    if (!window.confirm(`Soumettre la mission #${mission.numero_mission || mission.id} pour validation ?`)) return;
    setActionLoading(true);
    setError('');
    try {
      await missionsService.soumettre(mission.id);
      notifySuccess('Mission soumise avec succès pour validation.');
      await loadMissions();
    } catch (e) {
      setError(e.response?.data?.detail || 'Erreur lors de la soumission de la mission.');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Validation par le responsable
  const handleValider = async (mission) => {
    if (!window.confirm(`Confirmer la validation de la mission #${mission.numero_mission || mission.id} ?`)) return;
    setActionLoading(true);
    setError('');
    try {
      await missionsService.valider(mission.id);
      notifySuccess('Mission validée avec succès.');
      await loadMissions();
    } catch (e) {
      setError(e.response?.data?.detail || 'Erreur lors de la validation.');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Rejet & Annulation (via modal motif)
  const openMotifModal = (type, mission) => {
    setMotifAction({ type, mission });
    setMotifText('');
    setModalMotifOpen(true);
  };

  const handleSubmitMotif = async (e) => {
    e.preventDefault();
    if (!motifText.trim()) return;
    setActionLoading(true);
    setError('');
    try {
      const { type, mission } = motifAction;
      if (type === 'REJETER') {
        await missionsService.rejeter(mission.id, motifText.trim());
        notifySuccess('Mission rejetée.');
      } else {
        await missionsService.annuler(mission.id, { motif: motifText.trim() });
        notifySuccess('Mission annulée.');
      }
      setModalMotifOpen(false);
      await loadMissions();
    } catch (e) {
      setError(e.response?.data?.detail || "Erreur lors de l'opération.");
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Affectation de véhicule et chauffeur
  const openAffecterModal = (mission) => {
    setActiveMission(mission);
    setAffectForm({
      vehicule_id: mission.vehicule_id || '',
      chauffeur_id: mission.chauffeur_id || '',
      commentaire: '',
    });
    setModalAffecterOpen(true);
  };

  const handleSubmitAffecter = async (e) => {
    e.preventDefault();
    if (!affectForm.vehicule_id || !affectForm.chauffeur_id) {
      setError('Veuillez sélectionner un véhicule ET un chauffeur.');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await missionsService.affecter(activeMission.id, {
        vehicule_id: Number(affectForm.vehicule_id),
        chauffeur_id: Number(affectForm.chauffeur_id),
        date_debut: activeMission.date_debut,
        date_fin: activeMission.date_fin,
        commentaire: affectForm.commentaire.trim() || null,
      });
      notifySuccess('Véhicule et chauffeur affectés avec succès.');
      setModalAffecterOpen(false);
      await loadMissions();
    } catch (e) {
      setError(e.response?.data?.detail || "Erreur lors de l'affectation (conflit de calendrier possible).");
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Démarrage de mission
  const openDemarrerModal = (mission) => {
    setActiveMission(mission);
    const v = vehicules.find((item) => item.id_bien === mission.vehicule_id);
    const kmDefault = v?.kilometrage_actuel ?? mission.km_depart ?? '';
    setDemarrerForm({
      km_depart: kmDefault,
      heure_depart: new Date().toISOString().slice(0, 16),
      photo_depart_url: '',
    });
    setModalDemarrerOpen(true);
  };

  const handleSubmitDemarrer = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      await missionsService.demarrer(activeMission.id, {
        km_depart: Number(demarrerForm.km_depart),
        heure_depart: new Date(demarrerForm.heure_depart).toISOString(),
        photo_depart_url: demarrerForm.photo_depart_url.trim() || null,
      });
      notifySuccess('Mission démarrée ! Trajet en cours.');
      setModalDemarrerOpen(false);
      await loadMissions();
    } catch (e) {
      setError(e.response?.data?.detail || 'Erreur lors du démarrage de la mission.');
    } finally {
      setActionLoading(false);
    }
  };

  // 7. Clôture de mission
  const openTerminerModal = (mission) => {
    setActiveMission(mission);
    setTerminerForm({
      km_arrivee: '',
      heure_retour: new Date().toISOString().slice(0, 16),
      observation: '',
    });
    setModalTerminerOpen(true);
  };

  const handleSubmitTerminer = async (e) => {
    e.preventDefault();
    const kmArr = Number(terminerForm.km_arrivee);
    const kmDep = Number(activeMission?.km_depart || 0);
    if (kmArr < kmDep) {
      setError(`Le kilométrage d'arrivée (${kmArr}) ne peut pas être inférieur au kilométrage de départ (${kmDep}).`);
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await missionsService.terminer(activeMission.id, {
        km_arrivee: kmArr,
        heure_retour: new Date(terminerForm.heure_retour).toISOString(),
        observation: terminerForm.observation.trim() || null,
      });
      notifySuccess(`Mission terminée avec succès (${kmArr - kmDep} km parcourus).`);
      setModalTerminerOpen(false);
      await loadMissions();
    } catch (e) {
      setError(e.response?.data?.detail || 'Erreur lors de la clôture de la mission.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AppPage
      title="Missions de Flotte"
      subtitle="Planification, circuit d'approbation et suivi des mouvements de terrain"
    >
      {/* Messages */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 flex items-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Barre d'actions & Filtres */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher (N°, destination, motif)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border-light bg-card-bg text-text-primary dark:border-border-dark dark:bg-night-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <select
                value={statutFilter}
                onChange={(e) => setStatutFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border-light bg-card-bg text-text-primary dark:border-border-dark dark:bg-night-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {STATUTS_MISSION.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={projetFilter}
                onChange={(e) => setProjetFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border-light bg-card-bg text-text-primary dark:border-border-dark dark:bg-night-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Tous les projets</option>
                {projets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code ? `[${p.code}] ` : ''}
                    {p.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={loadMissions} disabled={loading}>
              <ArrowPathIcon className="w-4 h-4" />
              <span>Actualiser</span>
            </Button>
            {canCreate && (
              <Button variant="primary" onClick={() => setModalCreateOpen(true)}>
                <PlusIcon className="w-4 h-4" />
                <span>Nouvelle mission</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Liste des Missions */}
      {loading ? (
        <PageLoader />
      ) : missions.length === 0 ? (
        <Card className="text-center py-12">
          <CalendarDaysIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-base font-medium text-gray-900 dark:text-slate-100">Aucune mission trouvée</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Modifiez vos filtres ou créez une nouvelle demande de mission.
          </p>
          {canCreate && (
            <div className="mt-4">
              <Button variant="primary" onClick={() => setModalCreateOpen(true)}>
                <PlusIcon className="w-4 h-4" />
                <span>Créer une mission</span>
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {missions.map((m) => (
            <Card key={m.id} className="p-5 hover:shadow-md transition-shadow duration-200">
              <div className="flex flex-col lg:flex-row justify-between gap-4">
                {/* Infos principales */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-primary-600 dark:text-primary-400">
                      {m.numero_mission || `#${m.id}`}
                    </span>
                    {getStatutBadge(m.statut)}
                    {m.projet_id && (
                      <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        Projet : {projets.find((p) => p.id === m.projet_id)?.nom || `#${m.projet_id}`}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">
                      {m.destination || m.lieu_arrivee || m.description}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                      {m.motif || m.description}
                    </p>
                  </div>

                  {/* Détails logistiques */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <CalendarDaysIcon className="w-4 h-4 shrink-0 text-gray-400" />
                      <span>Du {formatDate(m.date_debut)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPinIcon className="w-4 h-4 shrink-0 text-gray-400" />
                      <span>{m.lieu_depart || 'Goma'} → {m.lieu_arrivee || m.destination}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <UserGroupIcon className="w-4 h-4 shrink-0 text-gray-400" />
                      <span>{m.passagers?.length || 0} passager(s)</span>
                    </div>
                  </div>

                  {/* Véhicule & Chauffeur affectés */}
                  {(m.vehicule || m.chauffeur || m.km_depart != null) && (
                    <div className="pt-2 border-t border-border-light dark:border-border-dark flex flex-wrap gap-4 text-xs">
                      {m.vehicule && (
                        <div className="flex items-center gap-1.5 text-gray-700 dark:text-slate-300">
                          <TruckIcon className="w-4 h-4 text-primary-500" />
                          <span>
                            {m.vehicule.immatriculation} ({m.vehicule.marque || 'Véhicule'})
                          </span>
                        </div>
                      )}
                      {m.chauffeur && (
                        <div className="flex items-center gap-1.5 text-gray-700 dark:text-slate-300">
                          <UserIcon className="w-4 h-4 text-primary-500" />
                          <span>
                            {m.chauffeur.prenom} {m.chauffeur.nom} (Permis {m.chauffeur.categorie_permis})
                          </span>
                        </div>
                      )}
                      {m.km_depart != null && (
                        <div className="text-gray-600 dark:text-slate-400">
                          Compteur : {m.km_depart} km {m.km_arrivee ? `→ ${m.km_arrivee} km (${m.km_arrivee - m.km_depart} km)` : ''}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Motif de rejet si rejetée */}
                  {m.statut === 'REJETEE' && m.motif_rejet && (
                    <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                      <strong>Motif du rejet :</strong> {m.motif_rejet}
                    </div>
                  )}
                </div>

                {/* Boutons d'actions contextuelles */}
                <div className="flex lg:flex-col justify-end items-end gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
                  {/* Actions BROUILLON / REJETEE */}
                  {(m.statut === 'BROUILLON' || m.statut === 'REJETEE') && canCreate && (
                    <Button variant="primary" size="sm" onClick={() => handleSoumettre(m)} disabled={actionLoading}>
                      <CheckCircleIcon className="w-3.5 h-3.5" />
                      <span>Soumettre</span>
                    </Button>
                  )}

                  {/* Actions EN_ATTENTE_VALIDATION */}
                  {m.statut === 'EN_ATTENTE_VALIDATION' && canValidate && (
                    <>
                      <Button variant="success" size="sm" onClick={() => handleValider(m)} disabled={actionLoading}>
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                        <span>Valider</span>
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => openMotifModal('REJETER', m)} disabled={actionLoading}>
                        <XCircleIcon className="w-3.5 h-3.5" />
                        <span>Rejeter</span>
                      </Button>
                    </>
                  )}

                  {/* Actions VALIDEE / PLANIFIEE */}
                  {(m.statut === 'VALIDEE' || m.statut === 'PLANIFIEE') && (
                    <>
                      {canAffect && (
                        <Button variant="outline" size="sm" onClick={() => openAffecterModal(m)} disabled={actionLoading}>
                          <TruckIcon className="w-3.5 h-3.5" />
                          <span>{m.vehicule_id ? 'Réaffecter' : 'Affecter véhicule'}</span>
                        </Button>
                      )}
                      {m.vehicule_id && (canAffect || canManage || canClose) && (
                        <Button variant="primary" size="sm" onClick={() => openDemarrerModal(m)} disabled={actionLoading}>
                          <PlayIcon className="w-3.5 h-3.5" />
                          <span>Démarrer</span>
                        </Button>
                      )}
                    </>
                  )}

                  {/* Actions EN_COURS */}
                  {m.statut === 'EN_COURS' && (canClose || canManage) && (
                    <Button variant="success" size="sm" onClick={() => openTerminerModal(m)} disabled={actionLoading}>
                      <CheckCircleIcon className="w-3.5 h-3.5" />
                      <span>Terminer</span>
                    </Button>
                  )}

                  {/* Action Annuler (disponible tant que non terminée ni annulée) */}
                  {m.statut !== 'TERMINEE' && m.statut !== 'ANNULEE' && (canManage || canCreate) && (
                    <button
                      type="button"
                      onClick={() => openMotifModal('ANNULER', m)}
                      className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 hover:underline pt-1"
                    >
                      Annuler la mission
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALE 1 : NOUVELLE DEMANDE DE MISSION                   */}
      {/* ========================================================= */}
      {modalCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-card-bg dark:bg-night-surface rounded-2xl shadow-2xl border border-border-light dark:border-border-dark p-6 my-8">
            <div className="flex justify-between items-center pb-3 border-b border-border-light dark:border-border-dark">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                <CalendarDaysIcon className="w-5 h-5 text-primary-500" />
                Demande de mission humanitaire
              </h2>
              <button
                onClick={() => setModalCreateOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-slate-300 mb-1">
                    Projet rattaché
                  </label>
                  <select
                    value={createForm.projet_id}
                    onChange={(e) => setCreateForm({ ...createForm, projet_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border-light bg-card-bg text-text-primary dark:border-border-dark dark:bg-night-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Sélectionner un projet...</option>
                    {projets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code ? `[${p.code}] ` : ''}
                        {p.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-slate-300 mb-1">
                    Lieu de départ *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.lieu_depart}
                    onChange={(e) => setCreateForm({ ...createForm, lieu_depart: e.target.value })}
                    placeholder="Ex: Goma (Base)"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border-light bg-card-bg text-text-primary dark:border-border-dark dark:bg-night-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-slate-300 mb-1">
                  Destination *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.lieu_arrivee}
                  onChange={(e) => setCreateForm({ ...createForm, lieu_arrivee: e.target.value })}
                  placeholder="Ex: Rutshuru (Centre de santé)"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border-light bg-card-bg text-text-primary dark:border-border-dark dark:bg-night-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-slate-300 mb-1">
                  Objet / Motif de la mission *
                </label>
                <textarea
                  required
                  rows={2}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Ex: Évaluation nutritionnelle d'urgence et distribution de kits médicaux"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border-light bg-card-bg text-text-primary dark:border-border-dark dark:bg-night-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-slate-300 mb-1">
                    Date et heure de départ *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={createForm.date_debut}
                    onChange={(e) => setCreateForm({ ...createForm, date_debut: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border-light bg-card-bg text-text-primary dark:border-border-dark dark:bg-night-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-slate-300 mb-1">
                    Date et heure de retour *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={createForm.date_fin}
                    onChange={(e) => setCreateForm({ ...createForm, date_fin: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border-light bg-card-bg text-text-primary dark:border-border-dark dark:bg-night-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Liste dynamique des passagers */}
              <div className="pt-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold uppercase text-gray-600 dark:text-slate-300">
                    Passagers prévus ({createForm.passagers.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPassenger}
                    className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1 font-medium"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    Ajouter un passager
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {createForm.passagers.map((p, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Nom complet"
                        value={p.nom}
                        onChange={(e) => handlePassengerChange(idx, 'nom', e.target.value)}
                        className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border-light bg-card-bg text-text-primary dark:border-border-dark dark:bg-night-surface"
                      />
                      <input
                        type="text"
                        placeholder="Fonction / Organisation"
                        value={p.fonction}
                        onChange={(e) => handlePassengerChange(idx, 'fonction', e.target.value)}
                        className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border-light bg-card-bg text-text-primary dark:border-border-dark dark:bg-night-surface"
                      />
                      {createForm.passagers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePassenger(idx)}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-light dark:border-border-dark">
                <Button variant="secondary" onClick={() => setModalCreateOpen(false)} disabled={actionLoading}>
                  Annuler
                </Button>
                <Button type="submit" variant="primary" disabled={actionLoading}>
                  {actionLoading ? 'Enregistrement...' : 'Enregistrer la demande'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALE 2 : AFFECTATION VÉHICULE & CHAUFFEUR             */}
      {/* ========================================================= */}
      {modalAffecterOpen && activeMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-card-bg dark:bg-night-surface rounded-2xl shadow-2xl border border-border-light dark:border-border-dark p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2 mb-2">
              <TruckIcon className="w-5 h-5 text-primary-500" />
              Affectation des ressources
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
              Mission {activeMission.numero_mission} : {activeMission.destination || activeMission.description}
              <br />
              Période : {formatDate(activeMission.date_debut)} → {formatDate(activeMission.date_fin)}
            </p>

            <form onSubmit={handleSubmitAffecter} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-slate-300 mb-1">
                  Sélectionner un véhicule *
                </label>
                <select
                  required
                  value={affectForm.vehicule_id}
                  onChange={(e) => setAffectForm({ ...affectForm, vehicule_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border-light bg-card-bg text-text-primary dark:border-border-dark dark:bg-night-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Choisir un véhicule...</option>
                  {vehicules.map((v) => (
                    <option key={v.id_bien} value={v.id_bien}>
                      {v.immatriculation} — {v.marque} {v.modele} ({v.categorie || 'VOITURE'}) — {v.kilometrage_actuel || 0} km
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-slate-300 mb-1">
                  Sélectionner un chauffeur *
                </label>
                <select
                  required
                  value={affectForm.chauffeur_id}
                  onChange={(e) => setAffectForm({ ...affectForm, chauffeur_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border-light bg-card-bg text-text-primary dark:border-border-dark dark:bg-night-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Choisir un chauffeur...</option>
                  {chauffeurs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.prenom} {c.nom} — Permis {c.categorie_permis} ({c.statut})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-slate-300 mb-1">
                  Commentaire / Instructions logistiques
                </label>
                <textarea
                  rows={2}
                  value={affectForm.commentaire}
                  onChange={(e) => setAffectForm({ ...affectForm, commentaire: e.target.value })}
                  placeholder="Instructions particulières de route..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border-light bg-card-bg text-text-primary dark:border-border-dark dark:bg-night-surface"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <Button variant="secondary" onClick={() => setModalAffecterOpen(false)} disabled={actionLoading}>
                  Annuler
                </Button>
                <Button type="submit" variant="primary" disabled={actionLoading}>
                  {actionLoading ? 'Affectation...' : 'Valider l’affectation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALE 3 : DÉMARRAGE DE MISSION                          */}
      {/* ========================================================= */}
      {modalDemarrerOpen && activeMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-card-bg dark:bg-night-surface rounded-2xl shadow-2xl border border-border-light dark:border-border-dark p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2 mb-2">
              <PlayIcon className="w-5 h-5 text-emerald-500" />
              Démarrer la mission
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
              Enregistrement du kilométrage au compteur et de l'heure effective de départ.
            </p>

            <form onSubmit={handleSubmitDemarrer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-slate-300 mb-1">
                  Kilométrage de départ (compteur) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={demarrerForm.km_depart}
                  onChange={(e) => setDemarrerForm({ ...demarrerForm, km_depart: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border-light bg-card-bg text-text-primary dark:border-border-dark dark:bg-night-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-slate-300 mb-1">
                  Heure réelle de départ *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={demarrerForm.heure_depart}
                  onChange={(e) => setDemarrerForm({ ...demarrerForm, heure_depart: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border-light bg-card-bg text-text-primary dark:border-border-dark dark:bg-night-surface"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <Button variant="secondary" onClick={() => setModalDemarrerOpen(false)} disabled={actionLoading}>
                  Annuler
                </Button>
                <Button type="submit" variant="primary" disabled={actionLoading}>
                  {actionLoading ? 'Démarrage...' : 'Confirmer le départ'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALE 4 : CLÔTURE DE MISSION                            */}
      {/* ========================================================= */}
      {modalTerminerOpen && activeMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-card-bg dark:bg-night-surface rounded-2xl shadow-2xl border border-border-light dark:border-border-dark p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2 mb-2">
              <CheckCircleIcon className="w-5 h-5 text-teal-500" />
              Clôturer la mission
            </h2>
            <div className="p-3 bg-gray-50 dark:bg-night-active rounded-xl mb-4 text-xs text-gray-600 dark:text-slate-300 space-y-1">
              <div>Kilométrage départ : <strong>{activeMission.km_depart || 0} km</strong></div>
              {terminerForm.km_arrivee && Number(terminerForm.km_arrivee) >= Number(activeMission.km_depart || 0) && (
                <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Distance parcourue estimée : {Number(terminerForm.km_arrivee) - Number(activeMission.km_depart || 0)} km
                </div>
              )}
            </div>

            <form onSubmit={handleSubmitTerminer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-slate-300 mb-1">
                  Kilométrage d'arrivée (compteur) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={terminerForm.km_arrivee}
                  onChange={(e) => setTerminerForm({ ...terminerForm, km_arrivee: e.target.value })}
                  placeholder={`Doit être >= ${activeMission.km_depart || 0}`}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border-light bg-card-bg text-text-primary dark:border-border-dark dark:bg-night-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-slate-300 mb-1">
                  Heure réelle de retour *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={terminerForm.heure_retour}
                  onChange={(e) => setTerminerForm({ ...terminerForm, heure_retour: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border-light bg-card-bg text-text-primary dark:border-border-dark dark:bg-night-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-slate-300 mb-1">
                  Observation / État du véhicule au retour
                </label>
                <textarea
                  rows={2}
                  value={terminerForm.observation}
                  onChange={(e) => setTerminerForm({ ...terminerForm, observation: e.target.value })}
                  placeholder="Ex: RAS, niveau de carburant 1/2..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border-light bg-card-bg text-text-primary dark:border-border-dark dark:bg-night-surface"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <Button variant="secondary" onClick={() => setModalTerminerOpen(false)} disabled={actionLoading}>
                  Annuler
                </Button>
                <Button type="submit" variant="success" disabled={actionLoading}>
                  {actionLoading ? 'Clôture...' : 'Clôturer la mission'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALE 5 : MOTIF DE REJET OU ANNULATION                   */}
      {/* ========================================================= */}
      {modalMotifOpen && motifAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-card-bg dark:bg-night-surface rounded-2xl shadow-2xl border border-border-light dark:border-border-dark p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2 mb-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
              {motifAction.type === 'REJETER' ? 'Rejeter la mission' : 'Annuler la mission'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
              Veuillez préciser le motif obligatoire de cette décision.
            </p>

            <form onSubmit={handleSubmitMotif} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-slate-300 mb-1">
                  Motif *
                </label>
                <textarea
                  required
                  rows={3}
                  value={motifText}
                  onChange={(e) => setMotifText(e.target.value)}
                  placeholder="Ex: Indisponibilité du véhicule, alerte sécuritaire sur l'axe..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border-light bg-card-bg text-text-primary dark:border-border-dark dark:bg-night-surface"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <Button variant="secondary" onClick={() => setModalMotifOpen(false)} disabled={actionLoading}>
                  Retour
                </Button>
                <Button type="submit" variant="danger" disabled={actionLoading}>
                  {actionLoading ? 'Validation...' : 'Confirmer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppPage>
  );
};

export default GestionMissions;
