import React, { useState } from 'react';
import Link from 'next/link';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import Typography from '@mui/material/Typography';
import * as dropdownData from './data';

import { useDispatch, useSelector } from "react-redux"; // Redux'tan kullanıcı bilgilerini almak için
import { logout } from "@/store/authSlice";
import { useRouter } from "next/navigation";
import { toast } from 'react-toastify';
import { Stack } from '@mui/system';

const Profile = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [anchorEl2, setAnchorEl2] = useState(null);

  // Kullanıcı verisini Redux'tan alma
  const { user, mentorProfile } = useSelector((state) => state.auth);

  const handleClick2 = (event) => {
    setAnchorEl2(event.currentTarget);
  };

  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Başarıyla çıkış yapıldı!");
    router.push('/auth/login');
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "superadmin":
        return "Super Administrator";
      case "mentor":
        return "Mentor";
      case "juri":
        return "Jüri";
      case "company":
        return "Firma";
      default:
        return "Rol Yok";
    }
  };


  return (
    (<Box>
      <IconButton
        aria-label="show profile menu"
        color="inherit"
        aria-controls="msgs-menu"
        aria-haspopup="true"
        sx={{
          ...(typeof anchorEl2 === 'object' && {
            color: 'primary.main',
          }),
        }}
        onClick={handleClick2}
      >
        {/* Avatar */}

        <Avatar
          src={mentorProfile?.photoUrl}
          sx={{
            height: 40,
            width: 40,
            bgcolor: "primary.main",
            color: "white",
            fontWeight: "bold",
            fontSize: 16,
          }}
        >
          {user?.name ? user.name.split(' ').map(word => word[0]).join('').toUpperCase() : "?"}
        </Avatar>

      </IconButton>
      {/* ------------------------------------------- */}
      {/* Message Dropdown */}
      {/* ------------------------------------------- */}
      <Menu
        id="msgs-menu"
        anchorEl={anchorEl2}
        keepMounted
        open={Boolean(anchorEl2)}
        onClose={handleClose2}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        sx={{
          '& .MuiMenu-paper': {
            width: '360px',
            p: 4,
          },
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            pb: 2,
            alignItems: "center"
          }}>
          {/* Büyük Profil Görüntüsü */}

          <Avatar
            src={mentorProfile?.photoUrl}
            sx={{
              height: 64,
              width: 64,
              bgcolor: "primary.main",
              color: "white",
              fontWeight: "bold",
              fontSize: 24,
            }}
          >
            {user?.name ? user.name.split(' ').map(word => word[0]).join('').toUpperCase() : "?"}
          </Avatar>

          <Box>
            <Typography variant="subtitle2" color="textPrimary" sx={{
              fontWeight: 600
            }}>
              {user?.name}
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
              {getRoleLabel(user?.role)}
            </Typography>
            {mentorProfile?.title && (
              <Typography variant="caption" color="primary" sx={{ fontWeight: 500 }}>
                {mentorProfile.title}
              </Typography>
            )}
          </Box>
        </Stack>
        <Divider />
        <Box sx={{
          mt: 2
        }}>
          <Button variant="outlined" color="error" onClick={handleLogout} fullWidth>
            Çıkış Yap
          </Button>
        </Box>
      </Menu>
    </Box>)
  );
};

export default Profile;
