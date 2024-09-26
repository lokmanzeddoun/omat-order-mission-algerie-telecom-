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
  home: `/${rootPaths.dashboard}/home`,
  messages: `/${rootPaths.pageRoot}/messages`,
  settings: `/${rootPaths.pageRoot}/settings`,
  signin: `/${rootPaths.authRoot}/signin`,
  forgotPassword: `/${rootPaths.authRoot}/forgot-password`,
  404: `/${rootPaths.errorRoot}/404`,
};
