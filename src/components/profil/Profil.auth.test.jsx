// @vitest-environment jsdom
import React from 'react';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import Profil from './Profil';
import { utilisateursService } from '../../services/utilisateurs';

const state = vi.hoisted(() => ({
  user: { id: 1, roles: ['ADMIN'], email: 'a@example.com' }, updateUser: vi.fn(), reloadUser: vi.fn(),
}));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => state }));
vi.mock('../../context/LanguageContext', () => ({ useTranslation: () => ({ t: () => '' }) }));
vi.mock('../../services/utilisateurs', () => ({ utilisateursService: { changePassword: vi.fn() } }));
const Location = () => <output>{useLocation().pathname}</output>;
beforeEach(() => {
  vi.resetAllMocks();
  state.reloadUser.mockResolvedValue({ success: true, data: state.user });
  utilisateursService.changePassword.mockResolvedValue({ message: 'success' });
});
afterEach(cleanup);
it('voluntary password success reloads the user and keeps the profile page open', async () => {
  const { container } = render(<MemoryRouter initialEntries={['/profil']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Location /><Profil /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: /Changer le mot de passe/ }));
  for (const name of ['ancien_mot_de_passe', 'nouveau_mot_de_passe', 'confirmation_mot_de_passe']) {
    fireEvent.change(container.querySelector(`input[name="${name}"]`), { target: { value: name === 'ancien_mot_de_passe' ? 'OldPass9' : 'NewPass9' } });
  }
  fireEvent.click(screen.getByRole('button', { name: 'Changer le mot de passe' }));
  await screen.findByText('Mot de passe modifié avec succès !');
  expect(state.reloadUser).toHaveBeenCalledOnce();
  expect(screen.getByText('/profil')).toBeDefined();
  expect(utilisateursService.changePassword).toHaveBeenCalledWith({ ancien_mot_de_passe: 'OldPass9', nouveau_mot_de_passe: 'NewPass9' });
});
