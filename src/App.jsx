// frontend/src/App.jsx
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { ValidationProvider } from './context/ValidationContext';  // NOUVEAU
import { BudgetProvider } from './context/BudgetContext';          // NOUVEAU
import Layout from './layouts/Layout';
import ProtectedRoute from './routes/ProtectedRoute';
import PageLoader from './components/common/PageLoader';
import NotFound from './components/common/NotFound';
import ParamRedirect from './components/common/ParamRedirect';
import { AuthLoadingPage } from './components/auth/AuthUI';

import PlanComptable from './components/administration/PlanComptable';

import {
  LandingPage,
  LoginPage,
  ForgotPassword,
  ResetPassword,
  UnauthorizedPage,
  Dashboard,
  ListeBiens,
  NouveauBien,
  FicheBien,
  EditBien,
  FournituresEnAttente,
  ValidationFourniture,
  BesoinsAttenteStock,
  DeclarationPanne,
  MesPannes,
  ListePannes,
  FichePanne,
  PiecesRemplacees,
  GestionPieces,
  ListePieces,
  GestionStockPieces,
  NouveauBesoin,
  FicheBesoin,
  ScanPiece,
  PlanningMaintenance,
  ListeMaintenances,
  AlertesMaintenance,
  FicheMaintenance,
  NouvelleMaintenance,
  ValidationsEnAttente,
  FicheValidation,
  HistoriqueValidations,
  ListeAmortissements,
  CalculAmortissement,
  TableauAmortissement,
  EcrituresComptables,
  GestionReglesAmortissement,
  FicheAmortissement,
  CessionBien,
  RebutBien,
  FicheMouvement,
  HistoriqueMouvements,
  ListeMouvements,
  NouveauMouvement,
  HistoriqueNotifications,
  JournalAudit,
  GestionUtilisateurs,
  GestionPermissions,
  RapportsFinanciers,
  RapportsTechniques,
  RapportsAmortissements,
  AideDecision,
  AlertesAchatPage,
  AssistantPage,
  PrintFicheBien,
  PrintFicheAmortissement,
  PrintEtatBesoin,
  Profil,
  Parametres,
  PrintPanne,
  ClotureExercice,
  WorkflowValidation,
  EtatBesoins,
  CessionEligibilitySection,
  CessionModal,
  GestionBudgets,
  BudgetWidget,
  ValidationsPage,
  BudgetsPage,
  JournalImmobilisations,
  Tableau8OHADA,
  PrevisionsFinancieres,
  GestionCaisse,
  GestionEtats,
  CaissePage,
  ConcertationsTab
} from './routes/lazyPages';

