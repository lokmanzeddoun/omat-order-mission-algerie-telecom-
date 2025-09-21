import { useEffect, useState, useCallback } from 'react';
import { Button, Typography, Paper, Stack, Box, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import http from 'helpers/http';
import PageLoader from 'components/loader/PageLoader';
import { setAlert } from 'components/alert/alert.reducer';
import { useDispatch } from 'react-redux';
import { AppDispatch } from 'store';
import { AlertTypes } from 'constants/alert';

const AdminComments = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [openDetail, setOpenDetail] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await http.get('/comments/admin');
      setItems(res.data || []);
    } catch (err: any) {
      dispatch(setAlert({ msg: err?.response?.data?.message || err.message, type: AlertTypes.ERROR }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => { load(); }, [load]);

  // Define which comment types are for admins
  const ADMIN_TYPES = ['OTHER', 'SUPPORT', 'FORGET_PASSWORD'];

  // Helper to resolve user id and display name from different shapes
  const resolveUser = (it: any) => {
    // priority: nom/prenom, it.user.{id,nom,prenom,name}, it.userId, it.name
    const id = it.userId || (it.user && (it.user.id || it.user.userId)) || null;
    const nom = it.nom || (it.user && (it.user.nom || it.user.lastName)) || null;
    const prenom = it.prenom || (it.user && (it.user.prenom || it.user.firstName)) || null;
    const fullName = [nom, prenom].filter(Boolean).join(' ') || it.name || (it.user && it.user.name) || null;
    return { id, name: fullName };
  };

  // Fetch user names for items that don't include a name but have an id
  const fetchMissingUserNames = useCallback(
    async (itemsList: any[]) => {
      const ids = itemsList
        .map((it) => resolveUser(it).id)
        .filter(Boolean)
        .map(String)
        .filter((id) => !userNames[id]);
      const uniqueIds = Array.from(new Set(ids));
      if (uniqueIds.length === 0) return;
      try {
        const results = await Promise.all(uniqueIds.map((id) => http.get(`/users/${id}`)));
        const map: Record<string, string> = {};
        results.forEach((r, idx) => {
          const id = uniqueIds[idx];
          const data = r.data || {};
          const name = (data.nom || data.lastName || data.name) && (data.prenom || data.firstName)
            ? `${data.nom || data.lastName || ''} ${data.prenom || data.firstName || ''}`.trim()
            : data.name || `${data.nom || data.lastName || ''}`.trim();
          if (name) map[id] = name;
        });
        if (Object.keys(map).length) setUserNames((s) => ({ ...s, ...map }));
      } catch (err: any) {
        // don't block UI, but report error
        dispatch(setAlert({ msg: err?.response?.data?.message || 'Failed to fetch user names', type: AlertTypes.ERROR }));
      }
    },
    [dispatch, userNames],
  );

  // whenever items change, fetch missing names
  useEffect(() => {
    if (items.length) fetchMissingUserNames(items);
  }, [items, fetchMissingUserNames]);

  // humanize strings and map SUPPORT -> COMMENTAIRE
  const humanize = (s?: string) => {
    if (!s) return '';
    if (s === 'SUPPORT') return 'COMMENTAIRE';
    return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleReset = async (userId: number) => {
    try {
      const res = await http.post(`/users/${userId}/reset-password`);
      const pwd = res.data?.tempPassword;
      dispatch(setAlert({ msg: `Password reset: ${pwd}`, type: AlertTypes.SUCCESS }));
      // reload list
      load();
    } catch (err: any) {
      dispatch(setAlert({ msg: err?.response?.data?.message || err.message, type: AlertTypes.ERROR }));
    }
  };

  const openDetails = (item: any) => {
    setSelected(item);
    setOpenDetail(true);
  };

  const closeDetails = () => {
    setSelected(null);
    setOpenDetail(false);
  };

  if (loading) return <PageLoader />;

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6">COMMENTAIRE</Typography>
            <Typography variant="body2" color="text.secondary">
              View and manage commentaires submitted by users
            </Typography>
          </Box>
          <Box>
            <IconButton aria-label="refresh" onClick={load} size="large">
              <RefreshIcon />
            </IconButton>
          </Box>
        </Stack>
      </Paper>

      {items.filter((it) => ADMIN_TYPES.includes(it.type)).length === 0 ? (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">No commentaires</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            There are no commentaires at the moment. Click refresh to check again.
          </Typography>
          <Button sx={{ mt: 2 }} variant="contained" onClick={load} startIcon={<RefreshIcon />}>
            Refresh
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {items
            .filter((it) => ADMIN_TYPES.includes(it.type))
            .map((it) => (
              <Paper key={it.id} sx={{ p: 2 }} elevation={1}>
                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1">{it.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {humanize(it.type)} — {humanize(it.status)} — by {(() => {
                        const u = resolveUser(it);
                        const fromMap = u.id ? userNames[String(u.id)] : null;
                        return u.name || fromMap || u.id || 'Unknown';
                      })()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Target: Admin
                    </Typography>
                  </Box>

                  <Box sx={{ ml: 2, display: 'flex', gap: 1 }}>
                    {it.type === 'FORGET_PASSWORD' ? (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={async () => {
                          const u = resolveUser(it);
                          // if no id but we have a name from server map, try to find id by searching items
                          if (!u.id && Object.keys(userNames).length) {
                            // nothing reliable to do here — show message
                            dispatch(setAlert({ msg: 'No user id available for reset', type: AlertTypes.ERROR }));
                            return;
                          }
                          if (u.id) {
                            await handleReset(u.id);
                          } else {
                            dispatch(setAlert({ msg: 'No user id available for reset', type: AlertTypes.ERROR }));
                          }
                        }}
                        disabled={!resolveUser(it).id}
                      >
                        Reset Password
                      </Button>
                    ) : it.type === 'OTHER' ? (
                      <Button variant="outlined" size="small" onClick={() => openDetails(it)}>
                        Details
                      </Button>
                    ) : (
                      <Button variant="outlined" size="small" disabled>
                        Action
                      </Button>
                    )}
                  </Box>
                </Stack>
              </Paper>
            ))}
        </Stack>
      )}
      <Dialog open={openDetail} onClose={closeDetails} fullWidth maxWidth="sm">
        <DialogTitle>Comment Details</DialogTitle>
        <DialogContent>
          {selected ? (
            <Box>
              <Typography variant="subtitle1">{selected.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {selected.content || selected.description || 'No further details.'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Name: {selected.nom || ''} {selected.prenom || ''}
              </Typography>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetails}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminComments;
