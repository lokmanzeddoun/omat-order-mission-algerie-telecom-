import sitemap from 'routes/sitemap';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import CollapseListItem from './list-items/CollapseListItem';
import ListItem from './list-items/ListItem';
import Image from 'components/base/Image';
import LogoImg from 'assets/Logo.png';
import { useSelector } from 'react-redux';
import { RootState } from 'store/rootReducer';
import { useNavigate } from 'react-router-dom';
const DrawerItems = () => {
  const navigate = useNavigate();
  const { loading } = useSelector((s: RootState) => s.auth);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;
    navigate('/');
  };

  return (
    <>
      <Stack
        position="sticky"
        top={0}
        pt={4}
        pb={2.5}
        alignItems="center"
        bgcolor="background.paper"
        zIndex={1000}
      >
        <ButtonBase onClick={handleLogoClick} disableRipple>
          <Image src={LogoImg} alt="logo" height={40} width={40} sx={{ mr: 1.25 }} />
          <Typography variant="h3" color="text.primary" letterSpacing={1}>
            OMAT
          </Typography>
        </ButtonBase>
      </Stack>

      <List component="nav" sx={{ mt: 4, mb: 15, px: 0 }}>
        {sitemap.map((route) =>
          route.items ? (
            <CollapseListItem key={route.id} {...route} />
          ) : (
            <ListItem key={route.id} {...route} />
          ),
        )}
      </List>

      <Stack
        position="relative"
        mt="auto"
        mb={4}
        height={300}
        width={1}
        sx={{ userSelect: 'none' }}
      >
      </Stack>
    </>
  );
};

export default DrawerItems;
