// Local panels share a hostname, so allow a separate cookie name per panel.
export const AUTH_COOKIE_NAME = process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME || "token";