const Lazy = ({ children }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

/** Login / mot de passe : chargement sans i18n (page statique FR). */
const AuthLazy = ({ children }) => (
  <Suspense fallback={<AuthLoadingPage />}>{children}</Suspense>
);

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ThemeProvider>
          {/* NOUVEAU - Providers pour la TÂCHE 2 */}
          <ValidationProvider>
            <BudgetProvider>
              <Routes>
                {/* Routes publiques */}
                <Route path="/" element={<LanguageProvider><Lazy><LandingPage /></Lazy></LanguageProvider>} />
                <Route path="/login" element={<AuthLazy><LoginPage /></AuthLazy>} />
                <Route path="/forgot-password" element={<AuthLazy><ForgotPassword /></AuthLazy>} />
                <Route path="/reset-password" element={<AuthLazy><ResetPassword /></AuthLazy>} />
                <Route path="/unauthorized" element={<LanguageProvider><Lazy><UnauthorizedPage /></Lazy></LanguageProvider>} />

                {/* Routes protégées — PermissionRoute dans Layout */}
                <Route element={<LanguageProvider><ProtectedRoute><Layout /></ProtectedRoute></LanguageProvider>}>
                  <Route path="dashboard" element={<Lazy><Dashboard /></Lazy>} />

                  <Route path="biens" element={<Lazy><ListeBiens /></Lazy>} />
                  <Route path="biens/nouveau" element={<Lazy><NouveauBien /></Lazy>} />
                  <Route path="biens/:id/amortissements" element={<ParamRedirect to="/amortissements/fiche/:id" />} />
                  <Route path="biens/:id" element={<Lazy><FicheBien /></Lazy>} />
                  <Route path="biens/:id/edit" element={<Lazy><EditBien /></Lazy>} />

                  <Route path="pannes" element={<Lazy><ListePannes /></Lazy>} />
                  <Route path="pannes/declarer" element={<Lazy><DeclarationPanne /></Lazy>} />
                  <Route path="pannes/mes-pannes" element={<Lazy><MesPannes /></Lazy>} />
                  <Route path="pannes/:id/tester" element={<ParamRedirect to="/pannes/:id" />} />
                  <Route path="pannes/:id" element={<Lazy><FichePanne /></Lazy>} />
                  <Route path="pannes/:id/pieces" element={<Lazy><PiecesRemplacees /></Lazy>} />
                  <Route path="scan" element={<Lazy><ScanPiece /></Lazy>} />
                  <Route path="prints/fiche-panne/:id" element={<Lazy><PrintPanne /></Lazy>} />
                  <Route path="besoins/nouveau" element={<Lazy><NouveauBesoin /></Lazy>} />
                  <Route path="besoins/attente-stock" element={<Lazy><BesoinsAttenteStock /></Lazy>} />
                  <Route path="besoins/:id" element={<Lazy><FicheBesoin /></Lazy>} />

                  <Route path="fournitures/en-attente" element={<Lazy><FournituresEnAttente /></Lazy>} />
                  <Route path="fournitures/valider/:id" element={<Lazy><ValidationFourniture /></Lazy>} />

                  <Route path="pieces" element={<Lazy><GestionPieces /></Lazy>} />
                  <Route path="pieces/catalogue" element={<Lazy><ListePieces /></Lazy>} />
                  <Route path="pieces/stock" element={<Lazy><GestionStockPieces /></Lazy>} />
                  <Route path="pieces/:id" element={<ParamRedirect to="/pieces/catalogue" search="?highlight=:id" />} />

                  <Route path="maintenances" element={<Lazy><PlanningMaintenance /></Lazy>} />
                  <Route path="maintenances/planning" element={<Lazy><PlanningMaintenance /></Lazy>} />
                  <Route path="maintenances/nouveau" element={<Lazy><NouvelleMaintenance /></Lazy>} />
                  <Route path="maintenances/liste" element={<Lazy><ListeMaintenances /></Lazy>} />
                  <Route path="maintenances/alertes" element={<Lazy><AlertesMaintenance /></Lazy>} />
                  <Route path="maintenances/planifier" element={<Navigate to="/maintenances/nouveau" replace />} />
                  <Route path="maintenances/:id" element={<Lazy><FicheMaintenance /></Lazy>} />
                  <Route path="maintenances/mes-maintenances" element={<Lazy><PlanningMaintenance filter="mes" /></Lazy>} />
                  <Route path="maintenances/a-venir" element={<Lazy><PlanningMaintenance filter="a-venir" /></Lazy>} />
                  <Route path="maintenances/en-retard" element={<Lazy><PlanningMaintenance filter="en-retard" /></Lazy>} />

                  {/* Routes de validation avec les nouveaux contextes */}
                  <Route path="validations" element={<Lazy><ValidationsEnAttente /></Lazy>} />
                  <Route path="validations/:id" element={<Lazy><FicheValidation /></Lazy>} />
                  <Route path="validations/historique" element={<Lazy><HistoriqueValidations /></Lazy>} />
                  <Route path="workflow-validations" element={<Lazy><WorkflowValidation /></Lazy>} />
                  <Route path="validations-page" element={<Lazy><ValidationsPage /></Lazy>} />
                  <Route path="audit/journal-immobilisations/:id" element={<Lazy><JournalImmobilisations /></Lazy>} />
                  <Route path="rapports/tableau8" element={<Lazy><Tableau8OHADA /></Lazy>} />
                  <Route path="rapports/previsions" element={<Lazy><PrevisionsFinancieres /></Lazy>} />

                  <Route path="amortissements" element={<Lazy><ListeAmortissements /></Lazy>} />
                  <Route path="amortissements/nouveau" element={<Lazy><CalculAmortissement /></Lazy>} />
                  <Route path="amortissements/cloture" element={<Lazy><ClotureExercice /></Lazy>} />
                  <Route path="amortissements/fiche/:id" element={<Lazy><FicheAmortissement /></Lazy>} />
                  <Route path="amortissements/plan/:id" element={<ParamRedirect to="/amortissements/fiche/:id" />} />
                  <Route path="amortissements/tableau/:id" element={<Lazy><TableauAmortissement /></Lazy>} />
                  <Route path="amortissements/ecritures" element={<Lazy><EcrituresComptables /></Lazy>} />
                  <Route path="amortissements/regles" element={<Lazy><GestionReglesAmortissement /></Lazy>} />
                  <Route path="caisse" element={<Lazy><CaissePage /></Lazy>} />

                  {/* Routes de cession */}
                  <Route path="cessions/nouveau" element={<Lazy><CessionBien /></Lazy>} />
                  <Route path="cessions/eligibilite/:id" element={<Lazy><CessionEligibilitySection /></Lazy>} />
                  <Route path="cessions/modal/:id" element={<Lazy><CessionModal /></Lazy>} />
                  <Route path="rebut/nouveau" element={<Lazy><RebutBien /></Lazy>} />

                  {/* Routes des besoins et budgets */}
                  <Route path="etat-besoins" element={<Lazy><EtatBesoins /></Lazy>} />
                  <Route path="budgets" element={<Lazy><GestionBudgets /></Lazy>} />
                  <Route path="budgets/widget" element={<Lazy><BudgetWidget /></Lazy>} />
                  <Route path="budgets-page" element={<Lazy><BudgetsPage /></Lazy>} />
                  <Route path="caisse" element={<Lazy><GestionCaisse /></Lazy>} />
                  <Route path="etats" element={<Lazy><GestionEtats /></Lazy>} />

                  <Route path="plan-comptable" element={<Lazy><PlanComptable /></Lazy>} />

                  <Route path="mouvements/bien/:bienId" element={<ParamRedirect to="/mouvements/historique" search="?bien_id=:bienId" />} />
                  <Route path="mouvements/liste" element={<Lazy><ListeMouvements /></Lazy>} />
                  <Route path="mouvements/historique" element={<Lazy><HistoriqueMouvements /></Lazy>} />
                  <Route path="mouvements/nouveau" element={<Lazy><NouveauMouvement /></Lazy>} />
                  <Route path="mouvements" element={<Navigate to="/mouvements/liste" replace />} />
                  <Route path="mouvements/:id" element={<Lazy><FicheMouvement /></Lazy>} />

                  <Route path="notifications" element={<Lazy><HistoriqueNotifications /></Lazy>} />

                  <Route path="audit/journal" element={<Lazy><JournalAudit /></Lazy>} />
                  <Route path="audit/journal-audit" element={<Navigate to="/audit/journal" replace />} />
                  <Route path="audit/fiche-audit" element={<Navigate to="/audit/journal" replace />} />
                  <Route path="audit/historique" element={<Navigate to="/audit/journal" replace />} />

                  <Route path="utilisateurs" element={<Lazy><GestionUtilisateurs /></Lazy>} />
                  <Route path="utilisateurs/permissions" element={<Lazy><GestionPermissions /></Lazy>} />

                  <Route path="rapports" element={<Navigate to="/rapports/financiers" replace />} />
                  <Route path="rapports/financiers" element={<Lazy><RapportsFinanciers /></Lazy>} />
                  <Route path="rapports/techniques" element={<Lazy><RapportsTechniques /></Lazy>} />
                  <Route path="rapports/amortissements" element={<Lazy><RapportsAmortissements /></Lazy>} />
                  <Route path="ia/health-score/:bienId" element={<ParamRedirect to="/ia/aide-decision" search="?bien_id=:bienId" />} />
                  <Route path="ia/aide-decision" element={<Lazy><AideDecision /></Lazy>} />
                  <Route path="ia/alertes-achat" element={<Lazy><AlertesAchatPage /></Lazy>} />
                  <Route path="ia/assistant" element={<Lazy><AssistantPage /></Lazy>} />
                  <Route path="prints/fiche-bien/:id" element={<Lazy><PrintFicheBien /></Lazy>} />
                  <Route path="prints/fiche-amortissement/:id" element={<Lazy><PrintFicheAmortissement /></Lazy>} />
                  <Route path="prints/etat-besoin/:id" element={<Lazy><PrintEtatBesoin /></Lazy>} />
                  <Route path="parametres" element={<Lazy><Parametres /></Lazy>} />
                  <Route path="profil" element={<Lazy><Profil /></Lazy>} />
                  <Route path="concertations" element={<Lazy><ConcertationsTab /></Lazy>} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>

                <Route path="*" element={<LanguageProvider><NotFound /></LanguageProvider>} />
              </Routes>
            </BudgetProvider>
          </ValidationProvider>
          {/* FIN NOUVEAU */}
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;