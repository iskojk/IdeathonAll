
import React from "react";
import { Providers } from "@/store/providers";
import NextTopLoader from 'nextjs-toploader';
import MyApp from './app';
import "./global.css";


export const metadata = {
  title: 'Emlak Konut Ideathon SuperAdmin Paneli',
  description: 'Emlak Konut Ideathon SuperAdmin Paneli',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <NextTopLoader color="#5D87FF" />
        <Providers>
          <MyApp>{children}</MyApp>
        </Providers>
      </body>
    </html>
  );
}


