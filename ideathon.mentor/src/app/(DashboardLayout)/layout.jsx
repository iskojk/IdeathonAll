"use client";
import { AUTH_COOKIE_NAME } from "@/utils/authCookie";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { styled, useTheme } from "@mui/material/styles";
import React, { useState, useEffect } from "react";
import Header from "./layout/vertical/header/Header";
import Sidebar from "./layout/vertical/sidebar/Sidebar";
import Customizer from "./layout/shared/customizer/Customizer";
import { useSelector, useDispatch } from 'react-redux';
import { loadUserFromStorage } from "@/store/authSlice";
import CircularProgress from "@mui/material/CircularProgress";

const MainWrapper = styled("div")(() => ({
  display: "flex",
  minHeight: "100vh",
  width: "100%",
}));

const PageWrapper = styled("div")(() => ({
  display: "flex",
  flexGrow: 1,
  paddingBottom: "60px",
  flexDirection: "column",
  zIndex: 1,
  width: "100%",
  backgroundColor: "transparent",
}));

export default function RootLayout({ children }) {
  const customizer = useSelector((state) => state.customizer);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // LocalStorage'dan kullanıcı bilgilerini yükle
    dispatch(loadUserFromStorage());
    setLoading(false);
  }, [dispatch]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Cookie temizle ve hard redirect yap (router.push middleware ile çakışabiliyor)
      if (typeof document !== 'undefined') {
        document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`;
      }
      window.location.href = "/auth/login";
    }
  }, [loading, isAuthenticated]);

  if (loading || !isAuthenticated || !user) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <MainWrapper className={customizer.activeMode === 'dark' ? 'darkbg mainwrapper' : 'mainwrapper'}>
      {/* ------------------------------------------- */}
      {/* Sidebar */}
      {/* ------------------------------------------- */}

      <Sidebar />

      {/* ------------------------------------------- */}
      {/* Main Wrapper */}
      {/* ------------------------------------------- */}
      <PageWrapper
        className="page-wrapper"
        sx={{
          ...(customizer.isCollapse && {
            [theme.breakpoints.up("lg")]: {
              ml: `${customizer.MiniSidebarWidth}px`,
            },
          }),
        }}
      >
        {/* ------------------------------------------- */}
        {/* Header */}
        {/* ------------------------------------------- */}
        <Header />
        {/* PageContent */}
        <Container
          sx={{
            pt: '30px',
            maxWidth: customizer.isLayout === "boxed" ? "lg" : "100%!important",
          }}
        >
          {/* ------------------------------------------- */}
          {/* PageContent */}
          {/* ------------------------------------------- */}
          
          <Box sx={{ minHeight: "calc(100vh - 170px)" }}>
            {children}
          </Box>

          {/* ------------------------------------------- */}
          {/* End Page */}
          {/* ------------------------------------------- */}
        </Container>
      </PageWrapper>
    </MainWrapper>
  );
}
