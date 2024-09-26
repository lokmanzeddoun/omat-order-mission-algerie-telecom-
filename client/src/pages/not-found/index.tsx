import { Box, Button, Container, Link, Typography } from '@mui/material';
import NotFoundSVG from 'assets/not-found.svg';
import Image from 'components/base/Image';
const NotFoundPage = () => {
  return (
    <Container>
      <Box
        sx={{
          py: 12,
          maxWidth: 480,
          mx: 'auto',
          display: 'flex',
          minHeight: '100vh',
          textAlign: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h3" sx={{ mb: 3 }}>
          Oops! Page Non Trouve
        </Typography>

        <Typography sx={{ color: 'text.secondary' }}>
          Nous n’avons pas pu localiser la page que vous essayez d’atteindre. Nous nous excusons
          pour tout inconvénient que cela a pu causer. Merci de votre compréhension !
        </Typography>

        <Image
          alt="Not Found Image"
          src={NotFoundSVG}
          sx={{
            mx: 'auto',
            height: 260,
            my: { xs: 1, sm: 2 },
            width: { xs: 1, sm: 340 },
          }}
        />

        <Button
          href="/"
          size="large"
          variant="contained"
          component={Link}
          sx={{ '&:hover': { color: 'common.white' } }}
        >
          Retourner à l'accueil
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
