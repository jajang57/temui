import React from 'react';
import { Box } from '@mui/material';

/**
 * ReportLayout component provides a clean container for financial reports.
 * It allows natural page scrolling while maintaining consistent padding and background.
 */
const ReportLayout = ({ children }) => {
    return (
        <Box sx={{
            width: '100%',
            minHeight: '100%',
            backgroundColor: '#ffffff', // Changed to white for formal report feel
        }}>
            {children}
        </Box>
    );
};

ReportLayout.Header = ({ children }) => (
    <Box className="no-print" sx={{ mb: 2 }}>
        {children}
    </Box>
);

ReportLayout.Content = ({ children }) => (
    <Box sx={{
        width: '100%',
        position: 'relative',
    }}>
        {children}
    </Box>
);

export default ReportLayout;
