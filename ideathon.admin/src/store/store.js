import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import counterReducer from './counter/counterSlice';
import CustomizerReducer from './customizer/CustomizerSlice';
import authReducer from './authSlice'; 

// Redux Persist Konfigürasyonu
const persistConfig = {
  key: 'auth', // Sadece authReducer için geçerli olacak
  storage,
  whitelist: ['user', 'token', 'isAuthenticated'], // Persist edilecek alanlar
};

// Auth Reducer'ı persist ile sar
const persistedAuthReducer = persistReducer(persistConfig, authReducer);

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    customizer: persistReducer(
      { key: 'customizer', storage },
      CustomizerReducer
    ),
    auth: persistedAuthReducer, 
  },
  devTools: process.env.NODE_ENV !== 'production',
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
});

export const persistor = persistStore(store);
