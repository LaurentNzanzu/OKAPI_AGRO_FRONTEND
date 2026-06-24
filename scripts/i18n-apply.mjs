/**
 * Apply t() string replacements across i18n component files.
 * Run: node scripts/i18n-apply.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = path.join(__dirname, '../src/components');

function patch(file, replacements) {
  const fp = path.join(base, file);
  if (!fs.existsSync(fp)) { console.log('MISSING', file); return false; }
  let c = fs.readFileSync(fp, 'utf8');
  let n = 0;
  for (const [from, to] of replacements) {
    if (c.includes(from)) {
      c = c.split(from).join(to);
      n++;
    }
  }
  if (n > 0) {
    fs.writeFileSync(fp, c);
    console.log(`PATCHED ${file} (${n} replacements)`);
    return true;
  }
  console.log(`SKIP ${file}`);
  return false;
}

let count = 0;

// ListeAmortissements
if (patch('amortissements/ListeAmortissements.jsx', [
  ["const METHODE_LABELS = {\n    LINEAIRE: 'Linéaire',\n    DEGRESSIF: 'Dégressif',\n    UNITE_PRODUCTION: 'Unités production',\n    COMPOSANTS: 'Composants',\n    SPECIFIQUE_OKAPI: 'OKAPI spécifique',\n};", "const getMethodeLabels = (t) => ({\n    LINEAIRE: t('amortissements.list.methodeLineaire'),\n    DEGRESSIF: t('amortissements.list.methodeDegressif'),\n    UNITE_PRODUCTION: t('amortissements.list.methodeUniteProduction'),\n    COMPOSANTS: t('amortissements.list.methodeComposants'),\n    SPECIFIQUE_OKAPI: t('amortissements.list.methodeOkapi'),\n});"],
  ["setError(err.response?.data?.detail || 'Impossible de charger l\\'historique des amortissements');", "setError(err.response?.data?.detail || t('amortissements.list.loadError'));"],
  ['message="Chargement de l\'historique des amortissements..."', "message={t('amortissements.list.loading')}"],
  ['aria-label="Clôturer l\'exercice comptable"', "aria-label={t('amortissements.list.closeExerciceAria')}"],
  ["Clôturer l&apos;exercice {new Date().getFullYear()}", "{t('amortissements.list.closeExercice', { year: new Date().getFullYear() })}"],
  ['Total amortissements comptables', "{t('amortissements.list.statComptable')}"],
  ['Total amortissements fiscaux', "{t('amortissements.list.statFiscal')}"],
  ['Total écarts à réintégrer', "{t('amortissements.list.statEcart')}"],
  ["Économie d&apos;impôt", "{t('amortissements.list.statEconomie')}"],
  ['Historique des amortissements', "{t('amortissements.list.title')}"],
  ['<option value="">Toutes années</option>', '<option value="">{t(\'amortissements.list.allYears\')}</option>'],
  ['<option value="">Toutes méthodes</option>', '<option value="">{t(\'amortissements.list.allMethods\')}</option>'],
  ['{!bienId && <th>Bien</th>}', '{!bienId && <th>{t(\'amortissements.list.colBien\')}</th>}'},
  ['{!bienId && <th>QR Code</th>}', '{!bienId && <th>{t(\'amortissements.list.colQrCode\')}</th>}'},
  ['<th>Exercice</th>', '<th>{t(\'amortissements.list.colExercice\')}</th>'},
  ['<th>Méthode</th>', '<th>{t(\'amortissements.list.colMethode\')}</th>'},
  ['<th className="text-right">Amort. comptable</th>', '<th className="text-right">{t(\'amortissements.list.colAmortComptable\')}</th>'},
  ['<th className="text-right">Amort. fiscal</th>', '<th className="text-right">{t(\'amortissements.list.colAmortFiscal\')}</th>'},
  ['<th className="text-right">Écart à réintégrer</th>', '<th className="text-right">{t(\'amortissements.list.colEcart\')}</th>'},
  ['<th className="text-right">VNC comptable</th>', '<th className="text-right">{t(\'amortissements.list.colVnc\')}</th>'},
  ['<th className="text-center">Statut</th>', '<th className="text-center">{t(\'common.status\')}</th>'},
  ['<th className="text-center">Actions</th>', '<th className="text-center">{t(\'common.actions\')}</th>'},
  ['Aucun amortissement enregistré', "{t('amortissements.list.empty')}"],
  ['METHODE_LABELS[item.methode]', 'getMethodeLabels(t)[item.methode]'],
  ['{Object.entries(METHODE_LABELS).map', '{Object.entries(getMethodeLabels(t)).map'],
  ['Voir plan', "{t('amortissements.list.viewPlan')}"],
])) count++;

// PlanningMaintenance - key strings
if (patch('maintenances/PlanningMaintenance.jsx', [
  ["import {\n    AppIcon,\n    MAINTENANCE_TYPE_CONFIG,\n    MAINTENANCE_STATUT_CONFIG,", "import {\n    AppIcon,\n    getMaintenanceTypeConfig,\n    getMaintenanceStatutConfig,"],
  ['const getTypeInfo = (type) => MAINTENANCE_TYPE_CONFIG[type] || MAINTENANCE_TYPE_CONFIG.PREVENTIVE;', 'const maintenanceTypeConfig = React.useMemo(() => getMaintenanceTypeConfig(t), [t]);\n    const maintenanceStatutConfig = React.useMemo(() => getMaintenanceStatutConfig(t), [t]);\n    const getTypeInfo = (type) => maintenanceTypeConfig[type] || maintenanceTypeConfig.PREVENTIVE;'],
  ['const getStatutInfo = (statut) => MAINTENANCE_STATUT_CONFIG[statut] || MAINTENANCE_STATUT_CONFIG.PLANIFIEE;', 'const getStatutInfo = (statut) => maintenanceStatutConfig[statut] || maintenanceStatutConfig.PLANIFIEE;'],
  ["setError('Impossible de charger les maintenances');", "setError(t('maintenances.planning.loadError'));"],
  ["let errorMsg = 'Erreur lors de la planification';", "let errorMsg = t('maintenances.planning.planError');"],
  ['return <div className="text-center py-12">Chargement du planning...</div>;', 'return <div className="text-center py-12">{t(\'maintenances.planning.loading\')}</div>;'],
  ['Planning des maintenances', "{t('maintenances.planning.title')}"],
  ['Planifiez et suivez les interventions sur vos équipements', "{t('maintenances.planning.subtitle')}"],
  ['Nouvelle maintenance', "{t('maintenances.planning.newMaintenance')}"],
  ["all: { label: 'Toutes', Icon: ClipboardDocumentListIcon },", "all: { label: t('maintenances.planning.filterAll'), Icon: ClipboardDocumentListIcon },"],
  ["'a-venir': { label: 'À venir', Icon: CalendarDaysIcon },", "'a-venir': { label: t('maintenances.planning.filterAVenir'), Icon: CalendarDaysIcon },"],
  ["'en-retard': { label: 'En retard', Icon: ExclamationTriangleIcon },", "'en-retard': { label: t('maintenances.planning.filterEnRetard'), Icon: ExclamationTriangleIcon },"],
  ["mes: { label: 'Mes interventions', Icon: UserIcon },", "mes: { label: t('maintenances.planning.filterMes'), Icon: UserIcon },"],
  ['placeholder="Rechercher..."', 'placeholder={t(\'common.search\')}'],
  ['Aucune maintenance trouvée', "{t('maintenances.planning.empty')}"],
  ['Planifier une maintenance →', "{t('maintenances.planning.planAction')}"],
  ["if (jours < 0) return { text: 'En retard', isLate: true };", "if (jours < 0) return { text: t('maintenances.planning.late'), isLate: true };"],
  ["if (jours === 0) return { text: \"Aujourd'hui\", isToday: true };", "if (jours === 0) return { text: t('maintenances.planning.today'), isToday: true };"],
  ['return { text: `${jours} jour(s) restant(s)`, isLate: false, isToday: false };', 'return { text: t(\'maintenances.planning.daysRemaining\', { count: jours }), isLate: false, isToday: false };'],
  ['Bien: {m.bien_designation', "{t('maintenances.planning.bien')} {m.bien_designation"],
  ['Planifiée: {formatDate(m.date_planifiee)}', "{t('maintenances.planning.planned')} {formatDate(m.date_planifiee)}"],
  ['Début: {formatDate(m.date_debut_reelle)}', "{t('maintenances.planning.start')} {formatDate(m.date_debut_reelle)}"],
  ['Fin: {formatDate(m.date_fin_reelle)}', "{t('maintenances.planning.end')} {formatDate(m.date_fin_reelle)}"],
  ['Planifier une maintenance', "{t('maintenances.planning.modalTitle')}"],
  ['Type de maintenance *', "{t('maintenances.planning.typeLabel')}"],
  ['Bien concerné *', "{t('maintenances.planning.bienLabel')}"],
  ['<option value="">Sélectionner un bien</option>', '<option value="">{t(\'maintenances.planning.selectBien\')}</option>'],
  ['Date planifiée *', "{t('maintenances.planning.dateLabel')}"],
  ['Description *', "{t('maintenances.planning.descriptionLabel')}"],
  ['placeholder="Décrivez l\'intervention à réaliser..."', "placeholder={t('maintenances.planning.descriptionPlaceholder')}"],
  ['Périodicité (jours)', "{t('maintenances.planning.periodiciteLabel')}"],
  ['placeholder="Ex: 30 (répéter tous les 30 jours)"', "placeholder={t('maintenances.planning.periodicitePlaceholder')}"],
  ['Si renseigné, une nouvelle maintenance sera automatiquement planifiée après chaque intervention.', "{t('maintenances.planning.periodiciteHint')}"],
  ['Annuler', "{t('common.cancel')}"],
  ["submitting ? 'Planification...' : (", "submitting ? t('maintenances.planning.submitting') : ("],
  ['Planifier', "{t('maintenances.planning.submit')}"],
])) count++;

// Profil
if (patch('profil/Profil.jsx', [
  ["setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });", "setMessage({ type: 'success', text: t('profil.updateSuccess') });"],
  ["let errorMessage = 'Erreur lors de la mise à jour';", "let errorMessage = t('profil.updateError');"],
  ["setMessage({ type: 'error', text: 'Veuillez entrer votre ancien mot de passe' });", "setMessage({ type: 'error', text: t('profil.oldPasswordRequired') });"],
  ["setMessage({ type: 'error', text: 'Veuillez entrer un nouveau mot de passe' });", "setMessage({ type: 'error', text: t('profil.newPasswordRequired') });"],
  ["setMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas' });", "setMessage({ type: 'error', text: t('profil.passwordMismatch') });"],
  ["setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères' });", "setMessage({ type: 'error', text: t('profil.passwordMinLength') });"],
  ["setMessage({ type: 'error', text: 'Le nouveau mot de passe doit être différent de l\\'ancien' });", "setMessage({ type: 'error', text: t('profil.passwordSame') });"],
  ["setMessage({ type: 'success', text: 'Mot de passe modifié avec succès !' });", "setMessage({ type: 'success', text: t('profil.passwordSuccess') });"],
  ["let errorMessage = 'Erreur lors du changement de mot de passe';", "let errorMessage = t('profil.passwordError');"],
  ["'ADMIN': 'Administrateur',", "'ADMIN': t('roleAdmin'),"],
  ["'DG': 'Directeur Général',", "'DG': t('roleDG'),"],
  ["'COMPTABLE': 'Comptable',", "'COMPTABLE': t('roleComptable'),"],
  ["'TECHNICIEN': 'Technicien',", "'TECHNICIEN': t('roleTechnicien'),"],
  ["'CAISSE': 'Caisse',", "'CAISSE': t('roleCaisse'),"],
  ["'MAGASINIER': 'Magasinier'", "'MAGASINIER': t('roleMagasinier')"],
  ['← Retour', "{t('profil.back')}"],
  ['Mon profil', "{t('profil.title')}"],
  ['Informations personnelles', "{t('profil.personalInfo')}"],
  ['Modifier', "{t('profil.edit')}"],
  ['Prénom', "{t('profil.firstName')}"],
  ['>Nom<', ">{t('profil.lastName')}<"],
  ['Téléphone', "{t('profil.phone')}"],
  ['>Email<', ">{t('profil.email')}<"],
  ["L'email ne peut pas être modifié", "{t('profil.emailReadonly')}"],
  ["loading ? 'Enregistrement...' : 'Enregistrer'", "loading ? t('profil.saving') : t('profil.save')"],
  ['Annuler', "{t('common.cancel')}"],
  ['Prénom et Nom :', "{t('profil.fullName')}"],
  ['Téléphone :', "{t('profil.phoneLabel')}"],
  ['Email :', "{t('profil.emailLabel')}"],
  ['Dernière connexion :', "{t('profil.lastLogin')}"],
  ["user?.last_login ? new Date(user.last_login).toLocaleString('fr-FR') : 'Première connexion'", "user?.last_login ? new Date(user.last_login).toLocaleString('fr-FR') : t('profil.firstLogin')"],
  ['{formData.telephone || \'Non renseigné\'}', "{formData.telephone || t('common.notProvided')}"],
  ['Sécurité', "{t('profil.security')}"],
  ['Changer le mot de passe →', "{t('profil.changePassword')}"],
  ['Ancien mot de passe', "{t('profil.oldPassword')}"],
  ['Nouveau mot de passe', "{t('profil.newPassword')}"],
  ['Minimum 6 caractères', "{t('profil.passwordMinHint')}"],
  ['Confirmer le nouveau mot de passe', "{t('profil.confirmPassword')}"],
  ["loading ? 'Changement...' : 'Changer le mot de passe'", "loading ? t('profil.changing') : t('profil.changePasswordBtn')"],
])) count++;

// JournalAudit
if (patch('audit/JournalAudit.jsx', [
  ['return <div className="text-center py-12">Chargement du journal d\'audit...</div>;', 'return <div className="text-center py-12">{t(\'audit.journal.loading\')}</div>;'],
  ['title="Journal d\'audit"', "title={t('audit.journal.title')}"],
  ['subtitle="Traçabilité de toutes les actions du système"', "subtitle={t('audit.journal.subtitle')}"],
  ['placeholder="Table (biens, pannes...)"', "placeholder={t('audit.journal.tablePlaceholder')}"],
  ['<option value="">Toutes actions</option>', '<option value="">{t(\'audit.journal.allActions\')}</option>'],
  ['Réinitialiser', "{t('common.reset')}"],
  ['>Date<', ">{t('audit.journal.colDate')}<"],
  ['>Utilisateur<', ">{t('audit.journal.colUser')}<"],
  ['>Table<', ">{t('audit.journal.colTable')}<"],
  ['>Action<', ">{t('audit.journal.colAction')}<"],
  ['>Détails<', ">{t('audit.journal.colDetails')}<"],
  ['>Actions<', ">{t('common.actions')}<"],
  ["log.utilisateur_nom || 'Système'", "log.utilisateur_nom || t('audit.journal.system')"],
  ['Détails', "{t('audit.journal.details')}"],
  ['Historique', "{t('audit.journal.history')}"],
])) count++;

// BesoinsAttenteStock
if (patch('besoins/BesoinsAttenteStock.jsx', [
  ['message="Chargement..."', "message={t('besoins.attenteStock.loading')}"],
  ['title="Besoins en attente de stock"', "title={t('besoins.attenteStock.title')}"],
  ['subtitle="Besoins approuvés bloqués par manque de pièces"', "subtitle={t('besoins.attenteStock.subtitle')}"],
  ['Aucun besoin en attente de stock', "{t('besoins.attenteStock.empty')}"],
])) count++;

// RapportsFinanciers
if (patch('rapports/RapportsFinanciers.jsx', [
  ["setError(err.response?.data?.detail || 'Erreur lors du chargement des données');", "setError(err.response?.data?.detail || t('rapports.financiers.loadError'));"],
  ['Chargement du rapport...', "{t('rapports.financiers.loading')}"],
  ['title="Rapport Financier"', "title={t('rapports.financiers.title')}"],
  ['subtitle="Analyse financière des biens, pannes, maintenances et amortissements"', "subtitle={t('rapports.financiers.subtitle')}"],
])) count++;

// RapportsTechniques
if (patch('rapports/RapportsTechniques.jsx', [
  ['Chargement du rapport...', "{t('rapports.techniques.loading')}"],
  ['title="Rapport Technique"', "title={t('rapports.techniques.title')}"],
  ['subtitle="Analyse technique du parc immobilier"', "subtitle={t('rapports.techniques.subtitle')}"],
])) count++;

// RapportsAmortissements
if (patch('rapports/RapportsAmortissements.jsx', [
  ['Chargement du rapport...', "{t('rapports.amortissements.loading')}"],
  ['title="Rapport Amortissements"', "title={t('rapports.amortissements.title')}"],
  ['subtitle="Synthèse des amortissements et écarts fiscaux"', "subtitle={t('rapports.amortissements.subtitle')}"],
])) count++;

// ListeMouvements
if (patch('mouvements/ListeMouvements.jsx', [
  ["setError('Impossible de charger les mouvements');", "setError(t('mouvements.liste.loadError'));"],
  ['Chargement des mouvements...', "{t('mouvements.liste.loading')}"],
  ['title="Mouvements des biens"', "title={t('mouvements.liste.title')}"],
  ['subtitle="Traçabilité des transferts, cessions et affectations"', "subtitle={t('mouvements.liste.subtitle')}"],
  ['Aucun mouvement trouvé', "{t('mouvements.liste.empty')}"],
])) count++;

// HistoriqueValidations
if (patch('validations/HistoriqueValidations.jsx', [
  ['Aucun historique trouvé', "{t('validations.historique.empty')}"],
])) count++;

// PiecesRemplacees - check if already has t calls
if (patch('pannes/PiecesRemplacees.jsx', [
  ["setError('Veuillez sélectionner une pièce');", "setError(t('pannes.piecesRemplacees.errors.selectionRequise'));"],
  ["setError('La quantité doit être au moins 1');", "setError(t('pannes.piecesRemplacees.errors.quantiteMin'));"],
  ["setError('Pièce non trouvée');", "setError(t('pannes.piecesRemplacees.errors.pieceNonTrouvee'));"],
  ['Pièces remplacées', "{t('pannes.piecesRemplacees.title')}"],
  ['Ajouter une pièce', "{t('pannes.piecesRemplacees.ajouter')}"],
  ['Aucune pièce enregistrée', "{t('pannes.piecesRemplacees.empty')}"],
  ['Ajouter des pièces', "{t('pannes.piecesRemplacees.emptyAction')}"],
])) count++;

console.log(`\nFiles patched: ${count}`);
