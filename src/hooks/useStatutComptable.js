// frontend/src/hooks/useStatutComptable.js
import { useMemo } from 'react';
import {
    peutAmortir,
    peutDeprecier,
    peutReprendre,
    peutCeder,
    peutMettreAuRebut,
    isStatutActif,
    isStatutSortie
} from '../utils/statutHelpers';

export const useStatutComptable = (statut) => {
    const operations = useMemo(() => ({
        peutAmortir: () => peutAmortir(statut),
        peutDeprecier: () => peutDeprecier(statut),
        peutReprendre: () => peutReprendre(statut),
        peutCeder: () => peutCeder(statut),
        peutMettreAuRebut: () => peutMettreAuRebut(statut),
        estActif: () => isStatutActif(statut),
        estSorti: () => isStatutSortie(statut),
        getStatut: () => statut
    }), [statut]);

    return operations;
};

export default useStatutComptable;