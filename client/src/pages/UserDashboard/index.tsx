import { useState, ChangeEvent } from 'react';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import Box from '@mui/material/Box';
import IconifyIcon from 'components/base/IconifyIcon';
import OrderView from 'components/orders/OrderView';
import SearchIcon from 'assets/icons/mynaui--search.svg?react';

const UserDashboard = () => {
  const [searchText, setSearchText] = useState('');
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  return (
    <Stack direction="column" spacing={1} width={1}>
      <Stack
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Box />
        <Typography variant="h4" minWidth={200} sx={{ justifySelf: 'center' }}>
          Mes ordre de missions
        </Typography>
        <TextField
          variant="filled"
          size="medium"
          placeholder="Recherche Ordre"
          value={searchText}
          onChange={handleInputChange}
          sx={{ width: 1, maxWidth: 320, justifySelf: 'end', mr: { xs: 2, sm: 3 } }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconifyIcon icon={SearchIcon} />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      <Paper sx={{ mt: 1.5, p: 3, pb: 0.75, minHeight: 411, width: 1 }}>
        <OrderView searchText={searchText} />
      </Paper>
    </Stack>
  );
};

export default UserDashboard;
