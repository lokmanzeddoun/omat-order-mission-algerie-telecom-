import { useState, ChangeEvent } from 'react';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
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
      <Stack alignItems="center" justifyContent="space-between">
        <Typography variant="h4" minWidth={200} sx={{ ml: 9 }}>
          Mes ordre de missions
        </Typography>
        <TextField
          variant="filled"
          size="medium"
          placeholder="Recherche Ordre"
          value={searchText}
          onChange={handleInputChange}
          sx={{ width: 1, maxWidth: 300, mr: 9 }}
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
