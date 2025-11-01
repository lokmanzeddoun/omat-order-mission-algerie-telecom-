import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
  Tab,
  Tabs,
  Typography,
  TextField,
  InputAdornment,
  Stack,
  Chip,
  Paper,
  Grid,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  FolderOpen as FolderOpenIcon,
  Assignment as AssignmentIcon,
  Receipt as ReceiptIcon,
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import http from 'helpers/http';
import { useSelector } from 'react-redux';
import { RootState } from 'store/rootReducer';

type Mission = {
  n_mission: number;
  destination?: string | null;
  motif?: string | null;
  updatedAt: string;
};

type Decompte = {
  n_decompte: number;
  montant: number;
  updatedAt: string;
  mission?: { n_mission: number };
};

const ArchivePage = () => {
  const [tab, setTab] = useState<'missions' | 'decomptes'>('missions');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [decomptes, setDecomptes] = useState<Decompte[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { token } = useSelector((s: RootState) => s.auth);
  const selectedYear = useSelector((s: RootState) => (s as any).exercice?.selectedYear ?? null);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    const params = selectedYear ? { year: selectedYear } : {};
    http
      .get<Mission[]>('/archive/missions', { headers, params })
      .then((r) => setMissions(r.data || []))
      .catch(() => setMissions([]));
    http
      .get<Decompte[]>('/archive/decomptes', { headers, params })
      .then((r) => setDecomptes(r.data || []))
      .catch(() => setDecomptes([]));
  }, [token, selectedYear]);

  const filteredMissions = missions.filter(
    (m) =>
      m.n_mission.toString().includes(searchQuery) ||
      m.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.motif?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDecomptes = decomptes.filter(
    (d) =>
      d.n_decompte.toString().includes(searchQuery) ||
      d.mission?.n_mission.toString().includes(searchQuery) ||
      d.montant.toString().includes(searchQuery)
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <FolderOpenIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="600">
            Archive
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Consultez l'historique des missions et décomptes archivés
          {selectedYear && ` pour l'exercice ${selectedYear}`}
        </Typography>
      </Box>

      {/* Search Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <TextField
          fullWidth
          placeholder={
            tab === 'missions'
              ? 'Rechercher par numéro, destination ou motif...'
              : 'Rechercher par numéro de décompte ou mission...'
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'background.paper',
            },
          }}
        />
      </Paper>

      {/* Tabs */}
      <Paper elevation={0} sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              minHeight: 64,
            },
          }}
        >
          <Tab
            value="missions"
            icon={<AssignmentIcon />}
            iconPosition="start"
            label={`Missions (${filteredMissions.length})`}
          />
          <Tab
            value="decomptes"
            icon={<ReceiptIcon />}
            iconPosition="start"
            label={`Décomptes (${filteredDecomptes.length})`}
          />
        </Tabs>
      </Paper>

      {/* Content */}
      {tab === 'missions' ? (
        <Box>
          {filteredMissions.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: 'center',
                backgroundColor: (theme) => alpha(theme.palette.grey[500], 0.05),
              }}
            >
              <FolderOpenIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2, opacity: 0.4 }} />
              <Typography variant="h6" color="text.primary" gutterBottom sx={{ opacity: 0.7 }}>
                {searchQuery ? 'Aucun résultat trouvé' : 'Aucune mission archivée'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchQuery
                  ? 'Essayez de modifier votre recherche'
                  : 'Les missions archivées apparaîtront ici'}
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {filteredMissions.map((m) => (
                <Card
                  key={m.n_mission}
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: (theme) => `0 0 0 1px ${theme.palette.primary.main}`,
                    },
                  }}
                >
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AssignmentIcon color="primary" />
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ opacity: 0.8 }}>
                              Mission
                            </Typography>
                            <Typography variant="h6" fontWeight="600" color="text.primary">
                              #{m.n_mission}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={5}>
                        <Stack spacing={1}>
                          {m.destination && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocationIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                              <Typography variant="body2" fontWeight="500" color="text.primary">
                                {m.destination}
                              </Typography>
                            </Box>
                          )}
                          {m.motif && (
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {m.motif}
                            </Typography>
                          )}
                        </Stack>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                          <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(m.updatedAt)}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      ) : (
        <Box>
          {filteredDecomptes.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: 'center',
                backgroundColor: (theme) => alpha(theme.palette.grey[500], 0.05),
              }}
            >
              <ReceiptIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2, opacity: 0.4 }} />
              <Typography variant="h6" color="text.primary" gutterBottom sx={{ opacity: 0.7 }}>
                {searchQuery ? 'Aucun résultat trouvé' : 'Aucun décompte archivé'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchQuery
                  ? 'Essayez de modifier votre recherche'
                  : 'Les décomptes archivés apparaîtront ici'}
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {filteredDecomptes.map((d) => (
                <Card
                  key={d.n_decompte}
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: (theme) => `0 0 0 1px ${theme.palette.primary.main}`,
                    },
                  }}
                >
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ReceiptIcon color="primary" />
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ opacity: 0.8 }}>
                              Décompte
                            </Typography>
                            <Typography variant="h6" fontWeight="600" color="text.primary">
                              #{d.n_decompte}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        {d.mission?.n_mission && (
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ opacity: 0.8 }}>
                              Mission associée
                            </Typography>
                            <Chip
                              label={`#${d.mission.n_mission}`}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          </Box>
                        )}
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MoneyIcon sx={{ fontSize: 18, color: 'success.main' }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ opacity: 0.8 }}>
                              Montant
                            </Typography>
                            <Typography variant="body1" fontWeight="600" color="success.main">
                              {formatCurrency(d.montant)}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                          <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(d.updatedAt)}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      )}
    </Container>
  );
};

export default ArchivePage;
