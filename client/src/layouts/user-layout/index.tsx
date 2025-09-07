import { PropsWithChildren } from 'react';
import Stack from '@mui/material/Stack';
import Topbar from 'layouts/user-layout/topbar';

const UserLayout = ({ children }: PropsWithChildren) => {
  return (
    <Stack width={1} minHeight="100vh">
      <Stack component="main" direction="column" width={1} flexGrow={1}>
        <Topbar />
        {children}
      </Stack>
    </Stack>
  );
};

export default UserLayout;
