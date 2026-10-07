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
    <Stack spacing={3} sx={{ mt: 4 }}>
      <Box>
        <CustomFormLabel 
          htmlFor="email"
          sx={{ 
            mb: 1.5, 
            fontSize: "0.95rem",
            fontWeight: 600,
            color: "#2c3e50"
          }}
        >
          E-Posta Adresi
        </CustomFormLabel>
        <CustomTextField 
          name="email"
          variant="outlined"
          fullWidth
          placeholder="ornek@firma.com"
          onChange={onChange}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              transition: "all 0.3s ease",
              '& fieldset': {
                borderColor: '#E0E0E0',
                borderWidth: 1.5,
              },
              '&:hover fieldset': {
                borderColor: '#005DAD',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#005DAD',
                borderWidth: 2,
              },
            },
            '& .MuiOutlinedInput-input': {
              padding: '14px 16px',
            }
          }}
        />
      </Box>
      
      <Box>
        <CustomFormLabel 
          htmlFor="password"
          sx={{ 
            mb: 1.5, 
            fontSize: "0.95rem",
            fontWeight: 600,
            color: "#2c3e50"
          }}
        >
          Şifre
        </CustomFormLabel>
        <CustomTextField
          name="password"
          type="password"
          variant="outlined"
          fullWidth
          placeholder="••••••••"
          onChange={onChange}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              transition: "all 0.3s ease",
              '& fieldset': {
                borderColor: '#E0E0E0',
                borderWidth: 1.5,
              },
              '&:hover fieldset': {
                borderColor: '#005DAD',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#005DAD',
                borderWidth: 2,
              },
            },
            '& .MuiOutlinedInput-input': {
              padding: '14px 16px',
            }
          }}
        />
      </Box>
      
      {/* Şifremi Unuttum Linki */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: -1 }}>
        <Typography
          component={Link}
          href="/auth/forgot-password"
          sx={{
            fontSize: "0.9rem",
            fontWeight: 500,
            color: "#005DAD",
            textDecoration: "none",
            transition: "all 0.2s ease",
            "&:hover": {
              textDecoration: "underline",
              color: "#004080",
            },
          }}
        >
          Şifremi Unuttum?
        </Typography>
      </Box>

      {/* Giriş Yap Butonu */}
      <Button
        variant="contained"
        size="large"
        fullWidth
        type="submit"
        disabled={loading}
        sx={{
          mt: 2,
          py: 1.75,
          fontSize: "1rem",
          fontWeight: 600,
          borderRadius: 2,
          bgcolor: "#005DAD",
          textTransform: "none",
          boxShadow: "0 4px 12px rgba(0, 93, 173, 0.25)",
          transition: "all 0.3s ease",
          "&:hover": {
            bgcolor: "#004080",
            boxShadow: "0 6px 16px rgba(0, 93, 173, 0.35)",
            transform: "translateY(-1px)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
          "&:disabled": {
            bgcolor: "#BDBDBD",
            boxShadow: "none",
          }
        }}
      >
        {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
      </Button>
    </Stack>
    </form>
    {subtitle}
  </>
);

export default AuthLogin;
