/** Options et libellés biens traduits — utiliser avec t() depuis useTranslation */

const ETAT_VALUES = ['NEUF', 'BON', 'USAGE', 'PANNE', 'REFORME', 'MAINTENANCE'];

const TYPE_VALUES = ['vehicule', 'machine', 'ordinateur', 'autre', 'bien'];

export const getEtatOptions = (t) =>
  ETAT_VALUES.map((value) => ({
    value,
    label: t(`status.etat.${value}`),
  }));

export const getTypeBienOptions = (t) =>
  TYPE_VALUES.filter((v) => v !== 'bien').map((value) => ({
    value,
    label: t(`status.type.${value}`),
  }));

export const getTypeBienLabel = (t, type) => {
  const key = String(type || '').toLowerCase();
  const label = t(`status.type.${key}`);
  return label !== `status.type.${key}` ? label : type;
};

export const getEtatBienLabel = (t, etat) => {
  const key = String(etat || '').toUpperCase();
  const label = t(`status.etat.${key}`);
  return label !== `status.etat.${key}` ? label : etat;
};

export const getNouveauBienSteps = (t) => [
  t('biens.nouveau.steps.general'),
  t('biens.nouveau.steps.specific'),
  t('biens.nouveau.steps.confirm'),
];

export const getEditBienSteps = (t) => [
  t('biens.edit.steps.general'),
  t('biens.edit.steps.specific'),
  t('biens.edit.steps.confirm'),
];
