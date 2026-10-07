import { useDispatch, useSelector } from "react-redux";
import { login, logout } from "@/store/authSlice";

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const handleLogin = async (credentials) => {
    try {
      const result = await dispatch(login(credentials)).unwrap();
      return { success: true, ...result };
    } catch (err) {
      return { success: false, message: err };
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return {
    user,
    isAuthenticated,
    loading,
    error,
    handleLogin,
    handleLogout,
  };
};
