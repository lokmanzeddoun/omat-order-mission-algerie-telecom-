import { InputAdornment, Paper, Stack, TextField, Typography } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import OrderView from 'components/orders/OrderView';
import { ChangeEvent, useState } from 'react';

const OrderDashboard = () => {
  const [searchText, setSearchText] = useState('');

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };
  return (
    <Stack direction="column" spacing={1} width={1}>
      <Stack alignItems="center" justifyContent="space-between">
        <Typography variant="h4" minWidth={200}>
          Ordre Missions
        </Typography>
        <TextField
          variant="filled"
          size="small"
          placeholder="Recherche Ordre"
          value={searchText}
          onChange={handleInputChange}
          sx={{ width: 1, maxWidth: 250 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconifyIcon icon={'mynaui:search'} />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      <Paper sx={{ mt: 1.5, p: 0, pb: 0.75, minHeight: 411, width: 1 }}>
        <OrderView searchText={searchText} />
      </Paper>
    </Stack>
  );
};

export default OrderDashboard;
