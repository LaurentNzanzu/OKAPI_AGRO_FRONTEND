// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { OrganisationProvider } from '../../context/OrganisationContext';
import organisationsService from '../../services/organisations';
import MonOrganisation from './MonOrganisation';
import Header from '../../layouts/Header';
import PrintHeader from '../common/PrintHeader';
import PrintFooter from '../common/PrintFooter';

const auth = vi.hoisted(() => ({ organisationId: 1, user: { id: 10, roles: ['ADMIN'] }, hasRole: () => true }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('../../context/ThemeContext', () => ({ useTheme: () => ({ theme: 'light' }) }));
vi.mock('../../context/LanguageContext', () => ({ useLanguage: () => ({ t: key => key }), useTranslation: () => ({ t: key => key }) }));
vi.mock('../../context/PageActionsContext', () => ({ usePageActions: () => ({}) }));
vi.mock('../../hooks/usePolling', () => ({ default: () => {} }));
vi.mock('../../services/organisations', () => ({ default: {
  getProfil: vi.fn(), updateProfil: vi.fn(), uploadLogo: vi.fn(), deleteLogo: vi.fn(),
} }));
const initial = { id: 1, nom: 'ONG Espoir', rccm: 'ABC', ville: 'Goma', logo_url: null };
const mount = () => render(<MemoryRouter><OrganisationProvider><Header /><MonOrganisation /></OrganisationProvider></MemoryRouter>);
beforeEach(() => {
  vi.clearAllMocks(); auth.organisationId = 1; auth.user = { id: 10, roles: ['ADMIN'] }; auth.hasRole = () => true;
  organisationsService.getProfil.mockResolvedValue(initial);
});
afterEach(cleanup);

it('loads optional fields and sends only changed values; refreshes the actual header', async () => {
  organisationsService.updateProfil.mockImplementation(async payload => ({ ...initial, ...payload }));
  mount();
  const name = await screen.findByLabelText('Nom *');
  expect(name.value).toBe('ONG Espoir');
  expect(screen.getByLabelText('Sigle').value).toBe('');
  expect(screen.getByLabelText('Sigle').required).toBe(false);
  fireEvent.change(name, { target: { value: 'ONG Nouvelle' } });
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
  await screen.findByText('Profil de l’organisation mis à jour.');
  expect(organisationsService.updateProfil).toHaveBeenCalledWith({ nom: 'ONG Nouvelle' });
  expect(screen.getByTitle('ONG Nouvelle').textContent).toBe('ONG Nouvelle');
  expect(screen.getByLabelText('RCCM').value).toBe('ABC');
});

it('uploads, replaces and deletes a logo without losing unsaved text', async () => {
  organisationsService.uploadLogo.mockResolvedValueOnce({ ...initial, logo_url: 'https://example.com/logo1.png' })
    .mockResolvedValueOnce({ ...initial, logo_url: 'https://example.com/logo2.png' });
  organisationsService.deleteLogo.mockResolvedValue(initial);
  mount();
  fireEvent.change(await screen.findByLabelText('Ville'), { target: { value: 'Bukavu' } });
  const input = screen.getByLabelText('Logo de l’organisation');
  const file = new File(['image'], 'logo.png', { type: 'image/png' });
  fireEvent.change(input, { target: { files: [file] } });
  await screen.findByText('Logo mis à jour.');
  expect(screen.getByAltText('Logo actuel').getAttribute('src')).toContain('logo1');
  expect(screen.getByLabelText('Ville').value).toBe('Bukavu');
  fireEvent.change(input, { target: { files: [file] } });
  await waitFor(() => expect(screen.getByAltText('Logo actuel').getAttribute('src')).toContain('logo2'));
  fireEvent.click(screen.getByRole('button', { name: 'Supprimer le logo' }));
  await screen.findByText('Logo supprimé.');
  expect(screen.queryByAltText('Logo actuel')).toBeNull();
  expect(screen.getByLabelText('Ville').value).toBe('Bukavu');
});

it('rejects invalid or oversized logos before upload', async () => {
  mount(); await screen.findByLabelText('Nom *');
  const input = screen.getByLabelText('Logo de l’organisation');
  fireEvent.change(input, { target: { files: [new File(['x'], 'x.svg', { type: 'image/svg+xml' })] } });
  expect(screen.getByRole('alert').textContent).toContain('Format');
  fireEvent.change(input, { target: { files: [new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'x.png', { type: 'image/png' })] } });
  expect(screen.getByRole('alert').textContent).toContain('2 Mo');
  expect(organisationsService.uploadLogo).not.toHaveBeenCalled();
});

it('keeps input after a failed save and permits retry', async () => {
  organisationsService.updateProfil.mockRejectedValueOnce({ response: { status: 500, data: { message: 'technical stack' } } });
  mount(); fireEvent.change(await screen.findByLabelText('Ville'), { target: { value: 'Bukavu' } });
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
  await screen.findByRole('alert');
  expect(screen.getByRole('alert').textContent).not.toContain('technical');
  expect(screen.getByLabelText('Ville').value).toBe('Bukavu');
  expect(screen.getByRole('button', { name: 'Enregistrer' }).disabled).toBe(false);
});

it('denies the editor to non-admin users', async () => {
  auth.hasRole = () => false;
  mount();
  expect(screen.getByText('Vous n’êtes pas autorisé à modifier cette organisation.')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Enregistrer' })).toBeNull();
});

it('prints the document owner even while another organisation is connected', () => {
  const owner = { id: 2, nom: 'Organisation B', forme_juridique: 'Association', rccm: 'B-RCCM',
    id_national: 'B-ID', numero_impot: 'B-TAX', ville: 'Bukavu', logo_url: 'https://example.com/B.png' };
  const view = render(<><PrintHeader title="Fiche" organisation={owner} /><PrintFooter organisation={owner} /></>);
  expect(screen.getByAltText('Logo Organisation B').getAttribute('src')).toContain('B.png');
  expect(view.container.textContent).toContain('B-RCCM');
  expect(view.container.textContent).toContain('Bukavu');
  expect(view.container.textContent).not.toContain('ONG Espoir');
  view.rerender(<><PrintHeader title="Fiche" organisation={{ nom: 'Organisation B' }} /><PrintFooter organisation={{ nom: 'Organisation B' }} /></>);
  expect(screen.queryByRole('img')).toBeNull();
  for (const absent of ['RCCM:', 'null', 'undefined', 'Kinshasa', 'AGROBUSINESS']) expect(view.container.textContent).not.toContain(absent);
});

it('discards a delayed profile when switching organisation', async () => {
  let resolveFirst;
  organisationsService.getProfil.mockReturnValueOnce(new Promise(resolve => { resolveFirst = resolve; }))
    .mockResolvedValueOnce({ id: 2, nom: 'Organisation B' });
  const view = mount();
  auth.organisationId = 2; auth.user = { id: 20, roles: ['ADMIN'] };
  view.rerender(<MemoryRouter><OrganisationProvider><Header /><MonOrganisation /></OrganisationProvider></MemoryRouter>);
  await screen.findByTitle('Organisation B');
  resolveFirst(initial);
  await waitFor(() => expect(screen.getByTitle('Organisation B')).toBeTruthy());
  expect(screen.queryByTitle('ONG Espoir')).toBeNull();
});
