"use client";
import { persistor, store } from "./store";
import { Provider } from "react-redux";
import { PersistGate } from 'redux-persist/integration/react';
import { MentorProvider } from "@/app/context/MentorContext";
import { AdminJuriProvider } from "@/app/context/AdminJuriContext";
import ChatUsersProvider from "@/app/context/ChatUsersContext";
import { IdeathonProvider } from "@/app/context/IdeathonContext";

export function Providers({ children }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <IdeathonProvider>
          <MentorProvider>
            <AdminJuriProvider>
              <ChatUsersProvider>
                {children}
              </ChatUsersProvider>
            </AdminJuriProvider>
          </MentorProvider>
        </IdeathonProvider>
      </PersistGate>
    </Provider>
  );
}
