import UserModal from './User';
import { RowData } from '..';
interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RowData) => void;
}
const CreateUserModal: React.FC<CreateUserModalProps> = ({ open, onClose, onSubmit }) => {
  return <UserModal open={open} onClose={onClose} onSubmit={onSubmit} />;
};
export default CreateUserModal;
