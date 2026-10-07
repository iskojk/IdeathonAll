import * as React from 'react';
import { Snackbar, Alert, AlertTitle } from '@mui/material';

const Welcome = () => {
  const [open, setOpen] = React.useState(false);

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = (reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };
  React.useEffect(() => {
    const timer = setTimeout(() => {
      handleClick();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <React.Fragment>
      <Snackbar
        open={open}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        autoHideDuration={6000}
        onClose={handleClose}
      >
        <Alert
          onClose={handleClose}
          severity="info"
          variant="filled"
          sx={{ width: '100%', color: 'white' }}
        >
          <AlertTitle>Yönetim Paneline Hoşgeldiniz</AlertTitle>
          Tüm işlemlerinizi bu panel üzerinden gerçekleştirebilirsiniz.
        </Alert>
      </Snackbar>
    </React.Fragment>
  );
};

export default Welcome;
