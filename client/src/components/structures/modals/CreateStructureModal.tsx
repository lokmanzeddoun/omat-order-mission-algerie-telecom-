import { RowData } from '..';
import StructureModal from './Structure';
interface CreateStructureModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RowData) => void;
}
const CreateStructureModal: React.FC<CreateStructureModalProps> = ({ open, onClose, onSubmit }) => {
  return <StructureModal open={open} onClose={onClose} onSubmit={onSubmit} />;
};
export default CreateStructureModal;
