export const rootPaths = {
  root: '/',
  authRoot: 'authentication',
  dashboard: 'dashboard',
};

// Must mirror the routes declared in routes/router.tsx
export default {
  signin: rootPaths.root,
  forgotPassword: `/${rootPaths.authRoot}/forgot-password`,
  changePassword: '/change-password',
  admins: `/${rootPaths.dashboard}/admins`,
  users: `/${rootPaths.dashboard}/users`,
  me: `/${rootPaths.dashboard}/me`,
  notFound: '/not-found',
};
