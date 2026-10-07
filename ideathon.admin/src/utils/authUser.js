// utils/authUser.js
export function getAuthUser() {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    return {
      userId: payload.userId || payload.id || payload._id,
      role: payload.role,
      company_id: payload.company_id || null,
      email: payload.email,
      name: payload.name,
      ideathonId: payload.ideathonId || null, // 🆕 JWT'den ideathonId
    };
  } catch {
    return null;
  }
}
