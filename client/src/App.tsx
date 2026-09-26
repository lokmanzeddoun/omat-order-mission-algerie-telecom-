import { Outlet } from 'react-router-dom';
import { Toaster } from 'components/ui';
import AlertBridge from 'layouts/app-shell/AlertBridge';

function App() {
  return (
    <>
      <Outlet />
      <AlertBridge />
      <Toaster />
    </>
  );
}

export default App;
