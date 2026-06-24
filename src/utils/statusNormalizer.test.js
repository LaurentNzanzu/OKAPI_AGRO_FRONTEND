import { describe, it, expect } from 'vitest';
import {
  normalizeStatusForSelect,
  normalizeStatusForAPI,
  normalizeStatusForDisplay,
  getEtatSelectOptions,
} from './statusNormalizer';

describe('statusNormalizer', () => {
  it('convertit les valeurs API majuscules pour les selects MUI', () => {
    expect(normalizeStatusForSelect('NEUF')).toBe('neuf');
    expect(normalizeStatusForSelect('PANNE')).toBe('panne');
    expect(normalizeStatusForSelect('maintenance')).toBe('maintenance');
  });

  it('convertit les valeurs select vers le format API', () => {
    expect(normalizeStatusForAPI('neuf')).toBe('NEUF');
    expect(normalizeStatusForAPI('PANNE')).toBe('PANNE');
    expect(normalizeStatusForAPI('')).toBeNull();
  });

  it('affiche un libellé lisible quelle que soit la casse', () => {
    expect(normalizeStatusForDisplay('NEUF')).toBe('Neuf');
    expect(normalizeStatusForDisplay('panne')).toBe('En panne');
  });

  it('fournit des options select en minuscules', () => {
    const options = getEtatSelectOptions();
    expect(options[0].value).toBe('neuf');
    expect(options.some((opt) => opt.value === 'panne')).toBe(true);
  });
});
