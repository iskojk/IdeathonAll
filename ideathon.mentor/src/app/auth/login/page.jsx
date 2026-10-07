"use client";
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import PageContainer from '@/app/components/container/PageContainer';
import Logo from '@/app/(DashboardLayout)/layout/shared/logo/Logo';
import AuthLogin from '../authForms/AuthLogin';
import Image from 'next/image';

const Login = () => {
  const { handleLogin, loading, error } = useAuth();
  const router = useRouter();
  const [credentials, setCredentials] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await handleLogin(credentials);

    if (result.success) {
      toast.success(result.message || "Başarıyla Giriş Yapıldı! Yönlendiriliyorsunuz...");
      
      // Cookie'nin set edilmesi için bekle ve yönlendir
      setTimeout(() => {
        // router.push yerine window.location.href kullan (tam sayfa yenilemesi için)
        window.location.href = "/";
      }, 1000);
    } else {
      toast.error(result.message || "Giriş başarısız. Lütfen tekrar deneyin.");
    }
  };

  return (
    (<PageContainer title="Emlak Konut Mentor Paneli | Giriş" description="Emlak Konut GYO Mentor Paneli">
      <Grid
        container
        spacing={0}
        sx={{
          justifyContent: "center",
          height: '100vh'
        }}>
        <Grid
          sx={{
            position: 'relative',
            '&:before': {
              content: '""',
              background: 'linear-gradient(135deg, #E6F2FF 0%, #F5F9FF 100%)',
              position: 'absolute',
              height: '100%',
              width: '100%',
              opacity: '1',
            },
          }}
          size={{
            xs: 12,
            sm: 12,
            lg: 7,
            xl: 8
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
                  maxWidth: '500px',
                  maxHeight: '500px',
                }}
              />
            </Box>
          </Box>
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 12,
            lg: 5,
            xl: 4
          }}
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}>
          <Box sx={{
            p: 2
          }}>
            <AuthLogin
              title="Emlak Konut Mentor Paneli"
              subtext={
                <Typography variant="subtitle1" color="textSecondary" sx={{
                  mb: 1
                }}>
                 Mentor hesabınızla giriş yapın
                </Typography>
              }
              loading={loading}
              error={error}
              onChange={handleChange}
              onSubmit={handleSubmit}
            />
          </Box>
        </Grid>
      </Grid>
    </PageContainer>)
  );
};

export default Login;
