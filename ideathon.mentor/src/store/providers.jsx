"use client";
import { persistor, store } from "./store";
import { Provider } from "react-redux";
import { PersistGate } from 'redux-persist/integration/react';
import { SocketProvider } from "@/app/context/SocketContext";

export function Providers({ children }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SocketProvider>
          {children}
        </SocketProvider>
      </PersistGate>
    </Provider>
  );
}
