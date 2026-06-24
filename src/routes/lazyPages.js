import { lazy } from 'react';

// Pages publiques
export const LandingPage = lazy(() => import('../pages/LandingPage'));
export const LoginPage = lazy(() => import('../pages/LoginPage'));
export const ForgotPassword = lazy(() => import('../components/auth/ForgotPassword'));
export const ResetPassword = lazy(() => import('../components/auth/ResetPassword'));
export const UnauthorizedPage = lazy(() => import('../pages/UnauthorizedPage'));

// Dashboard
export const Dashboard = lazy(() => import('../components/dashboard/Dashboard'));

// Biens
export const ListeBiens = lazy(() => import('../components/biens/ListeBiens'));
export const NouveauBien = lazy(() => import('../components/biens/nouveau/NouveauBien'));
export const FicheBien = lazy(() => import('../components/biens/FicheBien'));
export const EditBien = lazy(() => import('../components/biens/EditBien'));

// Fournitures & Besoins
export const FournituresEnAttente = lazy(() => import('../components/fournitures/FournituresEnAttente'));
export const ValidationFourniture = lazy(() => import('../components/fournitures/ValidationFourniture'));
export const BesoinsAttenteStock = lazy(() => import('../components/besoins/BesoinsAttenteStock'));
export const NouveauBesoin = lazy(() => import('../components/besoins/NouveauBesoin'));
export const FicheBesoin = lazy(() => import('../components/besoins/FicheBesoin'));

// Pannes & Pièces
export const DeclarationPanne = lazy(() => import('../components/pannes/DeclarationPanne'));
export const MesPannes = lazy(() => import('../components/pannes/MesPannes'));
export const ListePannes = lazy(() => import('../components/pannes/ListePannes'));
export const FichePanne = lazy(() => import('../components/pannes/FichePanne'));
export const PiecesRemplacees = lazy(() => import('../components/pannes/PiecesRemplacees'));
export const GestionPieces = lazy(() => import('../components/pieces/GestionPieces'));
export const ListePieces = lazy(() => import('../components/pieces/ListePieces'));
export const GestionStockPieces = lazy(() => import('../components/pieces/GestionStockPieces'));
export const ScanPiece = lazy(() => import('../components/pieces/ScanPiece'));

// Maintenances
export const PlanningMaintenance = lazy(() => import('../components/maintenances/PlanningMaintenance'));
export const ListeMaintenances = lazy(() => import('../components/maintenances/ListeMaintenances'));
export const AlertesMaintenance = lazy(() => import('../components/maintenances/AlertesMaintenance'));
export const FicheMaintenance = lazy(() => import('../components/maintenances/FicheMaintenance'));
export const NouvelleMaintenance = lazy(() => import('../components/maintenances/NouvelleMaintenance'));

// Validations
export const ValidationsEnAttente = lazy(() => import('../components/validations/ValidationsEnAttente'));
export const FicheValidation = lazy(() => import('../components/validations/FicheValidation'));
export const HistoriqueValidations = lazy(() => import('../components/validations/HistoriqueValidations'));

// Amortissements
export const ListeAmortissements = lazy(() => import('../components/amortissements/ListeAmortissements'));
export const CalculAmortissement = lazy(() => import('../components/amortissements/CalculAmortissement'));
export const TableauAmortissement = lazy(() => import('../components/amortissements/TableauAmortissement'));
export const EcrituresComptables = lazy(() => import('../components/amortissements/EcrituresComptables'));
export const GestionReglesAmortissement = lazy(() => import('../components/amortissements/GestionReglesAmortissement'));
export const FicheAmortissement = lazy(() => import('../components/amortissements/FicheAmortissement'));
export const CessionBien = lazy(() => import('../components/cessions/CessionBien'));
export const RebutBien = lazy(() => import('../components/cessions/RebutBien'));
export const ClotureExercice = lazy(() => import('../components/amortissements/ClotureExercice'));
// Mouvements
export const FicheMouvement = lazy(() => import('../components/mouvements/FicheMouvement'));
export const HistoriqueMouvements = lazy(() => import('../components/mouvements/HistoriqueMouvements'));
export const ListeMouvements = lazy(() => import('../components/mouvements/ListeMouvements'));
export const NouveauMouvement = lazy(() => import('../components/mouvements/NouveauMouvement'));

// Notifications
export const HistoriqueNotifications = lazy(() => import('../components/notifications/HistoriqueNotifications'));

// Audit & Utilisateurs
export const JournalAudit = lazy(() => import('../components/audit/JournalAudit'));
export const GestionUtilisateurs = lazy(() => import('../components/utilisateurs/GestionUtilisateurs'));
export const GestionPermissions = lazy(() => import('../components/utilisateurs/GestionPermissions'));

// Rapports & IA
export const ExportRapport = lazy(() => import('../components/rapports/ExportRapport'));
export const RapportsFinanciers = lazy(() => import('../components/rapports/RapportsFinanciers'));
export const RapportsTechniques = lazy(() => import('../components/rapports/RapportsTechniques'));
export const RapportsAmortissements = lazy(() => import('../components/rapports/RapportsAmortissements'));
export const AideDecision = lazy(() => import('../components/ia/AideDecision'));
export const AlertesAchatPage = lazy(() => import('../components/ia/AlertesAchatPage'));
export const AssistantPage = lazy(() => import('../pages/AssistantPage'));

// Prints & Paramètres
export const PrintFicheBien = lazy(() => import('../components/prints/PrintFicheBien'));
export const PrintFicheAmortissement = lazy(() => import('../components/prints/PrintFicheAmortissement'));
export const PrintEtatBesoin = lazy(() => import('../components/prints/PrintEtatBesoin'));
export const Profil = lazy(() => import('../components/profil/Profil'));
export const Parametres = lazy(() => import('../components/parametres/Parametres'));

//PLAN_COMPTABLE
//export const PlanComptable = lazy(() => import('../components/administration/PlanComptable'));
