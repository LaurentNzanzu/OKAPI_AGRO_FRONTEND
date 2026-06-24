/** Traductions workflow — utiliser avec t() depuis useTranslation */

const panneStatutKey = (statut) => {
  const map = {
    DECLAREE: 'declaree',
    DIAGNOSTIQUEE: 'diagnostiquee',
    EN_ATTENTE_PIECES: 'enAttentePieces',
    EN_VALIDATION: 'enValidation',
    EN_COURS: 'enCours',
    EN_TEST: 'enTest',
    TERMINEE: 'terminee',
    ANNULEE: 'annulee',
  };
  return map[statut];
};

export const getStatutPanneLabelI18n = (t, statut) => {
  const key = panneStatutKey(statut);
  if (!key) return statut;
  const label = t(`ui.icons.panneStatut.${key}`);
  return label !== `ui.icons.panneStatut.${key}` ? label : statut;
};

const besoinStatutKeys = {
  BROUILLON: 'brouillon',
  EN_VALIDATION: 'enValidation',
  DG_VALIDE: 'dgValide',
  COMPTABLE_VALIDE: 'comptableValide',
  CAISSE_VALIDE: 'caisseValide',
  REJETE: 'rejete',
  APPROUVEE: 'approuvee',
  ATTENTE_STOCK: 'attenteStock',
};

export const getStatutBesoinLabelI18n = (t, statut) => {
  const key = besoinStatutKeys[statut];
  if (!key) return statut;
  const label = t(`workflow.besoin.${key}`);
  return label !== `workflow.besoin.${key}` ? label : statut;
};

export const getEtatBienLabelI18n = (t, etat) => {
  const key = String(etat || '').toUpperCase();
  const label = t(`status.etat.${key}`);
  return label !== `status.etat.${key}` ? label : etat;
};

export const getStatutFournitureLabelI18n = (t, statut) => {
  const map = {
    EN_ATTENTE: 'enAttente',
    FOURNIE: 'fournie',
    PARTIELLE: 'partielle',
    REFUSEE: 'refusee',
    ANNULEE: 'annulee',
  };
  const key = map[statut];
  if (!key) return statut;
  const label = t(`workflow.fourniture.${key}`);
  return label !== `workflow.fourniture.${key}` ? label : statut;
};
