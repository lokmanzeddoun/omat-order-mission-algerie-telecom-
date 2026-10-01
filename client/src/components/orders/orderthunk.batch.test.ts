import { beforeEach, describe, expect, it, vi } from 'vitest';
import http from 'helpers/http';
import { addOrdersBatch } from './orderthunk';

vi.mock('helpers/http', () => ({ default: { post: vi.fn(), get: vi.fn() } }));
vi.mock('file-saver', () => ({ saveAs: vi.fn() }));

const order = {
  date_sortie: '2026-03-10',
  heure_sortie: '08:00',
  motif: 'Audit',
  destination: 'Oran',
  transport: 'SERVICE_CAR',
  direction: 'NORD',
} as never;

beforeEach(() => vi.clearAllMocks());

describe('addOrdersBatch', () => {
  it('posts the shared fields once with every matricule', async () => {
    vi.mocked(http.post).mockResolvedValue({ data: new Blob(['%PDF']), headers: {} } as never);
    vi.mocked(http.get).mockResolvedValue({ data: [] } as never);
    const dispatch = vi.fn();
    const result = await addOrdersBatch(order, [1, 2, 3], 'tok')(dispatch);

    expect(result).toEqual({ ok: true });
    const [url, body] = vi.mocked(http.post).mock.calls[0];
    expect(url).toBe('/missions/batch');
    expect(body).toEqual(expect.objectContaining({ userMatricules: [1, 2, 3], destination: 'Oran' }));
    expect(body).not.toHaveProperty('heure_sortie');
  });

  it('turns a refused batch (blob error body) into per-user messages', async () => {
    const body = { errors: [{ matricule: 4, message: 'Administrators may create missions only for users in their own structure.' }, { matricule: 9, message: 'Target user with matricule 9 not found' }] };
    vi.mocked(http.post).mockRejectedValue({ response: { status: 400, data: new Blob([JSON.stringify(body)]) } });
    const result = await addOrdersBatch(order, [1, 4, 9], 'tok')(vi.fn());

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual({ 4: 'Cet employé n’appartient pas à votre structure.', 9: 'Employé introuvable.' });
  });
});
