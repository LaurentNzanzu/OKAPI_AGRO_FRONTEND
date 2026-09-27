// @vitest-environment jsdom
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import api from './api';
import auth from './auth';
import { utilisateursService } from './utilisateurs';

const failure = (config, status) => Promise.reject({ config, response: { status, data: {} } });
const ok = (config, data = {}) => Promise.resolve({ config, data, status: 200 });
beforeEach(() => {
  window.history.replaceState({}, '', '/login');
  sessionStorage.clear();
  auth.setTokens('access-original', 'session-original', 3600);
  auth.setUser({ id: 1, doit_changer_mot_de_passe: true });
});
afterEach(() => vi.restoreAllMocks());

it('verifies reset via POST body, never GET or token URL or access headers', async () => {
  const adapter = vi.fn(config => ok(config, { valid: true }));
  api.defaults.adapter = adapter;
  expect(await auth.verifyResetToken('reset-secret')).toEqual({ valid: true });
  const config = adapter.mock.calls[0][0];
  expect(config.method).toBe('post');
  expect(config.url).toBe('/auth/verify-token');
  expect(JSON.parse(config.data)).toEqual({ token: 'reset-secret' });
  expect(config.headers.Authorization).toBeUndefined();
  expect(config.headers['X-Session-ID']).toBeUndefined();
});

it('clears local authentication and notifies the context only after successful reset', async () => {
  api.defaults.adapter = c => ok(c);
  const cleared = vi.fn();
  window.addEventListener('auth-cleared', cleared);
  await auth.resetPassword('reset-secret', 'Password9');
  expect(auth.getAccessToken()).toBeNull();
  expect(auth.getUser()).toBeNull();
  expect(cleared).toHaveBeenCalledOnce();
  window.removeEventListener('auth-cleared', cleared);
});

it.each([400, 401, 503])('reset failure %s neither refreshes nor deletes authentication', async status => {
  const adapter = vi.fn(c => failure(c, status));
  api.defaults.adapter = adapter;
  await expect(auth.resetPassword('reset-secret', 'Password9')).rejects.toBeDefined();
  expect(adapter).toHaveBeenCalledOnce();
  expect(auth.getAccessToken()).toBe('access-original');
});

it('mandatory password change preserves the session and does not invent a new flag', async () => {
  api.defaults.adapter = c => ok(c);
  expect((await auth.forceChangePassword('Password9')).success).toBe(true);
  expect(auth.getAccessToken()).toBe('access-original');
  expect(auth.getSessionUuid()).toBe('session-original');
  expect(auth.getUser().doit_changer_mot_de_passe).toBe(true);
});

it('voluntary change uses the real POST contract and preserves the session', async () => {
  const adapter = vi.fn(c => ok(c));
  api.defaults.adapter = adapter;
  await utilisateursService.changePassword({ ancien_mot_de_passe: 'Old9pass', nouveau_mot_de_passe: 'New9pass' });
  expect(adapter.mock.calls[0][0].url).toBe('/auth/change-password');
  expect(adapter.mock.calls[0][0].method).toBe('post');
  expect(auth.getAccessToken()).toBe('access-original');
  expect(auth.getSessionUuid()).toBe('session-original');
});

it.each([401, 403, 503])('refresh %s cleans only a definitive 401', async status => {
  api.defaults.adapter = c => failure(c, status);
  const result = await auth.refreshToken();
  expect(result.status).toBe(status);
  expect(auth.getAccessToken()).toBe(status === 401 ? null : 'access-original');
});

it.each([403, 503])('resource %s does not refresh or clear credentials', async status => {
  const adapter = vi.fn(c => failure(c, status));
  api.defaults.adapter = adapter;
  await expect(api.get('/biens')).rejects.toBeDefined();
  expect(adapter).toHaveBeenCalledOnce();
  expect(auth.getAccessToken()).toBe('access-original');
});

it('revoked session and invalid legacy refresh stop after one refresh', async () => {
  const adapter = vi.fn(c => failure(c, 401));
  api.defaults.adapter = adapter;
  await expect(api.get('/auth/me')).rejects.toBeDefined();
  expect(adapter.mock.calls.map(([c]) => c.url)).toEqual(['/auth/me', '/auth/refresh']);
  expect(auth.getAccessToken()).toBeNull();
});

it('a second 401 after successful refresh stops and clears the session', async () => {
  const adapter = vi.fn(c => c.url === '/auth/refresh'
    ? ok(c, { access_token: 'new-access', session_uuid: 'session-original', expires_in: 3600 }) : failure(c, 401));
  api.defaults.adapter = adapter;
  await expect(api.get('/auth/me')).rejects.toBeDefined();
  expect(adapter).toHaveBeenCalledTimes(3);
  expect(auth.getAccessToken()).toBeNull();
});

it('a temporary refresh failure retains tokens and propagates 503 without retry', async () => {
  const adapter = vi.fn(c => failure(c, c.url === '/auth/refresh' ? 503 : 401));
  api.defaults.adapter = adapter;
  await expect(api.get('/biens')).rejects.toMatchObject({ response: { status: 503 } });
  expect(adapter).toHaveBeenCalledTimes(2);
  expect(auth.getAccessToken()).toBe('access-original');
});

it('concurrent 401 and explicit refresh share one rotation then retry with the new access token', async () => {
  let release;
  const adapter = vi.fn(c => {
    if (c.url === '/auth/refresh') return new Promise(resolve => { release = () => resolve({ config: c, status: 200, data: { access_token: 'new-access', session_uuid: 'session-original', expires_in: 3600 } }); });
    return c.headers.Authorization === 'Bearer new-access' ? ok(c) : failure(c, 401);
  });
  api.defaults.adapter = adapter;
  const requests = [api.get('/one'), api.get('/two'), auth.refreshToken()];
  await vi.waitFor(() => expect(release).toBeTypeOf('function'));
  release();
  await Promise.all(requests);
  expect(adapter.mock.calls.filter(([c]) => c.url === '/auth/refresh')).toHaveLength(1);
});

it('does not log reset secrets or Axios errors', async () => {
  const spies = ['log', 'warn', 'error'].map(method => vi.spyOn(console, method).mockImplementation(() => {}));
  api.defaults.adapter = c => failure(c, 503);
  await expect(auth.verifyResetToken('never-log-reset-secret')).rejects.toBeDefined();
  expect(JSON.stringify(spies.flatMap(spy => spy.mock.calls))).not.toContain('never-log-reset-secret');
});

it.each(['refresh', 'me'])('an outstanding %s response cannot restore auth after reset cleanup', async endpoint => {
  let release;
  api.defaults.adapter = c => new Promise(resolve => {
    release = () => resolve({ config: c, status: 200, data: endpoint === 'refresh'
      ? { access_token: 'late-token', session_uuid: 'session-original', expires_in: 3600 }
      : { id: 1, roles: ['ADMIN'] } });
  });
  const request = endpoint === 'refresh' ? auth.refreshToken() : auth.getCurrentUser();
  await vi.waitFor(() => expect(release).toBeTypeOf('function'));
  auth.clearTokens();
  release();
  expect((await request).success).toBe(false);
  expect(auth.getAccessToken()).toBeNull();
  expect(auth.getUser()).toBeNull();
});
