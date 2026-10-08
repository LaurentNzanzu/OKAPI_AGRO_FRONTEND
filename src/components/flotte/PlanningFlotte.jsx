import React, { useCallback, useEffect, useState, useMemo } from 'react';
import AppPage from '../ui/AppPage';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PageLoader from '../common/PageLoader';
import planningService from '../../services/planning';
import vehiculesService from '../../services/vehicules';
import chauffeursService from '../../services/chauffeurs';
import missionsService from '../../services/missions';
import { useAuth } from '../../context/AuthContext';
import {
  CalendarDaysIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  TruckIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  PlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ClockIcon,
} from '../ui/icons';

const CATEGORIES_VEHICULE = ['TOUS', 'CAMION', 'VOITURE', 'MOTO', 'BUS'];

const PlanningFlotte = () => {
  const { hasPermission } = useAuth();
  const canAffect = hasPermission('MISSION_AFFECTER') || hasPermission('ADMIN');

  // Dates et navigation
  const [currentStartDate, setCurrentStartDate] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi de la semaine en cours
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const [daysCount, setDaysCount] = useState(7); // 7 ou 14 jours
  const [categoryFilter, setCategoryFilter] = useState('TOUS');

  // Données
  const [ganttData, setGanttData] = useState({
    vehicules: [],
    chauffeurs: [],
    affectations: [],
    maintenances: [],
  });
  const [unassignedMissions, setUnassignedMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modale d'affectation rapide
  const [modalAssignOpen, setModalAssignOpen] = useState(false);
  const [selectedVehiculeForAssign, setSelectedVehiculeForAssign] = useState(null);
  const [selectedDateForAssign, setSelectedDateForAssign] = useState(null);
  const [assignMissionId, setAssignMissionId] = useState('');
  const [assignChauffeurId, setAssignChauffeurId] = useState('');
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // Calcul de la liste des jours affichés
  const daysList = useMemo(() => {
    const list = [];
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(currentStartDate);
      d.setDate(currentStartDate.getDate() + i);
      list.push(d);
    }
    return list;
  }, [currentStartDate, daysCount]);

  const endDate = useMemo(() => {
    const end = new Date(currentStartDate);
    end.setDate(currentStartDate.getDate() + daysCount);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [currentStartDate, daysCount]);

  // Chargement des données du Gantt
  const fetchGantt = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const startIso = currentStartDate.toISOString();
      const endIso = endDate.toISOString();

      const [gData, mList] = await Promise.all([
        planningService.getGantt(startIso, endIso),
        missionsService.list({ statut: 'VALIDEE' }),
      ]);

      setGanttData(gData);
      setUnassignedMissions(
        Array.isArray(mList) ? mList.filter((m) => !m.vehicule_id) : []
      );
    } catch (e) {
      console.warn('Erreur fallback gantt:', e);
      // Fallback si l'endpoint gantt rencontre un souci
      try {
        const [affs, vehs, chs] = await Promise.all([
          planningService.getPlanning(currentStartDate.toISOString(), endDate.toISOString()),
          vehiculesService.list(),
          chauffeursService.list(),
        ]);
        setGanttData({
          vehicules: Array.isArray(vehs) ? vehs : vehs?.vehicules || [],
          chauffeurs: Array.isArray(chs) ? chs : chs?.items || [],
          affectations: Array.isArray(affs) ? affs : [],
          maintenances: [],
        });
      } catch (fallbackErr) {
        setError('Impossible de charger le planning de la flotte.');
      }
    } finally {
      setLoading(false);
    }
  }, [currentStartDate, endDate]);

  useEffect(() => {
    fetchGantt();
  }, [fetchGantt]);

  // Navigation
  const handlePrev = () => {
    const prev = new Date(currentStartDate);
    prev.setDate(currentStartDate.getDate() - daysCount);
    setCurrentStartDate(prev);
  };

  const handleNext = () => {
    const next = new Date(currentStartDate);
    next.setDate(currentStartDate.getDate() + daysCount);
    setCurrentStartDate(next);
  };

  const handleToday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentStartDate(monday);
  };

  // Filtrage des véhicules
  const filteredVehicules = useMemo(() => {
    if (!ganttData?.vehicules) return [];
    if (categoryFilter === 'TOUS') return ganttData.vehicules;
    return ganttData.vehicules.filter(
      (v) => (v.categorie || '').toUpperCase() === categoryFilter
    );
  }, [ganttData.vehicules, categoryFilter]);

  // Helpers pour identifier si une affectation ou maintenance a lieu un jour donné
  const isDateInRange = (date, startStr, endStr) => {
    if (!startStr || !endStr) return false;
    const d = new Date(date).setHours(0, 0, 0, 0);
    const s = new Date(startStr).setHours(0, 0, 0, 0);
    const e = new Date(endStr).setHours(23, 59, 59, 999);
    return d >= s && d <= e;
  };

  const getAffectationsForVehicleAndDay = (vehicleId, dayDate) => {
    return (ganttData.affectations || []).filter(
      (a) =>
        a.vehicule_id === vehicleId &&
        isDateInRange(dayDate, a.date_debut, a.date_fin)
    );
  };

  const getMaintenancesForVehicleAndDay = (vehicleId, dayDate) => {
    return (ganttData.maintenances || []).filter(
      (m) =>
        m.id_bien === vehicleId &&
        isDateInRange(dayDate, m.date_debut, m.date_fin)
    );
  };

  // Ouverture modale d'affectation rapide
  const handleOpenAssign = (vehicule, dayDate) => {
    if (!canAffect) return;
    setSelectedVehiculeForAssign(vehicule);
    setSelectedDateForAssign(dayDate);
    setAssignMissionId(unassignedMissions[0]?.id || '');
    setAssignChauffeurId(ganttData.chauffeurs[0]?.id || '');
    setModalAssignOpen(true);
  };

  const handleSubmitAssign = async (e) => {
    e.preventDefault();
    if (!assignMissionId || !assignChauffeurId || !selectedVehiculeForAssign) {
      setError('Veuillez sélectionner une mission et un chauffeur.');
      return;
    }

    setSubmittingAssign(true);
    setError('');
    try {
      const selectedMission = unassignedMissions.find((m) => m.id === Number(assignMissionId));
      const dateDeb = selectedMission?.date_debut || selectedDateForAssign.toISOString();
      const dateF = selectedMission?.date_fin || new Date(new Date(dateDeb).getTime() + 86400000).toISOString();

      await missionsService.affecter(Number(assignMissionId), {
        vehicule_id: selectedVehiculeForAssign.id_bien,
        chauffeur_id: Number(assignChauffeurId),
        date_debut: dateDeb,
        date_fin: dateF,
      });

      setSuccessMsg(`Véhicule ${selectedVehiculeForAssign.immatriculation} affecté avec succès !`);
      setTimeout(() => setSuccessMsg(''), 5000);
      setModalAssignOpen(false);
      await fetchGantt();
    } catch (err) {
      setError(err.response?.data?.detail || "Conflit détecté : ce véhicule ou ce chauffeur n'est pas disponible.");
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Formatage du titre de la période
  const periodTitle = useMemo(() => {
    const f = (d) =>
      d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    return `${f(currentStartDate)} — ${f(endDate)} (${daysCount} jours)`;
  }, [currentStartDate, endDate, daysCount]);

  const isToday = (date) => {
    const now = new Date();
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  };

  return (
    <AppPage
      title="Planning Visuel de la Flotte (Gantt)"
      subtitle="Affectation visuelle par véhicule et détection des indisponibilités / maintenances"
    >
      {/* Alertes */}
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

      {/* Barre d'outils du Gantt */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Navigation temporelle */}
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handlePrev}>
              <ArrowLeftIcon className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Aujourd'hui
            </Button>
            <Button variant="secondary" size="sm" onClick={handleNext}>
              <ArrowRightIcon className="w-4 h-4" />
            </Button>
            <span className="text-sm font-bold text-gray-800 dark:text-slate-200 ml-2">
              {periodTitle}
            </span>
          </div>

          {/* Filtres & Mode d'affichage */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Toggle 7j / 14j */}
            <div className="inline-flex rounded-lg border border-border-light dark:border-border-dark p-0.5 bg-gray-100 dark:bg-night-active text-xs">
              <button
                type="button"
                onClick={() => setDaysCount(7)}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  daysCount === 7
                    ? 'bg-card-bg text-primary-600 shadow-sm dark:bg-night-surface dark:text-primary-300'
                    : 'text-gray-600 dark:text-slate-400'
                }`}
              >
                7 jours
              </button>
              <button
                type="button"
                onClick={() => setDaysCount(14)}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  daysCount === 14
                    ? 'bg-card-bg text-primary-600 shadow-sm dark:bg-night-surface dark:text-primary-300'
                    : 'text-gray-600 dark:text-slate-400'
                }`}
              >
                14 jours
              </button>
            </div>

            {/* Catégories de véhicules */}
            <div className="flex items-center gap-1">
              {CATEGORIES_VEHICULE.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                    categoryFilter === cat
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-night-active dark:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <Button variant="secondary" size="sm" onClick={fetchGantt} disabled={loading}>
              Actualiser
            </Button>
          </div>
        </div>

        {/* Légende */}
        <div className="mt-4 pt-3 border-t border-border-light dark:border-border-dark flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-slate-400">
          <span className="font-semibold text-gray-800 dark:text-slate-200">Légende :</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-500" />
            <span>Mission planifiée</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-purple-500" />
            <span>Mission en cours</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-teal-500" />
            <span>Mission terminée</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500" />
            <span>Maintenance bloquante</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border border-dashed border-gray-400 bg-gray-50 dark:bg-night-surface" />
            <span>Disponible (Cliquer pour affecter)</span>
          </div>
        </div>
      </Card>

      {/* Grille Gantt */}
      {loading ? (
        <PageLoader />
      ) : filteredVehicules.length === 0 ? (
        <Card className="text-center py-12">
          <TruckIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <h3 className="text-base font-semibold text-gray-800 dark:text-slate-200">Aucun véhicule disponible</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Aucun véhicule ne correspond à la catégorie sélectionnée ({categoryFilter}).
          </p>
        </Card>
      ) : (
        <Card noPadding className="overflow-hidden shadow-lg border border-border-light dark:border-border-dark">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              {/* En-tête des colonnes (Jours) */}
              <thead>
                <tr className="bg-gray-50 dark:bg-night-active border-b border-border-light dark:border-border-dark">
                  <th className="w-64 p-3 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 border-r border-border-light dark:border-border-dark sticky left-0 bg-gray-50 dark:bg-night-active z-10">
                    Véhicule & Statut
                  </th>
                  {daysList.map((d, i) => {
                    const today = isToday(d);
                    return (
                      <th
                        key={i}
                        className={`min-w-[110px] p-2 text-center border-r border-border-light dark:border-border-dark text-xs ${
                          today
                            ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-bold'
                            : 'text-gray-700 dark:text-slate-300 font-medium'
                        }`}
                      >
                        <div className="uppercase text-[10px] text-gray-500 dark:text-slate-400">
                          {d.toLocaleDateString('fr-FR', { weekday: 'short' })}
                        </div>
                        <div className="text-sm font-semibold">{d.getDate()}</div>
                        <div className="text-[10px] text-gray-400">
                          {d.toLocaleDateString('fr-FR', { month: 'short' })}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Lignes par Véhicule */}
              <tbody className="divide-y divide-border-light dark:divide-border-dark text-xs">
                {filteredVehicules.map((vehicule) => (
                  <tr
                    key={vehicule.id_bien}
                    className="hover:bg-gray-50/50 dark:hover:bg-night-active/30 transition-colors"
                  >
                    {/* Colonne Véhicule (fixée à gauche) */}
                    <td className="p-3 border-r border-border-light dark:border-border-dark sticky left-0 bg-card-bg dark:bg-night-surface z-10">
                      <div className="flex items-center gap-2">
                        <TruckIcon className="w-5 h-5 text-primary-500 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 dark:text-slate-100 truncate">
                            {vehicule.immatriculation}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                            {vehicule.marque} {vehicule.modele} ({vehicule.categorie || 'VOITURE'})
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {vehicule.kilometrage_actuel || 0} km
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Cellules par Jour */}
                    {daysList.map((d, i) => {
                      const affs = getAffectationsForVehicleAndDay(vehicule.id_bien, d);
                      const maints = getMaintenancesForVehicleAndDay(vehicule.id_bien, d);
                      const hasMaintenance = maints.length > 0;
                      const hasMission = affs.length > 0;
                      const today = isToday(d);

                      return (
                        <td
                          key={i}
                          className={`p-1.5 border-r border-border-light dark:border-border-dark align-top h-20 transition-colors ${
                            today ? 'bg-primary-50/20 dark:bg-primary-950/10' : ''
                          }`}
                        >
                          {/* 1. Maintenance bloquante prioritaire */}
                          {hasMaintenance ? (
                            <div
                              title={`Maintenance : ${maints[0].titre} (${maints[0].type})`}
                              className="w-full h-full rounded-lg bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 p-1.5 flex flex-col justify-center items-center text-amber-900 dark:text-amber-200 cursor-help shadow-sm"
                            >
                              <WrenchScrewdriverIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 mb-0.5" />
                              <span className="font-bold text-[10px] text-center leading-tight">
                                Maintenance
                              </span>
                              <span className="text-[9px] text-amber-700 dark:text-amber-300 truncate max-w-[90px]">
                                {maints[0].type}
                              </span>
                            </div>
                          ) : hasMission ? (
                            /* 2. Affectation de mission */
                            <div className="space-y-1 h-full flex flex-col justify-center">
                              {affs.map((aff) => {
                                const isEnCours = aff.statut === 'EN_COURS';
                                const isTerminee = aff.statut === 'TERMINEE';
                                const bgClass = isEnCours
                                  ? 'bg-purple-600 text-white'
                                  : isTerminee
                                  ? 'bg-teal-600 text-white'
                                  : 'bg-blue-600 text-white';

                                return (
                                  <div
                                    key={aff.id}
                                    title={`Mission : ${aff.mission?.numero_mission || `#${aff.mission_id}`} - Chauffeur : ${aff.chauffeur || 'Non assigné'}`}
                                    className={`w-full rounded-md p-1 shadow-sm text-[10px] leading-tight flex flex-col justify-center truncate cursor-pointer hover:opacity-90 ${bgClass}`}
                                  >
                                    <div className="font-bold truncate">
                                      {aff.mission?.numero_mission || `MIS #${aff.mission_id}`}
                                    </div>
                                    <div className="text-[9px] opacity-90 truncate">
                                      {aff.chauffeur || 'Chauffeur ?'}
                                    </div>
                                    <div className="text-[8px] opacity-75 truncate">
                                      {aff.mission?.destination || aff.mission?.motif || ''}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            /* 3. Slot disponible */
                            canAffect && (
                              <button
                                type="button"
                                onClick={() => handleOpenAssign(vehicule, d)}
                                className="w-full h-full rounded-md border border-dashed border-gray-200 dark:border-border-dark hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-950/20 text-gray-300 hover:text-primary-600 flex flex-col items-center justify-center transition-all group"
                                title="Cliquer pour affecter une mission à ce véhicule"
                              >
                                <PlusIcon className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="text-[9px] opacity-0 group-hover:opacity-100 font-medium">
                                  Affecter
                                </span>
                              </button>
                            )
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================= */}
      {/* MODALE D'AFFECTATION DEPUIS LE GANTT                      */}
      {/* ========================================================= */}
      {modalAssignOpen && selectedVehiculeForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-card-bg dark:bg-night-surface rounded-2xl shadow-2xl border border-border-light dark:border-border-dark p-6">
            <div className="flex justify-between items-center pb-3 border-b border-border-light dark:border-border-dark">
              <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                <TruckIcon className="w-5 h-5 text-primary-500" />
                Affecter à {selectedVehiculeForAssign.immatriculation}
              </h2>
              <button
                onClick={() => setModalAssignOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAssign} className="space-y-4 mt-4">
              <div className="p-3 bg-gray-50 dark:bg-night-active rounded-xl text-xs text-gray-600 dark:text-slate-300">
                <div>Véhicule sélectionné : <strong>{selectedVehiculeForAssign.immatriculation} ({selectedVehiculeForAssign.marque} {selectedVehiculeForAssign.modele})</strong></div>
                <div>Date ciblée : <strong>{selectedDateForAssign?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-slate-300 mb-1">
                  Mission validée à assigner *
                </label>
                {unassignedMissions.length === 0 ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Aucune mission validée en attente d'affectation.
                  </p>
                ) : (
                  <select
                    required
                    value={assignMissionId}
                    onChange={(e) => setAssignMissionId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border-light bg-card-bg text-text-primary dark:border-border-dark dark:bg-night-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {unassignedMissions.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.numero_mission || `#${m.id}`} — {m.destination || m.description}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-slate-300 mb-1">
                  Chauffeur *
                </label>
                <select
                  required
                  value={assignChauffeurId}
                  onChange={(e) => setAssignChauffeurId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border-light bg-card-bg text-text-primary dark:border-border-dark dark:bg-night-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Sélectionner un chauffeur...</option>
                  {(ganttData.chauffeurs || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.prenom} {c.nom} (Permis {c.categorie_permis}) — {c.statut}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border-light dark:border-border-dark">
                <Button variant="secondary" onClick={() => setModalAssignOpen(false)} disabled={submittingAssign}>
                  Annuler
                </Button>
                <Button type="submit" variant="primary" disabled={submittingAssign || unassignedMissions.length === 0}>
                  {submittingAssign ? 'Affectation...' : 'Valider l’affectation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppPage>
  );
};

export default PlanningFlotte;
