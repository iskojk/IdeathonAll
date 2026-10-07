'use client';
import React from 'react';
import { useSelector } from "react-redux"; // Redux'tan kullanıcı çekmek için
import { Box, Avatar, Typography, Card, CardContent, Grid, Stack, Divider } from '@mui/material';
import { IconCalendar, IconUser } from '@tabler/icons-react';
import Image from 'next/image';

// 📌 Kullanıcı rollerini Türkçeye çevirme fonksiyonu
const getRoleInTurkish = (role) => {
  const roles = {
    superadmin: "Super Administrator",
    juri: "Jüri",
    company: "Firma",
    admin: "Yönetici",
  };
  return roles[role] || "Bilinmiyor";
};

const WelcomeCard = () => {
  // Kullanıcı bilgilerini Redux store'dan al
  const { user } = useSelector((state) => state.auth);

  return (
    <Card elevation={0} sx={{ backgroundColor: (theme) => theme.palette.primary.light, py: 3, position: "relative" }}>
      <CardContent sx={{ py: 4, px: 2 }}>
        <Grid container sx={{ justifyContent: "space-between" }}>
          {/* Kullanıcı Bilgileri */}
          <Grid item sm={6} sx={{ display: "flex", alignItems: "center" }}>
            <Box>
              <Box
                sx={{
                  gap: "16px",
                  mb: 5,
                  display: { xs: 'block', sm: 'flex' },
                  alignItems: 'center'
                }}
              >
                {/* Profil Fotoğrafı */}
                <Avatar
                  sx={{
                    height: 100,
                    width: 100,
                    bgcolor: "secondary.main",
                    fontSize: 32,
                    fontWeight: "bold",
                  }}
                >
                  {user?.name ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase() : "?"}
                </Avatar>

                <Typography variant="h5">
                  Hoş geldin {user?.name}
                </Typography>
              </Box>

              {/* Rol ve Son Giriş Tarihi */}
              <Stack direction="row" divider={<Divider orientation="vertical" flexItem />} spacing={3} sx={{ mt: 3 }}>
                {/* Kullanıcı Rolü */}
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconUser size={20} color="#555" />
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    {getRoleInTurkish(user?.role)}
                  </Typography>
                </Stack>

              
              </Stack>
            </Box>
          </Grid>

          {/* Arka Plan Görseli */}
          <Grid item sm={6} sx={{ display: { xs: "none", sm: "block" } }}>
            <Box sx={{ mb: "-51px" }}>
              <Image src='/images/backgrounds/welcome-bg2.png' alt='img' width={340} height={204} style={{ width: "340px", height: "246px", position: "absolute", right: '-26px', bottom: '-70px', marginTop: '20px' }} />
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default WelcomeCard;
