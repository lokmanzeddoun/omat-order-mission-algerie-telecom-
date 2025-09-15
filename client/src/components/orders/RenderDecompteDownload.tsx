import { Button } from '@mui/material';
import { GridCellParams, GridRowModel } from '@mui/x-data-grid';
import http from 'helpers/http';
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';
import { saveAs } from 'file-saver';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store/rootReducer';
import { AppDispatch } from 'store';

type ParamsProps = {
  params: GridCellParams;
};

const RenderDecompteDownload = ({ params }: ParamsProps) => {
  const { token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  const handleDownloadRequest = async (row: GridRowModel) => {
    const n_decompte = (row as any)?.n_decompte;
    const missionId = (row as any)?.mission?.n_mission;
    try {
      // Prefer decompte id; fallback to mission id if that's how backend expects it
      const url = n_decompte != null ? `/decompte/${n_decompte}/download` : `/decompte/${missionId}/download`;
      const res = await http.get<Blob>(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      });
      if (res && res.data) {
        const contentDisposition = (res.headers as any)['content-disposition'];
        const fileName = contentDisposition
          ? decodeURIComponent((contentDisposition.split('filename=')[1] || '').replace(/"/g, ''))
          : `decompte-${n_decompte ?? missionId}.pdf`;
        saveAs(res.data, fileName || `decompte-${n_decompte ?? missionId}.pdf`);
        dispatch(setAlert({ msg: 'Décompte téléchargé', type: AlertTypes.SUCCESS }));
      } else {
        dispatch(setAlert({ msg: "Erreur inattendue: aucun fichier retourné", type: AlertTypes.ERROR }));
      }
    } catch (e: any) {
      dispatch(setAlert({ msg: e?.response?.data?.message ?? 'Échec du téléchargement du décompte', type: AlertTypes.ERROR }));
    }
  };

  return (
    <Button variant="outlined" size="small" onClick={() => handleDownloadRequest((params as any)?.row)}>
      Télécharger
    </Button>
  );
};

export default RenderDecompteDownload;
