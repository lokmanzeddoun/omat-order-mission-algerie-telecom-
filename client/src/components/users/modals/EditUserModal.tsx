import UserModal from './User';
import { RowData } from '..';
interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RowData) => void;
  userData?: RowData; // Pre-filled user data
  viewOnly?: boolean;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ open, onClose, onSubmit, userData, viewOnly }) => {
  return (
    <UserModal
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      isEdit={!viewOnly} // if viewOnly, don't present edit mode
      initialData={userData} // Pass pre-filled user data
      viewOnly={viewOnly}
    />
  );
};

export default EditUserModal;
