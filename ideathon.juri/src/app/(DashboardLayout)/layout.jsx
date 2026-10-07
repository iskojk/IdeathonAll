"use client";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { styled, useTheme } from "@mui/material/styles";
import React, { useState, useEffect } from "react";
import Header from "./layout/vertical/header/Header";
import Sidebar from "./layout/vertical/sidebar/Sidebar";
import Customizer from "./layout/shared/customizer/Customizer";
import { useSelector, useDispatch } from 'react-redux';
import { loadUserFromStorage } from "@/store/authSlice";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // LocalStorage'dan kullanıcı bilgilerini yükle
    dispatch(loadUserFromStorage());
    setLoading(false);
  }, [dispatch]);

  useEffect(() => {
    // Kullanıcı yüklendikten sonra kontrol et
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [loading, isAuthenticated, router]);

  // Kullanıcı yüklenirken loading göster
  if (loading) {
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

  // Kullanıcı yoksa hiçbir şey gösterme (redirect olacak)
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <MainWrapper className={customizer.activeMode === 'dark' ? 'darkbg mainwrapper' : 'mainwrapper'}>
      {/* ------------------------------------------- */}
      {/* Sidebar */}
      {/* ------------------------------------------- */}

      {customizer.isHorizontal ? "" : <Sidebar />}

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
        {customizer.isHorizontal ? <HorizontalHeader /> : <Header />}
        {/* PageContent */}
        {customizer.isHorizontal ? <Navigation /> : ""}
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
