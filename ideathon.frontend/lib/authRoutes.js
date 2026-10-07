// Only allow local paths as post-login destinations.
export function safeRedirect(value, fallback = '/') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\s]/.test(value)) {
    return fallback;
  }
  return value;
}

export function isEntrepreneurPath(path = '') {
  return path === '/girisimciler' || path.startsWith('/girisimciler/');
}

export function isAuthPage(path) {
  return ['/login', '/register', '/forgot-password', '/reset-password', '/girisimciler/login', '/girisimciler/register'].includes(path);
}

// Her iki alan aynı auth servislerini kullanır; ekranlar arasında sadece dönüş bağlamı taşınır.
export function authFlowLinks({ entrepreneur = false, redirect } = {}) {
  const destination = safeRedirect(redirect, '');
  const loginQuery = new URLSearchParams();
  if (destination) loginQuery.set('redirect', destination);
  const recoveryQuery = new URLSearchParams(loginQuery);
  if (entrepreneur) recoveryQuery.set('source', 'girisimciler');
  const withQuery = (path, query) => query.size ? `${path}?${query}` : path;

  return {
    login: withQuery(entrepreneur ? '/girisimciler/login' : '/login', loginQuery),
    register: withQuery(entrepreneur ? '/girisimciler/register' : '/register', loginQuery),
    forgotPassword: withQuery('/forgot-password', recoveryQuery),
    resetPassword: email => {
      const query = new URLSearchParams(recoveryQuery);
      query.set('email', email);
      return withQuery('/reset-password', query);
    },
  };
}

export function loginUrl(path) {
  const destination = safeRedirect(path);
  const loginPath = isEntrepreneurPath(destination) ? '/girisimciler/login' : '/login';
  return `${loginPath}?redirect=${encodeURIComponent(destination)}`;
}
