import { useState, ChangeEvent } from 'react';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import IconifyIcon from 'components/base/IconifyIcon';
import OrderView from 'components/orders/OrderView';
import DecompteCommentsButton from 'components/orders/DecompteCommentsButton';
import SearchIcon from 'assets/icons/mynaui--search.svg?react';

const UserDashboard = () => {
  const [searchText, setSearchText] = useState('');

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  return (
    <Stack direction="column" spacing={3} width={1} sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header Section */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            color: 'text.primary'
          }}
        >
          Mes ordre de missions
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <DecompteCommentsButton />

          <TextField
            variant="outlined"
            size="medium"
            placeholder="Rechercher un ordre de mission..."
            value={searchText}
            onChange={handleInputChange}
            sx={{
              width: { xs: 1, sm: 'auto' },
              minWidth: { sm: 320 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconifyIcon icon={SearchIcon} sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
        </Stack>
      </Stack>

      {/* Content Section */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          minHeight: 500,
          width: 1,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          backgroundColor: 'background.paper'
        }}
      >
        <OrderView searchText={searchText} />
      </Paper>
    </Stack>
  );
};

export default UserDashboard;
