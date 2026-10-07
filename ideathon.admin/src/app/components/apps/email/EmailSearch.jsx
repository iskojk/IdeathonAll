import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { SearchEmail } from '@/store/apps/email/EmailSlice';
import { IconMenu2, IconSearch } from '@tabler/icons-react';

const EmailSearch = ({ onClick }) => {
  const searchTerm = useSelector((state) => state.emailReducer.emailSearch);
  const dispatch = useDispatch();

  return (
    (<Box
        sx={{
          display: "flex",
          p: 2
        }}>
      {/* ------------------------------------------- */}
      {/* Button toggle sidebar when lgdown */}
      {/* ------------------------------------------- */}
      <Fab
        onClick={onClick}
        color="primary"
        size="small"
        sx={{ mr: 1, flexShrink: '0', display: { xs: 'block', lineHeight: '10px', lg: 'none' } }}
      >
        <IconMenu2 width="16" />
      </Fab>
      {/* ------------------------------------------- */}
      {/* Search */}
      {/* ------------------------------------------- */}
      <TextField
        id="outlined-basic"
        fullWidth
        size="small"
        value={searchTerm}
        placeholder="Search emails"
        variant="outlined"
        onChange={(e) => dispatch(SearchEmail(e.target.value))}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconSearch size={'16'} />
              </InputAdornment>
            ),
          }
        }}
      />
    </Box>)
  );
};

export default EmailSearch;
