import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n, { setLanguage } from 'i18n';
import { formatDA } from 'lib/format';
import { countOf } from 'components/common/bulk';
import { extractErrorMessage } from 'helpers/errorHandler';
import { decompteStatus } from 'constants/statusLabels';
import { roleLabels } from 'constants/labels';

const httpError = (status: number, message?: string) => ({
  isAxiosError: true,
  response: { status, data: message ? { message } : {} },
});

describe('language switch', () => {
  afterEach(async () => {
    await setLanguage('fr');
    vi.unstubAllGlobals();
  });

  it('flips the document to right-to-left for Arabic and back', async () => {
    await setLanguage('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
    await setLanguage('fr');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('fr');
  });

  it('remembers the choice in this browser', async () => {
    // Node's own experimental localStorage can shadow jsdom's, so use an in-memory one.
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
    await setLanguage('ar');
    expect(store.get('omat.lang')).toBe('ar');
  });

  it('translates enum labels when they are read', async () => {
    expect(decompteStatus.REGECTED.label).toBe('Rejeté');
    expect(roleLabels.ADMIN).toBe('Administrateur');
    await setLanguage('ar');
    expect(decompteStatus.REGECTED.label).toBe('مرفوض');
    expect(roleLabels.ADMIN).toBe('مسؤول');
  });

  it('uses Arabic plural forms', async () => {
    await setLanguage('ar');
    expect(countOf(1, 'user')).toBe('مستخدم واحد');
    expect(countOf(2, 'user')).toBe('مستخدمان');
    expect(countOf(3, 'user')).toBe('3 مستخدمين');
    expect(countOf(11, 'user')).toBe('11 مستخدمًا');
  });

  it('keeps Latin digits for amounts in Arabic', async () => {
    await setLanguage('ar');
    // Same grouping as in French (a dot would read as a decimal separator).
    expect(formatDA(568644, 0)).toMatch(/^568\s644 د\.ج$/);
    expect(i18n.t('common:numbered', { n: 42 })).toBe('رقم 42');
  });

  it('translates API errors from the status or a known backend message', async () => {
    expect(extractErrorMessage(httpError(403))).toBe("Vous n'avez pas les permissions nécessaires");
    await setLanguage('ar');
    expect(extractErrorMessage(httpError(403))).toBe('ليست لديك الصلاحيات اللازمة');
    expect(extractErrorMessage(httpError(400, 'Wrong credentials'))).toBe('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    expect(extractErrorMessage({ isAxiosError: true, code: 'ERR_NETWORK' })).toBe('خطأ في الاتصال. تحقّق من اتصالك بالإنترنت.');
  });
});
