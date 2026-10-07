"use client";
import React, { useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import RTL from "@/app/(DashboardLayout)/layout/shared/customizer/RTL";
import { ThemeSettings } from "@/utils/theme/Theme";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useSelector, useDispatch } from "react-redux";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { usePathname, useRouter } from "next/navigation";
import { loadUserFromStorage } from "@/store/authSlice";

const MyApp = ({ children }) => {
  const theme = ThemeSettings();
  const customizer = useSelector((state) => state.customizer);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadUserFromStorage());
  }, [dispatch]);

  useEffect(() => {
    const publicRoutes = [
      "/auth/login",
      "/auth/register",
      "/auth/forgot-password",
      "/auth/verify-otp",
      "/auth/reset-password",
    ];

    if (!isAuthenticated && !publicRoutes.includes(pathname)) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, pathname]);

  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={theme}>
        <RTL direction={customizer.activeDir}>
          <CssBaseline />
          <ToastContainer
            position="top-right"
            autoClose={2000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
          {children}
        </RTL>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
};

export default MyApp;
