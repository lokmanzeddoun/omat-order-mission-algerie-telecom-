import UserWrapper from 'components/common/UserWrapper';
import { mentors } from 'data/mentors';
const MonthlyMentors = () => {
  return <UserWrapper title="Utilisateur Recent" data={mentors} />;
};

export default MonthlyMentors;
