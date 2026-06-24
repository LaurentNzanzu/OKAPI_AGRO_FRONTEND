import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import fr from '../locales/fr.json';
import en from '../locales/en.json';
import frAmortissements from '../locales/nested/fr/amortissements.json';
import frCommon from '../locales/nested/fr/common.json';
import frMaintenances from '../locales/nested/fr/maintenances.json';
import frModules from '../locales/nested/fr/modules.json';
import frPannes from '../locales/nested/fr/pannes.json';
import frPieces from '../locales/nested/fr/pieces.json';
import frUi from '../locales/nested/fr/ui.json';
import enAmortissements from '../locales/nested/en/amortissements.json';
import enCommon from '../locales/nested/en/common.json';
import enMaintenances from '../locales/nested/en/maintenances.json';
import enModules from '../locales/nested/en/modules.json';
import enPannes from '../locales/nested/en/pannes.json';
import enPieces from '../locales/nested/en/pieces.json';
import enUi from '../locales/nested/en/ui.json';

const STORAGE_KEY = 'okapi-lang';

const deepMerge = (target, ...sources) => {
  const result = { ...target };
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;
    for (const key of Object.keys(source)) {
      const value = source[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = deepMerge(result[key] || {}, value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
};

const translations = {
  fr: deepMerge(
    {},
    fr,
    frAmortissements,
    frCommon,
    frMaintenances,
    frModules,
    frPannes,
    frPieces,
    frUi,
  ),
  en: deepMerge(
    {},
    en,
    enAmortissements,
    enCommon,
    enMaintenances,
    enModules,
    enPannes,
    enPieces,
    enUi,
  ),
};

const getNestedValue = (obj, path) =>
  path.split('.').reduce((acc, key) => (acc != null ? acc[key] : undefined), obj);

const interpolate = (str, params = {}) => {
  if (typeof str !== 'string') return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    params[key] !== undefined && params[key] !== null ? String(params[key]) : `{{${key}}}`,
  );
};

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'en' ? 'en' : 'fr';
  });

  const setLanguage = useCallback((l) => {
    const next = l === 'en' ? 'en' : 'fr';
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key, params) => {
      const dict = translations[lang] || translations.fr;
      const flat = dict[key];
      const value = flat !== undefined ? flat : getNestedValue(dict, key);
      if (value === undefined || value === null) return key;
      if (typeof value === 'object') return key;
      return interpolate(value, params);
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLanguage, t }), [lang, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};

/** Safe outside LanguageProvider (e.g. login Suspense fallback). */
export const useLanguageOptional = () => useContext(LanguageContext);

export const useTranslation = () => {
  const { lang, setLanguage, t } = useLanguage();
  return {
    t,
    lang,
    setLanguage,
    i18n: { language: lang },
  };
};

/** Alias when the component may render outside LanguageProvider. */
export const useTranslationOptional = () => {
  const ctx = useLanguageOptional();
  if (!ctx) {
    const fallback = (key) => key;
    return { t: fallback, lang: 'fr', setLanguage: () => {}, i18n: { language: 'fr' } };
  }
  const { lang, setLanguage, t } = ctx;
  return { t, lang, setLanguage, i18n: { language: lang } };
};
