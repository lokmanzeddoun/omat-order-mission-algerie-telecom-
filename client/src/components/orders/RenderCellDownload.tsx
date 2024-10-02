import { Button } from '@mui/material';
import { GridCellParams, GridRowModel } from '@mui/x-data-grid';
import axios from 'axios';
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';
import { saveAs } from 'file-saver';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store/rootReducer';
import { AppDispatch } from 'store';
const API_URL = 'http://localhost:8000';

type ParamsProps = {
  params: GridCellParams;
};
const RenderCellDownload = ({ params }: ParamsProps) => {
  const { token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const handleDownloadRequest = async (row: GridRowModel) => {
    console.log(row);
    const res = await axios.get<Blob>(`${API_URL}/missions/${row.n_mission}/download`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      responseType: 'blob', // Ensure Axios treats the response as a Blob (file)
    });
    if (res && res.data) {
      const contentDisposition = res.headers['content-disposition'];
      const fileName = contentDisposition
        ? contentDisposition.split('filename=')[1]
        : 'downloaded_file'; // Extract the filename if provided in headers

      saveAs(res.data, fileName);

      dispatch(setAlert({ msg: 'Order Downloaded', type: AlertTypes.SUCCESS }));
    } else {
      dispatch(setAlert({ msg: 'Unexpected error: no file returned', type: AlertTypes.ERROR }));
    }
  };

  return (
    <Button variant="outlined" size="medium" onClick={() => handleDownloadRequest(params.row)}>
      Telecharger
    </Button>
  );
};

export default RenderCellDownload;
