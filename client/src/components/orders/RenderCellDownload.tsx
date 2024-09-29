import { Button } from '@mui/material';
import { GridCellParams, GridValidRowModel } from '@mui/x-data-grid';

type ParamsProps = {
  params: GridCellParams;
};
const RenderCellDownload = ({ params }: ParamsProps) => {
  const handleDownloadRequest = (row: GridValidRowModel) => {
    console.log(row);
  };

  return (
    <Button variant="outlined" size="medium" onClick={() => handleDownloadRequest(params.row)}>
      Telecharger
    </Button>
  );
};

export default RenderCellDownload;
