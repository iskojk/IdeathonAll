import { AUTH_COOKIE_NAME } from "@/utils/authCookie";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loginUser, verifySession } from "@/utils/api/auth";

// Başlangıç durumu
const initialState = {
  user: null,
  isAuthenticated: false,
  token: null,
  loading: false,
  error: null,
};

// Kullanıcı giriş işlemi için Async Thunk
export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await loginUser(credentials);

      // API response format: { success, message, data: { user, token } }
      if (!response.success) {
        throw new Error(response.message || "Giriş başarısız!");
      }

      const { user, token } = response.data;

      if (!user || !token) {
        throw new Error("API'den gelen kullanıcı veya token bilgisi eksik!");
      }

      if (user.role !== "juri") {
        throw new Error("Bu panele sadece Juri kullanıcıları giriş yapabilir!");
      }

      // LocalStorage'a verileri kaydet
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      // Cookie'ye de token'ı kaydet (middleware için)
      if (typeof document !== 'undefined') {
        // SameSite=Lax ve path=/ ile cookie set et
        document.cookie = `${AUTH_COOKIE_NAME}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`; // 7 gün
      }

      // Redux state'e döndürülecek veriler (success ve message ile birlikte)
      return { user, token, message: response.message };
    } catch (error) {
      // Backend'den gelen hata mesajını kullan
      const errorMessage = error.response?.data?.message ||
        error.message ||
        "Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.";
      return rejectWithValue(errorMessage);
    }
  }
);

export const verifyToken = createAsyncThunk(
  "auth/verifyToken",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return rejectWithValue("no_token");

      const response = await verifySession();
      if (!response.success) return rejectWithValue("invalid");

      const user = response.data;
      if (!user.isActive) return rejectWithValue("inactive");

      localStorage.setItem("user", JSON.stringify(user));
      return { user, token };
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (typeof document !== "undefined") {
        document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`;
      }
      return rejectWithValue("invalid");
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Çıkış yapma işlemi
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.token = null;

      // LocalStorage'dan bilgileri sil
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      // Cookie'yi de sil
      if (typeof document !== 'undefined') {
        document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`;
      }
    },
    // LocalStorage'dan kullanıcıyı yükleme
    loadUserFromStorage(state) {
      try {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");

        if (!storedUser || !storedToken) {
          // Eğer bilgiler eksikse state sıfırlanır
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
          return;
        }

        // LocalStorage'dan alınan veriler
        state.user = JSON.parse(storedUser);
        state.token = storedToken;
        state.isAuthenticated = true;
      } catch (error) {
        // Eğer bir hata varsa state sıfırlanır
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null; // Hata mesajı temizlenir
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(verifyToken.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
      });
  },
});

// Actions ve reducer export
export const { logout, loadUserFromStorage } = authSlice.actions;
export default authSlice.reducer;
