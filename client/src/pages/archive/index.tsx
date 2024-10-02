import React, { useState, SyntheticEvent } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import Order from './Order'; // Import the Order component
import Users from './Users'; // Import the Users component
import Services from './Services'; // Import the Services component

// Define a11yProps for accessibility
const a11yProps = (index: number) => ({
  id: `tab-${index}`,
  'aria-controls': `tabpanel-${index}`,
});

const Archive: React.FC = () => {
  const [value, setValue] = useState(0); // State to track active tab

  // Handle tab change
  const handleChange = (event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Tab Bar */}
      <Tabs value={value} onChange={handleChange} aria-label="component tabs">
        <Tab label="Order" {...a11yProps(0)} />
        <Tab label="Users" {...a11yProps(1)} />
        <Tab label="Services" {...a11yProps(2)} />
      </Tabs>

      {/* Tab Content */}
      <Box sx={{ padding: 3 }}>
        {value === 0 && (
          <Box>
            <Order />
          </Box>
        )}
        {value === 1 && (
          <Box>
            <Users />
          </Box>
        )}
        {value === 2 && (
          <Box>
            <Services />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Archive;
