import { useState, PropsWithChildren } from 'react';
import Stack from '@mui/material/Stack';
import Topbar from 'layouts/user-layout/topbar';
import { ButtonBase, Typography } from '@mui/material';
import LogoImg from 'assets/Logo.png';
import Image from 'components/base/Image';
import Link from '@mui/material/Link';

const UserLayout = ({ children }: PropsWithChildren) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  return (
    <Stack width={1} minHeight="100vh">
      <Stack
        component="main"
        direction="column"
        width={{ xs: 1, lg: 'calc(100% - 252px)' }}
        flexGrow={1}
      >
        <Topbar isClosing={isClosing} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        {children}
      </Stack>
    </Stack>
  );
};

export default UserLayout;
