import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import { ReactNode } from 'react';

interface CardContainerProps {
  title: string;
  children: ReactNode;
}

const CardContainer = ({ title, children }: CardContainerProps) => {
  return (
    <Stack sx={{ overflow: 'auto', height: 1, justifyContent: 'space-between' }} direction="column">
      {/* Title Section */}
      <Box sx={{ mb: { xs: 1.5, sm: 2.5 }, mt: { xs: 1, sm: 3 }, ml: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          {/* Icon on the left */}
          <IconifyIcon
            icon="mdi:account-group-outline"
            sx={{ fontSize: '20px', color: 'text.secondary' }}
          />

          {/* Title */}
          <Typography
            sx={{
              fontSize: {
                xs: 'body2.fontSize',
                md: 'h6.fontSize',
              },
              fontWeight: 600,
              color: 'text.primary',
            }}
          >
            {title}
          </Typography>
        </Stack>
      </Box>

      {/* Content Section */}
      <Card sx={{ backgroundColor: 'common.white', width: 1, flex: 1, p: 0 }}>
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: 1,
            width: 1,
            p: 0,
          }}
        >
          {children}
        </CardContent>
      </Card>
    </Stack>
  );
};

export default CardContainer;
