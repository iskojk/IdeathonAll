import { AUTH_COOKIE_NAME } from "./utils/authCookie";
import { NextResponse } from "next/server";

export function middleware(req) {
  const tokenCookie = req.cookies.get(AUTH_COOKIE_NAME);
  const token = tokenCookie?.value; // Cookie değerini al

  // Login ve auth sayfalarına zaten token varsa dashboard'a yönlendir
  if (token && req.nextUrl.pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Korunması gereken sayfalar - auth hariç tüm sayfalar
  const isProtectedRoute = !req.nextUrl.pathname.startsWith("/auth");

  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL("/auth/login", req.url)); // Eğer token yoksa login sayfasına yönlendir
  }

  return NextResponse.next();
}

// **Middleware'in hangi sayfalarda çalışacağını belirle**
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images).*)"], // API ve statik dosyalar hariç tüm rotaları koru
};
