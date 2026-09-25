// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LanguageProvider } from '../../context/LanguageContext';
import { utilisateursService } from '../../services/utilisateurs';
import { getRoles } from '../../services/roles';
import GestionUtilisateurs from './GestionUtilisateurs';
import FicheUtilisateur from './FicheUtilisateur';
import { buildPhone, cleanLocalPhone, splitPhone, userErrorMessage } from './utilisateurForm';
import fr from '../../locales/fr.json';
import en from '../../locales/en.json';

vi.mock('../../services/utilisateurs', () => ({ utilisateursService: {
    getAll: vi.fn(), getById: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), toggleActif: vi.fn(),
} }));
vi.mock('../../services/roles', () => ({ getRoles: vi.fn() }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ hasPermission: () => true }) }));

const created = { id: 25, email: 'queen@example.com', prenom: 'Queen', nom: 'Safari', post_nom: 'Test',
    telephone: '+243970123456', role_id: 2, role_nom: 'COMPTABLE', est_actif: true,
    created_at: '2026-09-25T10:00:00Z', last_login: null,
    mot_de_passe_temporaire: 'Temporary8!X', doit_changer_mot_de_passe: true };
const t = fr.userWorkflow;
const mount = (path = '/utilisateurs') => render(
    <LanguageProvider><MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes><Route path="/utilisateurs" element={<GestionUtilisateurs />} />
            <Route path="/utilisateurs/:id" element={<FicheUtilisateur />} /></Routes>
    </MemoryRouter></LanguageProvider>
);

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    utilisateursService.getAll.mockResolvedValue({ items: [] });
    utilisateursService.create.mockResolvedValue(created);
    utilisateursService.getById.mockResolvedValue(created);
    getRoles.mockResolvedValue([{ id_role: 2, nom: 'COMPTABLE' }]);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

async function openForm() {
    mount();
    fireEvent.click(await screen.findByRole('button', { name: fr.newUser }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(t.email + ' *'), { target: { value: created.email } });
    fireEvent.change(within(dialog).getByLabelText(t.prenom + ' *'), { target: { value: created.prenom } });
    fireEvent.change(within(dialog).getByLabelText(t.nom + ' *'), { target: { value: created.nom } });
    fireEvent.change(within(dialog).getByLabelText(t.role + ' *'), { target: { value: '2' } });
    return dialog;
}

it('creates without a password, combines the phone, shows credentials only until closed', async () => {
    const dialog = await openForm();
    expect(dialog.querySelector('input[type="password"]')).toBeNull();
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');
    fireEvent.change(within(dialog).getByLabelText(t.telephone), { target: { value: '97a0123456' } });
    fireEvent.click(within(dialog).getByRole('button', { name: t.create, exact: true }));
    await screen.findByText(created.mot_de_passe_temporaire);
    const payload = utilisateursService.create.mock.calls[0][0];
    expect(payload.telephone).toBe('+243970123456');
    expect(payload).not.toHaveProperty('mot_de_passe');
    expect(payload).not.toHaveProperty('organisation_id');
    expect(storageSpy).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: t.close }));
    expect(screen.queryByText(created.mot_de_passe_temporaire)).toBeNull();
    fireEvent.click(await screen.findByRole('button', { name: fr.newUser }));
    expect(screen.queryByText(created.mot_de_passe_temporaire)).toBeNull();
});

it('limits local digits to ten and allows a custom country code', async () => {
    const dialog = await openForm();
    const number = within(dialog).getByLabelText(t.telephone);
    fireEvent.change(number, { target: { value: '12a3!45678901234' } });
    expect(number.value).toBe('1234567890');
    expect(number.inputMode).toBe('numeric');
    fireEvent.change(within(dialog).getByLabelText(t.prefix), { target: { value: '+998' } });
    fireEvent.click(within(dialog).getByRole('button', { name: t.create, exact: true }));
    await waitFor(() => expect(utilisateursService.create).toHaveBeenCalled());
    expect(utilisateursService.create.mock.calls[0][0].telephone).toBe('+9981234567890');
});

it('keeps the form open and shows FastAPI detail on failure', async () => {
    utilisateursService.create.mockRejectedValue({ response: { data: { detail: 'Email déjà utilisé' } } });
    const dialog = await openForm();
    fireEvent.click(within(dialog).getByRole('button', { name: t.create, exact: true }));
    await waitFor(() => expect(within(dialog).getByRole('alert').textContent).toBe('Email déjà utilisé'));
    expect(screen.queryByText(created.mot_de_passe_temporaire)).toBeNull();
});

