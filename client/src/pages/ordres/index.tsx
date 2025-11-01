import {
  Box,
  InputAdornment,
  Paper,
  TextField,
  Typography,
  Container,
  Grid,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import OrderView from 'components/orders/OrderViewAdmin';
import { ChangeEvent, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store/rootReducer';
const OrderDashboard = () => {
  const [searchText, setSearchText] = useState('');
  const { orders } = useSelector((s: RootState) => s.orders);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const totalMissions = orders?.length || 0;
  const pendingMissions = orders?.filter((m: any) => m.status === 'PENDING')?.length || 0;
  const approvedMissions = orders?.filter((m: any) => m.status === 'APPROVED')?.length || 0;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <AssignmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight="600">
              Ordres de Mission
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gérer et suivre les ordres de mission
            </Typography>
          </Box>
          <Tooltip title="Rechercher">
            <TextField
              variant="outlined"
              size="small"
              placeholder="Rechercher une mission..."
              value={searchText}
              onChange={handleInputChange}
              sx={{
                width: 300,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'background.paper',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'action.active' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Tooltip>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AssignmentIcon sx={{ fontSize: 24, color: 'primary.main' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Total Missions
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="600" color="primary.main">
              {totalMissions}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: (theme) => alpha(theme.palette.warning.main, 0.04),
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AssignmentIcon sx={{ fontSize: 24, color: 'warning.main' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                En Attente
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="600" color="warning.main">
              {pendingMissions}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: (theme) => alpha(theme.palette.success.main, 0.04),
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AssignmentIcon sx={{ fontSize: 24, color: 'success.main' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Approuvées
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="600" color="success.main">
              {approvedMissions}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Table Card */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          minHeight: 411,
        }}
      >
        <OrderView searchText={searchText} />
      </Paper>
    </Container>
  );
};

export default OrderDashboard;
