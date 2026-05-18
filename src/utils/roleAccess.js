
export const hasRoleAccess = (allowedRoles = []) => {
  if (typeof window === "undefined") return false;

  const role = localStorage.getItem("role");

  if (allowedRoles.length === 0) return true;

  return allowedRoles.includes(role);
};