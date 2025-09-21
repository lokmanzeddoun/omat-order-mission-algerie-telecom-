import { useEffect, useState } from 'react';
import { Card, CardContent, Container, Tab, Tabs, Typography } from '@mui/material';
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

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>
        Archive
      </Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab value="missions" label={`Missions (${missions.length})`} />
        <Tab value="decomptes" label={`Decomptes (${decomptes.length})`} />
      </Tabs>
      {tab === 'missions' ? (
        <Card>
          <CardContent>
            {missions.length === 0 ? (
              <Typography color="text.secondary">Aucune mission archivée</Typography>
            ) : (
              missions.map((m) => (
                <Typography key={m.n_mission} sx={{ mb: 1.5 }}>
                  #{m.n_mission} — {m.destination ?? ''} — {new Date(m.updatedAt).toLocaleString()}
                </Typography>
              ))
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            {decomptes.length === 0 ? (
              <Typography color="text.secondary">Aucun décompte archivé</Typography>
            ) : (
              decomptes.map((d) => (
                <Typography key={d.n_decompte} sx={{ mb: 1.5 }}>
                  #{d.n_decompte} — Mission {d.mission?.n_mission ?? '-'} — {d.montant} DA —
                  {new Date(d.updatedAt).toLocaleString()}
                </Typography>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default ArchivePage;