it('prevents duplicate submissions while saving', async () => {
    let resolve;
    utilisateursService.create.mockReturnValue(new Promise((done) => { resolve = done; }));
    const dialog = await openForm();
    fireEvent.submit(dialog.querySelector('form'));
    fireEvent.submit(dialog.querySelector('form'));
    expect(utilisateursService.create).toHaveBeenCalledTimes(1);
    expect(within(dialog).getByRole('button', { name: t.saving }).disabled).toBe(true);
    resolve(created);
    await screen.findByText(created.mot_de_passe_temporaire);
});

it('copies the temporary password and clears the confirmation with Escape', async () => {
    const writeText = vi.fn().mockResolvedValue();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const dialog = await openForm();
    fireEvent.click(within(dialog).getByRole('button', { name: t.create, exact: true }));
    await screen.findByText(created.mot_de_passe_temporaire);
    fireEvent.click(screen.getByRole('button', { name: t.copyPassword }));
    await screen.findByRole('button', { name: t.copied });
    expect(writeText).toHaveBeenCalledWith(created.mot_de_passe_temporaire);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByText(created.mot_de_passe_temporaire)).toBeNull();
});

it('edits normal information without sending a password', async () => {
    utilisateursService.getAll.mockResolvedValue({ items: [created] });
    utilisateursService.update.mockResolvedValue(created);
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Modifier' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByLabelText(t.telephone).value).toBe('970123456');
    fireEvent.click(within(dialog).getByRole('button', { name: t.save }));
    await waitFor(() => expect(utilisateursService.update).toHaveBeenCalled());
    expect(utilisateursService.update.mock.calls[0][1]).not.toHaveProperty('mot_de_passe');
    expect(screen.queryByText(created.mot_de_passe_temporaire)).toBeNull();
});

it('opens user details from the list without displaying any password', async () => {
    utilisateursService.getAll.mockResolvedValue({ items: [created] });
    mount();
    fireEvent.click(await screen.findByRole('link', { name: 'Queen Safari Test' }));
    await waitFor(() => expect(utilisateursService.getById).toHaveBeenCalledWith('25'));
    await screen.findByText(created.email);
    expect(screen.queryByText(created.mot_de_passe_temporaire)).toBeNull();
    expect(screen.queryByText(t.temporaryPassword)).toBeNull();
});

it('shows an access denial on the detail page', async () => {
    utilisateursService.getById.mockRejectedValue({ response: { data: { detail: 'Accès refusé' } } });
    mount('/utilisateurs/99');
    expect((await screen.findByRole('alert')).textContent).toBe('Accès refusé');
    expect(screen.queryByText(created.email)).toBeNull();
});

it('provides matching French and English workflow translations', () => {
    expect(Object.keys(fr.userWorkflow).sort()).toEqual(Object.keys(en.userWorkflow).sort());
    expect(Object.values(en.userWorkflow).every(Boolean)).toBe(true);
});

it('validates phone boundaries and optional numbers independently of HTML', () => {
    expect(cleanLocalPhone('a12-34!56789099')).toBe('1234567890');
    expect(buildPhone('+243', '')).toBeNull();
    expect(buildPhone('+243', '12abc')).toBeUndefined();
    expect(buildPhone('+243', '12345678901')).toBeUndefined();
    expect(buildPhone('+', '970123456')).toBeUndefined();
    expect(buildPhone('+243', '970123456')).toBe('+243970123456');
    expect(splitPhone('+33612345678')).toEqual({ prefix: '+33', number: '612345678' });
    expect(splitPhone('+61412345678')).toEqual({ prefix: '+61', number: '412345678' });
    expect(splitPhone('+998123456789')).toEqual({ prefix: '+998', number: '123456789' });
    expect(userErrorMessage({ response: { data: { detail: [{ msg: 'Invalid phone' }] } } }, 'Fallback')).toBe('Invalid phone');
});


it('preserves an unchanged legacy phone when editing the name', async () => {
    utilisateursService.getAll.mockResolvedValue({ items: [{ ...created, telephone: '0970 123 456' }] });
    utilisateursService.update.mockResolvedValue(created);
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Modifier' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(t.nom + ' *'), { target: { value: 'Changed' } });
    fireEvent.click(within(dialog).getByRole('button', { name: t.save }));
    await waitFor(() => expect(utilisateursService.update).toHaveBeenCalled());
    expect(utilisateursService.update.mock.calls[0][1]).not.toHaveProperty('telephone');
});
