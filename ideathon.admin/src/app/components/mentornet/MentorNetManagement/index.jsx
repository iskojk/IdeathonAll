"use client";

import React, { useState, useContext, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  Alert,
  useTheme,
  Chip,
} from "@mui/material";
import {
  IconPlus,
  IconX,
  IconUserPlus,
  IconFileDescription,
  IconPhoto,
  IconCheck,
  IconUsersGroup,
} from "@tabler/icons-react";
import { MentorNetContext } from "@/app/context/MentorNetContext";
import { IdeathonContext } from "@/app/context/IdeathonContext";
import { toast } from "react-toastify";
import MentorUserForm from "../MentorUserForm";
import MentorProfileForm from "../MentorProfileForm";
import MentorPhotoUpload from "../MentorPhotoUpload";
import MentorProfileList from "../MentorProfileList";

const steps = ["Kullanici Olustur", "Profil Bilgileri", "Fotograf Yukle"];

const MentorNetManagement = () => {
  const theme = useTheme();
  const {
    createMentorUser,
    createMentorProfile,
    uploadMentorPhoto,
    loading,
  } = useContext(MentorNetContext);

  const { ideathons, fetchDropdownIdeathons } = useContext(IdeathonContext);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [createdUser, setCreatedUser] = useState(null);
  const [createdProfile, setCreatedProfile] = useState(null);
  const [refreshList, setRefreshList] = useState(0);

  // Form state
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [profileFormData, setProfileFormData] = useState({
    ideathonId: "",
    title: "",
    about: "",
    linkedin: "",
    expertiseTags: [],
  });

  const [photoFile, setPhotoFile] = useState(null);

  // Ideathon dropdown listesini yukle
  useEffect(() => {
    fetchDropdownIdeathons();
  }, []);

  const handleOpenDialog = () => {
    setDialogOpen(true);
    setActiveStep(0);
    resetForm();
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setActiveStep(0);
    resetForm();
  };

  const resetForm = () => {
    setUserFormData({
      name: "",
      email: "",
      password: "",
    });
    setProfileFormData({
      ideathonId: "",
      title: "",
      about: "",
      linkedin: "",
      expertiseTags: [],
    });
    setPhotoFile(null);
    setCreatedUser(null);
    setCreatedProfile(null);
  };

  // Step 1: Kullanici Olusturma
  const handleUserFormSubmit = async (data) => {
    const result = await createMentorUser(data);
    
    if (result.success) {
      toast.success(result.message);
      setCreatedUser(result.data);
      setActiveStep(1);
      return true;
    } else {
      toast.error(result.message);
      return false;
    }
  };

  // Step 2: Profil Olusturma (ideathonId zorunlu)
  const handleProfileFormSubmit = async (data) => {
    if (!createdUser) {
      toast.error("Once kullanici olusturulmali");
      return false;
    }

    if (!data.ideathonId) {
      toast.error("Ideathon secimi zorunludur");
      return false;
    }

    const profileData = {
      userId: createdUser._id,
      ...data,
    };

    const result = await createMentorProfile(profileData);
    
    if (result.success) {
      toast.success(result.message);
      setCreatedProfile(result.data);
      setActiveStep(2);
      return true;
    } else {
      toast.error(result.message);
      return false;
    }
  };

  // Step 3: Fotograf Yukleme
  const handlePhotoUpload = async (file) => {
    if (!createdUser) {
      toast.error("Once kullanici olusturulmali");
      return false;
    }

    if (!file) {
      toast.error("Lutfen bir fotograf secin");
      return false;
    }

    const result = await uploadMentorPhoto(createdUser._id, file);
    
    if (result.success) {
      toast.success(result.message);
      setRefreshList(prev => prev + 1);
      handleCloseDialog();
      return true;
    } else {
      toast.error(result.message);
      return false;
    }
  };

  const handleSkipPhoto = () => {
    toast.info("Mentor basariyla olusturuldu (fotograf atlandi)");
    setRefreshList(prev => prev + 1);
    handleCloseDialog();
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <MentorUserForm
            formData={userFormData}
            setFormData={setUserFormData}
            onSubmit={handleUserFormSubmit}
            onBack={null}
            loading={loading}
          />
        );
      case 1:
        return (
          <MentorProfileForm
            formData={profileFormData}
            setFormData={setProfileFormData}
            onSubmit={handleProfileFormSubmit}
            onBack={handleBack}
            loading={loading}
            ideathons={ideathons}
          />
        );
      case 2:
        return (
          <MentorPhotoUpload
            photoFile={photoFile}
            setPhotoFile={setPhotoFile}
            onSubmit={handlePhotoUpload}
            onSkip={handleSkipPhoto}
            onBack={handleBack}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Ust Baslik & Eylem */}
      <Stack
        direction="row"
        spacing={2}
        sx={{ mb: 3 }}
        justifyContent="end"
        alignItems="end"
      >
        <Button
          variant="contained"
          startIcon={<IconPlus size={20} />}
          onClick={handleOpenDialog}
          size="large"
          sx={{ 
            minWidth: 200,
            textTransform: "none",
            boxShadow: "none",
            bgcolor: theme.palette.primary.main,
            "&:hover": {
              boxShadow: "none",
              bgcolor: theme.palette.primary.dark,
            }
          }}
        >
          Yeni Mentor Ekle
        </Button>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* Mentor Listesi */}
      <MentorProfileList refreshTrigger={refreshList} ideathons={ideathons} />

      {/* Yeni Mentor Ekleme Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            minHeight: '70vh',
          }
        }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack spacing={0.5}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Yeni Mentor Ekle
              </Typography>
              <Typography variant="body2" color="text.secondary">
                3 adimda mentor olusturun
              </Typography>
            </Stack>
            <IconButton onClick={handleCloseDialog} size="small">
              <IconX size={20} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 3, pb: 3 }}>
          {/* Stepper */}
          <Box sx={{ mb: 4 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label, index) => (
                <Step key={label} completed={activeStep > index}>
                  <StepLabel
                    StepIconProps={{
                      sx: {
                        '&.Mui-completed': {
                          color: theme.palette.success.main,
                        },
                        '&.Mui-active': {
                          color: theme.palette.primary.main,
                        },
                      }
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Progress Info */}
          {createdUser && (
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Kullanici basariyla olusturuldu: <strong>{createdUser.name}</strong>
              </Typography>
            </Alert>
          )}

          {createdProfile && (
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Mentor profili basariyla olusturuldu
                {createdProfile.assignedUsersCount > 0 && (
                  <> — <strong>{createdProfile.assignedUsersCount}</strong> kullanici otomatik atandi</>
                )}
              </Typography>
            </Alert>
          )}

          {/* Step Content */}
          <Box>
            {renderStepContent()}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default MentorNetManagement;
