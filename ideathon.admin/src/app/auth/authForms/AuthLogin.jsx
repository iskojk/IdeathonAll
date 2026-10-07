import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import CustomCheckbox from '@/app/components/forms/theme-elements/CustomCheckbox';
import CustomTextField from '@/app/components/forms/theme-elements/CustomTextField';
import CustomFormLabel from '@/app/components/forms/theme-elements/CustomFormLabel';

const AuthLogin = ({ title, subtext, subtitle, loading, error, onChange, onSubmit }) => (
  <>
    {title ? (
      <Typography
        variant="h3"
        sx={{
          fontWeight: "700",
          mb: 1
        }}>
        {title}
      </Typography>
    ) : null}

    {subtext}



    <form onSubmit={onSubmit}>
    <Stack>
      <Box>
        <CustomFormLabel htmlFor="email">E-Posta Adresi</CustomFormLabel>
        <CustomTextField 
          name="email"
          variant="outlined"
          fullWidth
          onChange={onChange} />
      </Box>
      <Box sx={{ mb: 5 }}>
        <CustomFormLabel htmlFor="password">Şifre</CustomFormLabel>
        <CustomTextField
          name="password"
          type="password"
          variant="outlined"
          fullWidth
          onChange={onChange} />
      </Box>
    </Stack>
    <Box>
        <Button
          color="primary"
          variant="contained"
          size="large"
          fullWidth
          type="submit"
          disabled={loading}
        >
          {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
        </Button>
    </Box>
    </form>
    {subtitle}
  </>
);

export default AuthLogin;
