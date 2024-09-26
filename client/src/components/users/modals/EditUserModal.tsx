import UserModal from './User';
import { RowData } from '..';
interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RowData) => void;
  userData?: RowData; // Pre-filled user data
}

const EditUserModal: React.FC<EditUserModalProps> = ({ open, onClose, onSubmit, userData }) => {
  return (
    <UserModal
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      isEdit={true} // Pass true to indicate edit mode
      initialData={userData} // Pass pre-filled user data
    />
  );
};

export default EditUserModal;
