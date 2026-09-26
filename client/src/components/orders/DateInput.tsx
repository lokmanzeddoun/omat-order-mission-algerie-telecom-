import React from 'react';
import { GridFilterInputValueProps } from '@mui/x-data-grid';
import { Box, TextField } from '@mui/material';
import dayjs from 'helpers/date';

function DateInputValue(props: GridFilterInputValueProps) {
  const { item, applyValue, focusElementRef } = props;

  const [value, setValue] = React.useState<string | null>(
    item.value ? dayjs(item.value).format('YYYY-MM-DD') : null,
  );

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = event.target.value; // Get the value from the input
    setValue(newDate);

    // Apply value in ISO format
    applyValue({ ...item, value: newDate ? dayjs(newDate).toISOString() : null });
  };

  React.useImperativeHandle(focusElementRef, () => ({
    focus: () => {
      // Focus the input when necessary
      if (document.getElementById(`date-filter-${item.field}`)) {
        document.getElementById(`date-filter-${item.field}`).focus();
      }
    },
  }));

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: 48,
        pl: '20px',
      }}
    >
      <TextField
        id={`date-filter-${item.field}`} // Unique ID for focus handling
        label="Select Date"
        type="date" // HTML5 date input
        value={value || ''}
        onChange={handleDateChange}
        InputLabelProps={{
          shrink: true, // Keeps the label above the input
        }}
        inputProps={{
          min: '1900-01-01', // Set a reasonable min date
          max: dayjs().format('YYYY-MM-DD'), // Set max date to today
        }}
        sx={{ width: '200px' }} // Customize width as needed
      />
    </Box>
  );
}

export default DateInputValue;
