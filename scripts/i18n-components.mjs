/**
 * Batch i18n updater - run with: node scripts/i18n-components.mjs
 * Adds useTranslation import and hook to components that need it.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const componentsDir = path.join(__dirname, '../src/components');

const IMPORT_LINE = "import { useTranslation } from '../../context/LanguageContext';";
const IMPORT_LINE_DEEP = "import { useTranslation } from '../../../context/LanguageContext';";

const files = [
  'amortissements/CalculAmortissement.jsx',
  'amortissements/ListeAmortissements.jsx',
  'amortissements/FicheAmortissement.jsx',
  'amortissements/GestionReglesAmortissement.jsx',
  'maintenances/PlanningMaintenance.jsx',
  'maintenances/ListeMaintenances.jsx',
  'maintenances/FicheMaintenance.jsx',
  'maintenances/NouvelleMaintenance.jsx',
  'maintenances/AlertesMaintenance.jsx',
  'pieces/GestionPieces.jsx',
  'pieces/ListePieces.jsx',
  'pieces/ScanPiece.jsx',
  'pieces/GestionStockPieces.jsx',
  'mouvements/NouveauMouvement.jsx',
  'mouvements/ListeMouvements.jsx',
  'mouvements/HistoriqueMouvements.jsx',
  'mouvements/FicheMouvement.jsx',
  'pannes/PiecesRemplacees.jsx',
  'besoins/NouveauBesoin.jsx',
  'besoins/FicheBesoin.jsx',
  'besoins/BesoinsAttenteStock.jsx',
  'validations/FicheValidation.jsx',
  'validations/HistoriqueValidations.jsx',
  'fournitures/FournituresEnAttente.jsx',
  'cessions/CessionBien.jsx',
  'cessions/RebutBien.jsx',
  'rapports/RapportsFinanciers.jsx',
  'rapports/RapportsTechniques.jsx',
  'rapports/RapportsAmortissements.jsx',
  'composants/ComposantsList.jsx',
  'depreciations/DepreciationHistory.jsx',
  'depreciations/RepriseDepreciation.jsx',
  'profil/Profil.jsx',
  'audit/JournalAudit.jsx',
  'ia/AideDecision.jsx',
  'ia/AlertesAchatPage.jsx',
  'dashboard/widgets/IADecisionWidget.jsx',
  'biens/EditBien.jsx',
  'biens/nouveau/NouveauBien.jsx',
  'biens/QRCodeView.jsx',
];

let updated = 0;
for (const rel of files) {
  const fp = path.join(componentsDir, rel);
  if (!fs.existsSync(fp)) {
    console.log('SKIP (missing):', rel);
    continue;
  }
  let content = fs.readFileSync(fp, 'utf8');
  if (content.includes('useTranslation')) {
    console.log('SKIP (already):', rel);
    continue;
  }
  const importLine = rel.includes('nouveau/') ? IMPORT_LINE_DEEP : IMPORT_LINE;
  const importMatch = content.match(/^import .+$/m);
  if (!importMatch) continue;
  const insertPos = content.indexOf(importMatch[0]) + importMatch[0].length;
  content = content.slice(0, insertPos) + '\n' + importLine + content.slice(insertPos);

  // Add const { t } = useTranslation(); after first function/component opening
  const componentMatch = content.match(/const \w+ = \(\{?[^)]*\)? => \{/);
  if (componentMatch) {
    const pos = content.indexOf(componentMatch[0]) + componentMatch[0].length;
    content = content.slice(0, pos) + "\n  const { t } = useTranslation();" + content.slice(pos);
  } else {
    const fnMatch = content.match(/const \w+ = \(\) => \{/);
    if (fnMatch) {
      const pos = content.indexOf(fnMatch[0]) + fnMatch[0].length;
      content = content.slice(0, pos) + "\n  const { t } = useTranslation();" + content.slice(pos);
    }
  }

  fs.writeFileSync(fp, content);
  updated++;
  console.log('UPDATED import:', rel);
}
console.log(`\nTotal updated: ${updated}`);
