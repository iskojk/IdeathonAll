import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Logo from '@/app/(DashboardLayout)/layout/shared/logo/Logo';
import PageContainer from '@/app/components/container/PageContainer';
import AuthForgotPassword from '../authForms/AuthForgotPassword';
import Image from 'next/image';

export default function ForgotPassword() {
  return (
    (<PageContainer title="Şifremi Yenile" description="Şifre yenileme">
      <Grid
        container
        spacing={0}
        sx={{
          justifyContent: "center",
          overflowX: 'hidden'
        }}>
        <Grid
          sx={{
            position: 'relative',
            '&:before': {
              content: '""',
              background: 'radial-gradient(#d2f1df, #d3d7fa, #bad8f4)',
              backgroundSize: '400% 400%',
              animation: 'gradient 15s ease infinite',
              position: 'absolute',
              height: '100%',
              width: '100%',
              opacity: '0.3',
            },
          }}
          size={{
            xs: 12,
            sm: 12,
            lg: 8,
            xl: 9
          }}>
          <Box sx={{
            position: "relative"
          }}>
            <Box sx={{
              px: 3
            }}>
              <Logo />
            </Box>
            <Box
              sx={{
                alignItems: "center",
                justifyContent: "center",
                height: 'calc(100vh - 75px)',

                display: {
                  xs: 'none',
                  lg: 'flex',
                }
              }}>
              <Image
                src={"/images/backgrounds/login-bg.svg"}
                alt="bg" width={500} height={500}
                style={{
                  width: '100%',
                  maxWidth: '500px', maxHeight: '500px',
                }}
              />
            </Box>
          </Box>
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 12,
            lg: 4,
            xl: 3
          }}
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}>
          <Box sx={{
            p: { xs: 3, sm: 4, md: 5 },
            maxWidth: 480,
            mt: 2,
            width: "100%"
          }}>
            <Typography 
              variant="h3" 
              sx={{
                fontWeight: "700",
                color: "#005DAD",
                mb: 2,
                mt: 2,
                fontSize: { xs: "1.75rem", sm: "2rem", md: "2.25rem" },
                letterSpacing: "-0.02em"
              }}
            >
              Şifreni mi unuttun?
            </Typography>

            <Typography
              variant="body1"
              sx={{
                fontWeight: "400",
                color: "#666",
                lineHeight: 1.7,
                fontSize: { xs: "0.9rem", sm: "0.95rem" },
                mb: 1
              }}
            >
              Hesabınızla ilişkili e-posta adresini girin. Size şifrenizi sıfırlamanız için 6 haneli bir doğrulama kodu göndereceğiz.
            </Typography>
            <AuthForgotPassword />
          </Box>
        </Grid>
      </Grid>
    </PageContainer>)
  );
};


