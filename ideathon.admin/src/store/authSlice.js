import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loginUser } from "@/utils/api/auth";

// Başlangıç durumu
const initialState = {
  user: null,
  isAuthenticated: false,
  token: null,
  loading: false,
  error: null,
  selectedIdeathonId: null, // 🆕 Seçili ideathon ID
};

// Kullanıcı giriş işlemi için Async Thunk
export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await loginUser(credentials);

      // API response format: { success, message, data: { user, token, ideathon? } }
      if (!response.success) {
        throw new Error(response.message || "Giriş başarısız!");
      }

      const { user, token, ideathon } = response.data;

      if (!user || !token) {
        throw new Error("API'den gelen kullanıcı veya token bilgisi eksik!");
      }

      // Sadece superadmin, admin, juri ve mentor giriş yapabilir
      const allowedRoles = ["superadmin", "admin", "juri", "mentor"];
      if (!allowedRoles.includes(user.role)) {
        throw new Error("Bu panele giriş yetkiniz bulunmamaktadır!");
      }

      // LocalStorage'a verileri kaydet
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      // Jüri/Mentor ise ideathon bilgisini kaydet
      if (ideathon && (user.role === "juri" || user.role === "mentor")) {
        localStorage.setItem("selectedIdeathonId", ideathon._id);
      }

      // Redux state'e döndürülecek veriler
      return { user, token, ideathon, message: response.message };
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
      state.isAuthenticated = false;
      state.token = null;
      state.selectedIdeathonId = null;

      // LocalStorage'dan bilgileri sil
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("selectedIdeathonId");
    },
    // LocalStorage'dan kullanıcıyı yükleme
    loadUserFromStorage(state) {
      try {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");
        const storedIdeathonId = localStorage.getItem("selectedIdeathonId");

        if (!storedUser || !storedToken) {
          // Eğer bilgiler eksikse state sıfırlanır
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
          state.selectedIdeathonId = null;
          return;
        }

        // LocalStorage'dan alınan veriler
        state.user = JSON.parse(storedUser);
        state.token = storedToken;
        state.isAuthenticated = true;
        state.selectedIdeathonId = storedIdeathonId && storedIdeathonId !== "null" && storedIdeathonId !== "all"
          ? storedIdeathonId
          : null;
      } catch (error) {
        // Eğer bir hata varsa state sıfırlanır
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.selectedIdeathonId = null;
      }
    },
    // 🆕 İdeathon seçimi sonrası token güncelle
    setIdeathonSelection(state, action) {
      const { ideathonId, token } = action.payload;
      state.selectedIdeathonId = ideathonId;
      if (token) {
        state.token = token;
        localStorage.setItem("token", token);
      }
      localStorage.setItem("selectedIdeathonId", ideathonId || "all");
    },
    // 🆕 Token güncelleme (selectIdeathon sonrası)
    updateToken(state, action) {
      state.token = action.payload;
      localStorage.setItem("token", action.payload);
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

        // Jüri/Mentor ise ideathon otomatik seçilir
        const { ideathon, user } = action.payload;
        if (ideathon && (user.role === "juri" || user.role === "mentor")) {
          state.selectedIdeathonId = ideathon._id;
        } else {
          state.selectedIdeathonId = null;
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; // Hata mesajı Redux state'e kaydedilir
      });
  },
});

// Actions ve reducer export
export const { logout, loadUserFromStorage, setIdeathonSelection, updateToken } = authSlice.actions;
export default authSlice.reducer;
