import React from 'react';
import { useSelector } from 'react-redux';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { IconStar, IconTrash } from '@tabler/icons-react';

const ContactListItem = ({
  onContactClick,
  onStarredClick,
  onDeleteClick,
  id,
  firstname,
  lastname,
  image,
  department,
  starred,
  active,
}) => {
  const customizer = useSelector((state) => state.customizer);
  const br = `${customizer.borderRadius}px`;

  const theme = useTheme();

  const warningColor = theme.palette.warning.main;

  return (
    (<ListItemButton sx={{ mb: 1 }} selected={active}>
      <ListItemAvatar>
        <Avatar alt={image} src={image} />
      </ListItemAvatar>
      <ListItemText>
        <Stack
          direction="row"
          sx={{
            gap: "10px",
            alignItems: "center"
          }}>
          <Box onClick={onContactClick} sx={{
            mr: "auto"
          }}>
            <Typography
              variant="subtitle1"
              noWrap
              sx={{
                fontWeight: 600,
                maxWidth: '150px'
              }}>
              {firstname} {lastname}
            </Typography>
            <Typography variant="body2" noWrap sx={{
              color: "text.secondary"
            }}>
              {department}
            </Typography>
          </Box>
          <IconStar
            onClick={onStarredClick}
            size="16"
            stroke={1.5}
            style={{ fill: starred ? warningColor : '', stroke: starred ? warningColor : '' }}
          />
          <IconTrash onClick={onDeleteClick} size="16" stroke={1.5} />
        </Stack>
      </ListItemText>
    </ListItemButton>)
  );
};


export default ContactListItem;
