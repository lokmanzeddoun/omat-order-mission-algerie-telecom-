import MissionModal from './CreateOrder';
import { IMission } from './orderReducer';
interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: IMission) => void;
  missionData?: IMission; // Pre-filled user data
  viewOnly: boolean;
}

const EditMissionModal: React.FC<EditUserModalProps> = ({
  open,
  onClose,
  onSubmit,
  missionData,
  viewOnly,
}) => {
  return (
    <MissionModal
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      isEdit={true} // Pass true to indicate edit mode
      initialData={missionData} // Pass pre-filled user data
      readOnly={viewOnly}
    />
  );
};

export default EditMissionModal;
