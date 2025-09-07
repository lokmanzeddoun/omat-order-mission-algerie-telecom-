import UserModal from './Structure';
import { RowData } from '..';
interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RowData) => void;
  userData?: RowData; // Pre-filled user data
  viewOnly?: boolean;
}

const EditStructureModal: React.FC<EditUserModalProps> = ({ open, onClose, onSubmit, userData, viewOnly }) => {
  return (
    <UserModal
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      isEdit={!viewOnly}
      initialData={userData} // Pass pre-filled user data
      viewOnly={viewOnly}
    />
  );
};

export default EditStructureModal;
