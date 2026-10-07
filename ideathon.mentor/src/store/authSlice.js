import { AUTH_COOKIE_NAME } from "@/utils/authCookie";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { mentorLogin } from "@/utils/api/auth";

// Başlangıç durumu
const initialState = {
  user: null,
  mentorProfile: null,
  isAuthenticated: false,
  token: null,
  loading: false,
  error: null,
};

// Mentor giriş işlemi için Async Thunk
export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await mentorLogin(credentials);

      // API response format: { success, message, data: { user, mentorProfile, token } }
      if (!response.success) {
        throw new Error(response.message || "Giriş başarısız!");
      }

      const { user, mentorProfile, token } = response.data;

      if (!user || !token) {
        throw new Error("API'den gelen kullanıcı veya token bilgisi eksik!");
      }

      if (user.role !== "mentor") {
        throw new Error("Bu panele sadece Mentor kullanıcıları giriş yapabilir!");
      }

      if (!mentorProfile) {
        throw new Error("Mentor profili bulunamadı!");
      }

      // LocalStorage'a verileri kaydet
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("mentorProfile", JSON.stringify(mentorProfile));
      localStorage.setItem("token", token);

      // Cookie'ye de token'ı kaydet (middleware için)
      if (typeof document !== 'undefined') {
        // SameSite=Lax ve path=/ ile cookie set et
        document.cookie = `${AUTH_COOKIE_NAME}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`; // 7 gün
      }

      // Redux state'e döndürülecek veriler (success ve message ile birlikte)
      return { user, mentorProfile, token, message: response.message };
    } catch (error) {
      // Backend'den gelen hata mesajını kullan
      const errorMessage = error.response?.data?.message ||
        error.message ||
        "Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.";
      return rejectWithValue(errorMessage);
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
      state.mentorProfile = null;
      state.isAuthenticated = false;
      state.token = null;

      // LocalStorage'dan bilgileri sil
      localStorage.removeItem("user");
      localStorage.removeItem("mentorProfile");
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
        const storedMentorProfile = localStorage.getItem("mentorProfile");

        if (!storedUser || !storedToken) {
          state.user = null;
          state.mentorProfile = null;
          state.token = null;
          state.isAuthenticated = false;
          // Cookie kalmış olabilir, onu da temizle (middleware sonsuz döngüsü önlenir)
          if (typeof document !== 'undefined') {
            document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`;
          }
          return;
        }

        state.user = JSON.parse(storedUser);
        state.token = storedToken;
        state.mentorProfile = storedMentorProfile ? JSON.parse(storedMentorProfile) : null;
        state.isAuthenticated = true;
      } catch (error) {
        state.user = null;
        state.mentorProfile = null;
        state.token = null;
        state.isAuthenticated = false;
        if (typeof document !== 'undefined') {
          document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`;
        }
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
        state.mentorProfile = action.payload.mentorProfile;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; // Hata mesajı Redux state'e kaydedilir
      });
  },
});

// Actions ve reducer export
export const { logout, loadUserFromStorage } = authSlice.actions;
export default authSlice.reducer;
