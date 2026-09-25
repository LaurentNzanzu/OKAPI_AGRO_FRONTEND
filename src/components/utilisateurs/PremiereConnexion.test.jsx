// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from '../../context/LanguageContext';
import ProtectedRoute from '../../routes/ProtectedRoute';
import ForceChangePassword from '../auth/ForceChangePassword';
import authService from '../../services/auth';

const state = vi.hoisted(() => ({ user: null, updateUser: vi.fn() }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({
    authenticated: true, authReady: true, loading: false, isAuthenticated: true,
    user: state.user, updateUser: state.updateUser,
}) }));
vi.mock('../../services/auth', () => ({ default: {
    getAccessToken: () => 'test-token', isTokenExpired: () => false, forceChangePassword: vi.fn(),
} }));

beforeEach(() => {
    state.user = { id: 25, roles: ['COMPTABLE'], doit_changer_mot_de_passe: true };
    vi.clearAllMocks();
    authService.forceChangePassword.mockResolvedValue({ success: true });
});
afterEach(cleanup);

const mount = () => render(<LanguageProvider><MemoryRouter initialEntries={['/dashboard']}
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes>
    <Route path="/dashboard" element={<ProtectedRoute><p>Dashboard accessible</p></ProtectedRoute>} />
    <Route path="/force-change-password" element={<ForceChangePassword />} />
</Routes></MemoryRouter></LanguageProvider>);

it('redirects a new account to the existing forced-password screen', async () => {
    mount();
    await screen.findByText('Changement de mot de passe requis');
    expect(screen.queryByText('Dashboard accessible')).toBeNull();
});

it('uses the existing change action, clears the flag and opens the dashboard', async () => {
    state.updateUser.mockImplementation((user) => { state.user = user; });
    const { container } = mount();
    await screen.findByText('Changement de mot de passe requis');
    for (const input of container.querySelectorAll('input[type="password"]')) {
        fireEvent.change(input, { target: { value: 'PersonalPass9!' } });
    }
    fireEvent.click(screen.getByRole('button', { name: 'Valider et continuer' }));
    await waitFor(() => expect(authService.forceChangePassword).toHaveBeenCalledWith('PersonalPass9!'));
    await screen.findByText('Dashboard accessible');
    expect(state.user.doit_changer_mot_de_passe).toBe(false);
});

it('allows normal access once the mandatory change has been completed', async () => {
    state.user.doit_changer_mot_de_passe = false;
    mount();
    await screen.findByText('Dashboard accessible');
    expect(screen.queryByText('Changement de mot de passe requis')).toBeNull();
});
