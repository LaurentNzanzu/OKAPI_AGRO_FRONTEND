import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import organisationsService from '../services/organisations';

const OrganisationContext = createContext(null);
export const useOrganisation = () => useContext(OrganisationContext);

export function OrganisationProvider({ children }) {
  const { organisationId, user } = useAuth();
  const identityKey = `${user?.id ?? ''}:${organisationId ?? ''}`;
  const currentKey = useRef(identityKey);
  currentKey.current = identityKey;
  const [state, setState] = useState({ key: null, profil: null, loading: false, error: '' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    if (!user || organisationId == null) {
      setState({ key: identityKey, profil: null, loading: false, error: '' });
      return;
    }
    setState({ key: identityKey, profil: null, loading: true, error: '' });
    organisationsService.getProfil().then(profil => {
      if (active) setState({ key: identityKey, profil, loading: false, error: '' });
    }).catch(() => {
      if (active) setState({ key: identityKey, profil: null, loading: false, error: 'Impossible de charger le profil de l’organisation.' });
    });
    return () => { active = false; };
  }, [identityKey, organisationId, attempt]);

  const apply = (profil) => {
    if (currentKey.current === identityKey && profil.id === organisationId) {
      setState({ key: identityKey, profil, loading: false, error: '' });
    }
    return profil;
  };
  const value = {
    profil: state.key === identityKey ? state.profil : null,
    loading: state.key !== identityKey ? organisationId != null : state.loading,
    error: state.key === identityKey ? state.error : '',
    refresh: () => setAttempt(n => n + 1),
    update: async payload => apply(await organisationsService.updateProfil(payload)),
    uploadLogo: async file => apply(await organisationsService.uploadLogo(file)),
    deleteLogo: async () => apply(await organisationsService.deleteLogo()),
  };
  return <OrganisationContext.Provider value={value}>{children}</OrganisationContext.Provider>;
}
