import { Box, InputAdornment, Paper, Stack, TextField, Typography } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import OrderView from 'components/orders/OrderViewAdmin';
import { ChangeEvent, useState } from 'react';
import SearchIcon from 'assets/icons/mynaui--search.svg?react';
const OrderDashboard = () => {
  const [searchText, setSearchText] = useState('');

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };
  return (
    <Stack direction="column" spacing={1} width={1}>
      <Stack direction="row" alignItems="center" sx={{ px: 2 }}>
        <Box flex={1} />
        <Typography variant="h4" sx={{ flex: 1, textAlign: 'center' }} minWidth={200}>
          Ordre Missions
        </Typography>
        <Box flex={1} display="flex" justifyContent="flex-end">
          <TextField
            variant="filled"
            size="medium"
            placeholder="Recherche Ordre"
            value={searchText}
            onChange={handleInputChange}
            sx={{ width: 1, maxWidth: 250 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconifyIcon icon={SearchIcon} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Stack>

      <Paper sx={{ mt: 1.5, p: 0, pb: 0.75, minHeight: 411, width: 1 }}>
        <OrderView searchText={searchText} />
      </Paper>
    </Stack>
  );
};

export default OrderDashboard;
