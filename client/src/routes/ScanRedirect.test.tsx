import { render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import ProtectedRoute from 'ProtectedRoute';
import ScanRedirect from './ScanRedirect';
import HomeOrSignin from './HomeOrSignin';

type Auth = { isAuthenticated: boolean; token: string | null; loading: boolean; user: { role: string } | null };

const signedIn = (role: string): Auth => ({ isAuthenticated: true, token: 't', loading: false, user: { role } });

/** Prints where the router ended up. */
const Where = () => <p data-testid="where">{useLocation().pathname}</p>;

function renderAt(url: string, auth: Auth) {
  const store = configureStore({ reducer: { auth: () => auth } });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route
            path="/scan/:kind/:id"
            element={
              <ProtectedRoute>
                <ScanRedirect />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe('ScanRedirect', () => {
  it('sends an admin to the ordre detail page', () => {
    renderAt('/scan/ordre/12', signedIn('ADMIN'));
    expect(screen.getByTestId('where')).toHaveTextContent('/dashboard/admins/ordres/12');
  });

  it('sends a super-admin to the décompte detail page', () => {
    renderAt('/scan/decompte/5', signedIn('SUPER_ADMIN'));
    expect(screen.getByTestId('where')).toHaveTextContent('/dashboard/admins/decomptes/5');
  });

  it('sends a user to their own ordre page', () => {
    renderAt('/scan/ordre/12', signedIn('USER'));
    expect(screen.getByTestId('where')).toHaveTextContent('/dashboard/users/ordres/12');
  });

  it('tells a user that décomptes are reserved to administrators', () => {
    renderAt('/scan/decompte/5', signedIn('USER'));
    expect(screen.getByRole('heading')).toHaveTextContent('Accès réservé aux administrateurs');
  });

  it('rejects malformed links', () => {
    renderAt('/scan/facture/abc', signedIn('ADMIN'));
    expect(screen.getByTestId('where')).toHaveTextContent('/not-found');
  });
});

describe('sign-in return path', () => {
  it('returns to the scanned link once signed in', () => {
    const store = configureStore({ reducer: { auth: () => signedIn('ADMIN') } });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[{ pathname: '/', state: { from: '/scan/decompte/5' } }]}>
          <Routes>
            <Route path="/" element={<HomeOrSignin />} />
            <Route path="*" element={<Where />} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByTestId('where')).toHaveTextContent('/scan/decompte/5');
  });

  it('ignores non-scan return paths', () => {
    const store = configureStore({ reducer: { auth: () => signedIn('USER') } });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[{ pathname: '/', state: { from: '/dashboard/admins/users' } }]}>
          <Routes>
            <Route path="/" element={<HomeOrSignin />} />
            <Route path="*" element={<Where />} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByTestId('where')).toHaveTextContent('/dashboard/users');
  });
});
