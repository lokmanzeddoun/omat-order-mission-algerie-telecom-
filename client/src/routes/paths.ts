export const rootPaths = {
  root: '/',
  pageRoot: 'pages',
  authRoot: 'authentication',
  errorRoot: 'error',
  dashboard: 'dashboard',
};

export default {
  orders: `/${rootPaths.dashboard}/orders`,
  users: `/${rootPaths.dashboard}/users`,
  structures: `/${rootPaths.dashboard}/structures`,
  barem: `/${rootPaths.dashboard}/barem`,
  analytics: `/${rootPaths.dashboard}/admins/analytics`,
  home: `/${rootPaths.dashboard}/home`,
  me: `/${rootPaths.dashboard}/me`,
  messages: `/${rootPaths.pageRoot}/messages`,
  settings: `/${rootPaths.pageRoot}/settings`,
  signin: `/${rootPaths.authRoot}/signin`,
  forgotPassword: `/${rootPaths.authRoot}/forgot-password`,
  notFound: '/not-found',
};
