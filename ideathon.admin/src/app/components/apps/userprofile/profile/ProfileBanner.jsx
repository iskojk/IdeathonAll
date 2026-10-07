'use client';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CardMedia from '@mui/material/CardMedia';
import Fab from '@mui/material/Fab';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import {
  IconBrandDribbble,
  IconBrandFacebook,
  IconBrandTwitter,
  IconBrandYoutube,
  IconFileDescription,
  IconUserCheck,
  IconUserCircle,
} from '@tabler/icons-react';
import ProfileTab from './ProfileTab';
import BlankCard from '../../../shared/BlankCard';
import React from 'react';

const ProfileBanner = () => {
  const ProfileImage = styled(Box)(() => ({
    backgroundImage: 'linear-gradient(#50b2fc,#f44c66)',
    borderRadius: '50%',
    width: '110px',
    height: '110px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: "0 auto"
  }));

  return (<>
    <BlankCard>
      <CardMedia component="img" image={'/images/backgrounds/profilebg.jpg'} alt={"profilecover"} width="100%" height="330px" />
      <Grid
        container
        spacing={0}
        sx={{
          justifyContent: "center",
          alignItems: "center"
        }}>
        {/* Post | Followers | Following */}
        <Grid
          sx={{
            order: {
              xs: '2',
              sm: '2',
              lg: '1',
            },
          }}
          size={{
            lg: 4,
            sm: 12,
            md: 5,
            xs: 12
          }}>
          <Stack
            direction="row"
            sx={{
              textAlign: "center",
              justifyContent: "center",
              gap: 6,
              m: 3
            }}>
            <Box>
              <Typography sx={{
                color: "text.secondary"
              }}>
                <IconFileDescription width="20" />
              </Typography>
              <Typography variant="h4" sx={{
                fontWeight: "600"
              }}>
                938
              </Typography>
              <Typography color="textSecondary" variant="h6" sx={{
                fontWeight: 400
              }}>
                Posts
              </Typography>
            </Box>
            <Box>
              <Typography sx={{
                color: "text.secondary"
              }}>
                <IconUserCircle width="20" />
              </Typography>
              <Typography variant="h4" sx={{
                fontWeight: "600"
              }}>
                3,586
              </Typography>
              <Typography color="textSecondary" variant="h6" sx={{
                fontWeight: 400
              }}>
                Followers
              </Typography>
            </Box>
            <Box>
              <Typography sx={{
                color: "text.secondary"
              }}>
                <IconUserCheck width="20" />
              </Typography>
              <Typography variant="h4" sx={{
                fontWeight: "600"
              }}>
                2,659
              </Typography>
              <Typography color="textSecondary" variant="h6" sx={{
                fontWeight: 400
              }}>
                Following
              </Typography>
            </Box>
          </Stack>
        </Grid>
        {/* about profile */}
        <Grid
          sx={{
            order: {
              xs: '1',
              sm: '1',
              lg: '2',
            },
          }}
          size={{
            lg: 4,
            sm: 12,
            xs: 12
          }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              textAlign: "center",
              justifyContent: "center",
              mt: '-85px'
            }}>
            <Box>
              <ProfileImage>
                <Avatar
                  src={"/images/profile/user-1.jpg"}
                  alt="profileImage"
                  sx={{
                    borderRadius: '50%',
                    width: '100px',
                    height: '100px',
                    border: '4px solid #fff',
                  }}
                />
              </ProfileImage>
              <Box sx={{
                mt: 1
              }}>
                <Typography variant="h5" sx={{
                  fontWeight: 600
                }}>
                  Mathew Anderson
                </Typography>
                <Typography
                  color="textSecondary"
                  variant="h6"
                  sx={{
                    fontWeight: 400
                  }}
                >
                  Designer
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
        {/* friends following buttons */}
        <Grid
          sx={{
            order: {
              xs: '3',
              sm: '3',
              lg: '3',
            },
          }}
          size={{
            lg: 4,
            sm: 12,
            xs: 12
          }}>
          <Stack
            direction={'row'}
            sx={{
              gap: 2,
              alignItems: "center",
              justifyContent: "center",
              my: 2
            }}>
            <Fab size="small" color="primary" sx={{ backgroundColor: '#1877F2' }}>
              <IconBrandFacebook size="16" />
            </Fab>
            <Fab size="small" color="primary" sx={{ backgroundColor: '#1DA1F2' }}>
              <IconBrandTwitter size="18" />
            </Fab>
            <Fab size="small" color="success" sx={{ backgroundColor: '#EA4C89' }}>
              <IconBrandDribbble size="18" />
            </Fab>
            <Fab size="small" color="error" sx={{ backgroundColor: '#CD201F' }}>
              <IconBrandYoutube size="18" />
            </Fab>
            <Button color="primary" variant="contained">
              Add To Story
            </Button>
          </Stack>
        </Grid>
      </Grid>
      {/**TabbingPart**/}
      <ProfileTab />
    </BlankCard>
  </>);
};

export default ProfileBanner;
