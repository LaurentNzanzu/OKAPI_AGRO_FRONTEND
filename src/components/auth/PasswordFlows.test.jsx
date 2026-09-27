// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import ForceChangePassword from './ForceChangePassword';
import Login from './Login';
import auth from '../../services/auth';
import { getAccessibleHomePath } from '../../config/permissions';

const context = vi.hoisted(() => ({ updateUser: vi.fn(), login: vi.fn() }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => context }));
vi.mock('../../services/auth', () => ({ default: {
  forgotPassword: vi.fn(), verifyResetToken: vi.fn(), resetPassword: vi.fn(),
  forceChangePassword: vi.fn(), getCurrentUser: vi.fn(),
} }));
const Location = () => { const loc = useLocation(); return <output data-testid="location">{loc.pathname}{loc.search}</output>; };
const mount = (element, path = '/reset-password?token=private-reset-secret') => render(
  <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Location /><Routes><Route path="/reset-password" element={element} />
      <Route path="/forgot-password" element={element} /><Route path="/force-change-password" element={element} />
      <Route path="/login" element={path === '/login' ? element : <p>Connexion requise</p>} />
      <Route path="*" element={<p>Destination autorisée</p>} />
    </Routes>
  </MemoryRouter>);
beforeEach(() => { vi.resetAllMocks(); sessionStorage.clear(); auth.verifyResetToken.mockResolvedValue({ valid: true }); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

it('forgot displays only generic confirmation, ignoring any legacy token/link without logging them', async () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  auth.forgotPassword.mockResolvedValue({ reset_token: 'private-reset-secret', dev_reset_link: '/secret' });
  mount(<ForgotPassword />, '/forgot-password');
  fireEvent.change(screen.getByLabelText('Adresse e-mail'), { target: { value: 'someone@example.com' } });
  fireEvent.click(screen.getByRole('button', { name: 'Envoyer le lien' }));
  await screen.findByText(/Si cette adresse email est associée/);
  expect(document.body.textContent).not.toMatch(/private-reset-secret|Mode Développement|Aucun lien/);
  expect(log).not.toHaveBeenCalled();
});

it('captures the emailed token in memory and removes it from the router URL', async () => {
  mount(<ResetPassword />);
  await screen.findByLabelText('Nouveau mot de passe');
  expect(auth.verifyResetToken).toHaveBeenCalledWith('private-reset-secret');
  expect(screen.getByTestId('location').textContent).toBe('/reset-password');
  expect(sessionStorage.length).toBe(0);
  expect(localStorage.length).toBe(0);
});

it.each([false, 'missing'])('invalid/absent token %s withholds the form and offers a new link', async value => {
  auth.verifyResetToken.mockResolvedValue({ valid: false });
  mount(<ResetPassword />, value === 'missing' ? '/reset-password' : undefined);
  await screen.findByText('Lien invalide');
  expect(screen.queryByLabelText('Nouveau mot de passe')).toBeNull();
  expect(screen.getByRole('button', { name: 'Demander un nouveau lien' })).toBeDefined();
});

it('503 during verification offers retry and never grants access to the form', async () => {
  auth.verifyResetToken.mockRejectedValueOnce({ response: { status: 503, data: { detail: 'private-reset-secret' } } });
  mount(<ResetPassword />);
  await screen.findByText(/Service temporairement indisponible/);
  expect(screen.queryByLabelText('Nouveau mot de passe')).toBeNull();
  expect(document.body.textContent).not.toContain('private-reset-secret');
  fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
  await screen.findByLabelText('Nouveau mot de passe');
  expect(auth.verifyResetToken).toHaveBeenCalledTimes(2);
});

it('reset validates confirmation, prevents repeated submissions and redirects to login', async () => {
  let finish;
  auth.resetPassword.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  mount(<ResetPassword />);
  const password = await screen.findByLabelText('Nouveau mot de passe');
  const confirm = screen.getByLabelText('Confirmer le mot de passe');
  fireEvent.change(password, { target: { value: 'Password9' } });
  fireEvent.change(confirm, { target: { value: 'Different9' } });
  fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser' }));
  expect(auth.resetPassword).not.toHaveBeenCalled();
  fireEvent.change(confirm, { target: { value: 'Password9' } });
  fireEvent.submit(password.closest('form'));
  fireEvent.submit(password.closest('form'));
  expect(auth.resetPassword).toHaveBeenCalledOnce();
  expect(auth.resetPassword).toHaveBeenCalledWith('private-reset-secret', 'Password9');
  finish({ message: 'success' });
  await screen.findByText('Mot de passe mis à jour');
  await screen.findByText('Connexion requise', {}, { timeout: 4500 });
});

it('a token consumed after verification returns to the invalid-link screen', async () => {
  auth.resetPassword.mockRejectedValue({ response: { status: 400 } });
  mount(<ResetPassword />);
  for (const label of ['Nouveau mot de passe', 'Confirmer le mot de passe']) {
    fireEvent.change(await screen.findByLabelText(label), { target: { value: 'Password9' } });
  }
  fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser' }));
  await screen.findByText('Lien invalide');
});

it.each(['ADMIN', 'COMPTABLE', 'TECHNICIEN', 'MAGASINIER'])('forced change uses the refreshed %s role destination', async role => {
  const user = { id: 1, roles: [role], doit_changer_mot_de_passe: false };
  auth.forceChangePassword.mockResolvedValue({ success: true });
  auth.getCurrentUser.mockResolvedValue({ success: true, data: user });
  const { container } = mount(<ForceChangePassword />, '/force-change-password');
  for (const input of container.querySelectorAll('input[type="password"]')) fireEvent.change(input, { target: { value: 'Password9' } });
  fireEvent.click(screen.getByRole('button', { name: 'Valider et continuer' }));
  await screen.findByText('Destination autorisée');
  expect(context.updateUser).toHaveBeenCalledWith(user);
  expect(screen.getByTestId('location').textContent).toBe(getAccessibleHomePath(user));
});

it('after a committed forced change, profile retry does not submit the password twice', async () => {
  auth.forceChangePassword.mockResolvedValue({ success: true });
  auth.getCurrentUser.mockResolvedValueOnce({ success: false, status: 503 })
    .mockResolvedValueOnce({ success: true, data: { roles: ['ADMIN'], doit_changer_mot_de_passe: false } });
  const { container } = mount(<ForceChangePassword />, '/force-change-password');
  for (const input of container.querySelectorAll('input[type="password"]')) fireEvent.change(input, { target: { value: 'Password9' } });
  fireEvent.click(screen.getByRole('button', { name: 'Valider et continuer' }));
  const retry = await screen.findByRole('button', { name: 'Réessayer la vérification' });
  fireEvent.click(retry);
  await screen.findByText('Destination autorisée');
  expect(auth.forceChangePassword).toHaveBeenCalledOnce();
});

it('login reads the actual context response and redirects temporary passwords', async () => {
  context.login.mockResolvedValue({ success: true, data: { user: { roles: ['ADMIN'], doit_changer_mot_de_passe: true } } });
  const { container } = mount(<Login />, '/login');
  for (const input of container.querySelectorAll('input:not([type="checkbox"])')) fireEvent.change(input, { target: { value: input.type === 'email' ? 'a@example.com' : 'Password9' } });
  fireEvent.submit(container.querySelector('form'));
  await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/force-change-password'));
});
