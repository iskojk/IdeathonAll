import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useSelector, useDispatch } from 'react-redux';
import { IconPower } from '@tabler/icons-react';
import Link from 'next/link';
import { logout } from '@/store/authSlice';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

export const Profile = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  // Redux'tan kullanıcı verisini al
  const { user, mentorProfile } = useSelector((state) => state.auth);

  // Sidebar için özelleştirme durumu
  const customizer = useSelector((state) => state.customizer);
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up('lg'));
  const hideMenu = lgUp ? customizer.isCollapse && !customizer.isSidebarHover : '';

  const getRoleLabel = (role) => {
    switch (role) {
      case "mentor":
        return "Mentor";
      case "juri":
        return "Jüri";
      case "superadmin":
        return "Super Admin";
      case "admin":
        return "Admin";
      default:
        return "Kullanıcı";
    }
  };

  // Çıkış yapma işlemi
  const handleLogout = () => {
    dispatch(logout());
    toast.success("Başarıyla çıkış yapıldı!");
    router.push('/auth/login');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: "center",
        gap: 2,
        m: 3,
        p: 2,
        bgcolor: `${'secondary.light'}`
      }}
    >
      {!hideMenu ? (
        <>
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


          {/* Kullanıcı Bilgileri */}
          <Box>
            <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
              {user?.name ? (user.name.length > 12 ? user.name.slice(0, 12) + '...' : user.name) : 'Kullanıcı'}
            </Typography>

            
        
          </Box>

          {/* Çıkış Butonu */}
          <Box sx={{ ml: 'auto' }}>
            <Tooltip title="Logout" placement="top">
              <IconButton
                color="primary"
                onClick={handleLogout}
                aria-label="logout"
                size="small"
              >
                <IconPower size="20" />
              </IconButton>
            </Tooltip>
          </Box>
        </>
      ) : (
        ''
      )}
    </Box>
  );
};
