import { Button } from '@mui/material';
import { GridCellParams, GridRowModel } from '@mui/x-data-grid';
import http from 'helpers/http';
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';
import { saveAs } from 'file-saver';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store/rootReducer';
import { AppDispatch } from 'store';
// use shared http client

type ParamsProps = {
  params?: GridCellParams | any;
};
const RenderCellDownload = ({ params }: ParamsProps) => {
  const { token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const handleDownloadRequest = async (row: GridRowModel) => {
    try {
      if (!row || !row.n_mission) {
        dispatch(setAlert({ msg: 'Ligne invalide pour le téléchargement', type: AlertTypes.ERROR }));
        return;
      }
      const res = await http.get<Blob>(`/missions/${row.n_mission}/download`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      });
      if (res && res.data) {
        const contentDisposition = res.headers['content-disposition'];
        const fileName = contentDisposition
          ? contentDisposition.split('filename=')[1]
          : 'ordre-mission.pdf';

        saveAs(res.data, fileName);
        dispatch(setAlert({ msg: 'Ordre téléchargé', type: AlertTypes.SUCCESS }));
      } else {
        dispatch(setAlert({ msg: 'Unexpected error: no file returned', type: AlertTypes.ERROR }));
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors du téléchargement';
      dispatch(setAlert({ msg, type: AlertTypes.ERROR }));
    }
  };

  if (!params || !params.row) {
    return (
      <Button variant="outlined" size="medium" disabled>
        Télécharger
      </Button>
    );
  }

  return (
    <Button variant="outlined" size="medium" onClick={() => handleDownloadRequest(params.row)}>
      Télécharger
    </Button>
  );
};

export default RenderCellDownload;
