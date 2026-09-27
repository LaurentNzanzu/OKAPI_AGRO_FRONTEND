// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import ProtectedRoute from '../routes/ProtectedRoute';
import auth from '../services/auth';

vi.mock('../context/LanguageContext', () => ({ useTranslation: () => ({ t: () => '' }) }));
vi.mock('../services/auth', () => ({ default: {
  getCurrentUser: vi.fn(), getAccessToken: () => 'existing-token', isTokenExpired: () => false,
  clearTokens: vi.fn(), getSessionUuid: vi.fn(), getFingerprint: vi.fn(),
} }));
const State = () => { const { user } = useAuth(); return <p>{user ? 'Authenticated user' : 'No user'}</p>; };
const mount = () => render(<MemoryRouter initialEntries={['/dashboard']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
  <AuthProvider><State /><Routes>
    <Route path="/dashboard" element={<ProtectedRoute><p>Protected content</p></ProtectedRoute>} />
    <Route path="/login" element={<p>Login page</p>} />
  </Routes></AuthProvider>
</MemoryRouter>);
beforeEach(() => {
  vi.resetAllMocks();
  window.history.replaceState({}, '', '/dashboard');
});
afterEach(cleanup);

it('503 on startup preserves storage, withholds protected content and allows successful retry', async () => {
  auth.getCurrentUser.mockResolvedValueOnce({ success: false, status: 503, error: 'Service temporairement indisponible.' })
    .mockResolvedValueOnce({ success: true, data: { roles: ['ADMIN'] } });
  mount();
  const retry = await screen.findByRole('button', { name: 'Réessayer' });
  expect(screen.queryByText('Protected content')).toBeNull();
  expect(auth.clearTokens).not.toHaveBeenCalled();
  fireEvent.click(retry);
  await screen.findByText('Protected content');
  expect(auth.getCurrentUser).toHaveBeenCalledTimes(2);
});

it('reset/revocation cleanup removes the context user as well as local tokens', async () => {
  auth.getCurrentUser.mockResolvedValue({ success: true, data: { roles: ['ADMIN'] } });
  mount();
  await screen.findByText('Authenticated user');
  window.dispatchEvent(new Event('auth-cleared'));
  await waitFor(() => expect(screen.queryByText('Authenticated user')).toBeNull());
  expect(screen.queryByText('Protected content')).toBeNull();
});
