import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import http, { onSession } from './http';

const reply = (config: InternalAxiosRequestConfig, status: number, data: unknown = {}) => {
  const response = { data, status, statusText: '', headers: {}, config };
  if (status >= 400) {
    return Promise.reject(Object.assign(new Error(`HTTP ${status}`), { config, response, isAxiosError: true }));
  }
  return Promise.resolve(response);
};

describe('http session refresh', () => {
  const original = http.defaults.adapter;
  afterEach(() => {
    http.defaults.adapter = original;
    delete http.defaults.headers.common['Authorization'];
  });

  it('refreshes once for parallel 401s and replays them with the new token', async () => {
    let refreshes = 0;
    const refreshed = vi.fn();
    onSession({ refreshed, ended: vi.fn() });
    http.defaults.adapter = (async (config) => {
      if (config.url === '/auth/refresh') {
        refreshes++;
        await new Promise((r) => setTimeout(r, 20));
        return reply(config, 200, { token: 'fresh', user: { matricule: 1 } });
      }
      const auth = String(config.headers?.['Authorization'] ?? '');
      return auth === 'Bearer fresh' ? reply(config, 200, { ok: config.url }) : reply(config, 401);
    }) as AxiosAdapter;

    const results = await Promise.all([http.get('/a'), http.get('/b'), http.get('/c')]);

    expect(refreshes).toBe(1);
    expect(results.map((r) => r.data.ok)).toEqual(['/a', '/b', '/c']);
    expect(refreshed).toHaveBeenCalledTimes(1);
    expect(http.defaults.headers.common['Authorization']).toBe('Bearer fresh');
  });

  it('never retries a failed login, and sends no token the app does not hold', async () => {
    let refreshes = 0;
    const seen: string[] = [];
    http.defaults.adapter = (async (config) => {
      if (config.url === '/auth/refresh') refreshes++;
      seen.push(String(config.headers?.['Authorization'] ?? ''));
      return reply(config, 401);
    }) as AxiosAdapter;

    await expect(http.post('/auth/login', {})).rejects.toBeTruthy();
    expect(refreshes).toBe(0);
    expect(seen).toEqual(['']);
  });

  it('ends the session when the refresh fails', async () => {
    const ended = vi.fn();
    onSession({ refreshed: vi.fn(), ended });
    http.defaults.adapter = (async (config) => reply(config, 401)) as AxiosAdapter;
    await expect(http.get('/x')).rejects.toBeTruthy();
    expect(ended).toHaveBeenCalledTimes(1);
  });
});
