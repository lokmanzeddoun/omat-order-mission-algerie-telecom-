// import Box from '@mui/material/Box';
import { Grid2 } from '@mui/material';
import TaskOverview from 'components/admin/order-overview';
import MonthlyMentors from 'components/admin/users-overview';
// import Footer from 'components/common/Footer';

const Dashboard = () => {
  return (
    <Grid2 container spacing={{ xs: 2.5, sm: 3 }} mb={3}>
      {/* ------------- Card section ---------------- */}
      <Grid2 size={{ xs: 12, xl: 4 }} zIndex={1}>
        <MonthlyMentors />
      </Grid2>
      <Grid2 size={{ xs: 12, xl: 6 }} zIndex={1}>
        Not Shown
      </Grid2>

      {/* ------------- Data-Grid section ---------------- */}
      <Grid2 size={{ xs: 12 }}>
        <TaskOverview />
      </Grid2>
    </Grid2>
  );
};

export default Dashboard;
