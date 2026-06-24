// frontend/src/utils/constants.js
/**
 * Constantes frontend - Gestion des immobilisations
 * Basé sur ListeBiens.jsx et NouveauBien.jsx + conformité UML
 */

// ============================================================================
// 📊 ÉTATS DES BIENS (Enum: Bien.etat)
// ============================================================================

// ✅ États conformes au diagramme de classe UML (6 valeurs)
export const ETAT_BIEN_ENUM = Object.freeze([
  'neuf',
  'bon', 
  'usage',
  'panne',
  'reforme',
  'maintenance'
]);

// ✅ Options pour les selects (NouveauBien.jsx, EditBien.jsx)
export const ETAT_OPTIONS = [
  { value: 'neuf', label: 'Neuf' },
  { value: 'bon', label: 'Bon état' },
  { value: 'usage', label: 'En usage' },
  { value: 'panne', label: 'En panne' },
  { value: 'reforme', label: 'Réformé' },
  { value: 'maintenance', label: 'En maintenance' }  // ✅ AJOUTÉ
];

// ✅ Couleurs pour affichage (ListeBiens.jsx) - version consolidée
export const ETAT_COLORS = {
  neuf: '#4caf50',        // Vert
  bon: '#2196f3',         // Bleu (votre valeur existante)
  usage: '#ff9800',       // Orange
  panne: '#f44336',       // Rouge
  reforme: '#9e9e9e',     // Gris
  maintenance: '#ff5722', // Orange foncé (votre valeur existante)
  // ⚠️ États supplémentaires (si utilisés ailleurs)
  en_service: '#4caf50',
  en_maintenance: '#ff5722',
  hors_service: '#f44336'
};

// ✅ Labels pour affichage texte (ListeBiens.jsx)
export const ETAT_LABELS = {
  neuf: 'Neuf',
  bon: 'Bon état',
  usage: 'En usage',
  panne: 'En panne',
  reforme: 'Réformé',
  maintenance: 'En maintenance',
  // États supplémentaires
  en_service: 'En service',
  en_maintenance: 'En maintenance',
  hors_service: 'Hors service'
};

// ============================================================================
// 🚗🏭💻 TYPES DE BIENS
// ============================================================================

// ✅ Types conformes UML (3 valeurs)
export const TYPE_BIEN_ENUM = Object.freeze([
  'vehicule',
  'machine', 
  'ordinateur'
]);

// ✅ Options pour les selects (NouveauBien.jsx)
export const TYPE_OPTIONS = [
  { value: 'vehicule', label: 'Véhicule' },
  { value: 'machine', label: 'Machine' },
  { value: 'ordinateur', label: 'Ordinateur' },
  { value: 'autre', label: 'Autre' }  // Gardez si besoin pour extension
];

// ✅ Labels pour affichage (ListeBiens.jsx)
export const TYPE_LABELS = {
  vehicule: 'Véhicule',
  machine: 'Machine',
  ordinateur: 'Ordinateur',
  autre: 'Bien générique',
  bien: 'Bien générique'
};

// ============================================================================
// 📋 CHAMPS SPÉCIFIQUES PAR TYPE (UML)
// ============================================================================

export const CHAMPS_SPECIFIQUES = {
  vehicule: [
    'type_vehicule', 'marque', 'modele', 'immatriculation', 'poids',
    'dimension', 'type_de_carburant', 'consommation_carburant',
    'consommation_huile', 'type_propulsion'
  ],
  machine: [
    'numero_serie', 'fabricant', 'modele', 'puissance', 'type_alimentation',
    'tension_normal', 'service_affecte', 'responsable',
    'consommation_elec', 'frequence_maintenance'
  ],
  ordinateur: [
    'marque', 'modele', 'processeur', 'ram', 'stockage',
    'adresse_ip', 'utilisateur_affecte'
  ]
};

// ============================================================================
// ✅ CHAMPS OBLIGATOIRES (Validation formulaires)
// ============================================================================

export const CHAMPS_OBLIGATOIRES = {
  commun: ['type_bien', 'date_acquisition', 'prix_acquisition', 'localisation'],
  vehicule: ['marque', 'modele', 'immatriculation'],
  machine: ['numero_serie', 'fabricant', 'modele'],
  ordinateur: ['marque', 'modele']
};

// ============================================================================
// 🔄 OPTIONS SUPPLÉMENTAIRES (Pour selects dynamiques)
// ============================================================================

export const OPTIONS_TYPE_VEHICULE = [
  { value: 'voiture', label: 'Voiture' },
  { value: 'moto', label: 'Moto' },
  { value: 'camion', label: 'Camion' },
  { value: 'utilitaire', label: 'Utilitaire' },
  { value: 'engin', label: 'Engin de chantier' }
];

export const OPTIONS_TYPE_CARBURANT = [
  { value: 'essence', label: 'Essence' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'electrique', label: 'Électrique' },
  { value: 'hybride', label: 'Hybride' },
  { value: 'gaz', label: 'GPL/GNV' }
];

export const OPTIONS_FREQUENCE_MAINTENANCE = [
  { value: 'quotidienne', label: 'Quotidienne' },
  { value: 'hebdomadaire', label: 'Hebdomadaire' },
  { value: 'mensuelle', label: 'Mensuelle' },
  { value: 'trimestrielle', label: 'Trimestrielle' },
  { value: 'annuelle', label: 'Annuelle' }
];

// ============================================================================
// 📐 VALIDATIONS
// ============================================================================

export const VALIDATIONS = {
  prix: { min: 0, max: 999999999.99 },
  immatriculation: { pattern: /^[A-Z0-9\-]{3,20}$/, message: 'Format: AB-123-CD' },
  numero_serie: { pattern: /^[A-Z0-9\-]{5,50}$/, message: 'Format invalide' },
  adresse_ip: { pattern: /^(\d{1,3}\.){3}\d{1,3}$/, message: 'IP invalide' }
};

// ============================================================================
// 📦 EXPORT PAR DÉFAUT (Optionnel)
// ============================================================================
// Ajoutez à la fin du fichier constants.js, avant l'export default
export const ETAT_BIEN_OPTIONS = ETAT_OPTIONS;
export const TYPE_BIEN_LABELS = TYPE_LABELS;
export const ETAT_BIEN_COLORS = ETAT_COLORS;

export default {
  ETAT_BIEN_ENUM,
  ETAT_OPTIONS,
  ETAT_COLORS,
  ETAT_LABELS,
  TYPE_BIEN_ENUM,
  TYPE_OPTIONS,
  TYPE_LABELS,
  CHAMPS_SPECIFIQUES,
  CHAMPS_OBLIGATOIRES,
  OPTIONS_TYPE_VEHICULE,
  OPTIONS_TYPE_CARBURANT,
  OPTIONS_FREQUENCE_MAINTENANCE,
  VALIDATIONS
};
