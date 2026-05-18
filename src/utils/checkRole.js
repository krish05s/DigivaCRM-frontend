export const checkRole = (allowedRoles = []) => {

  if (typeof window === "undefined") return false;

  const role = localStorage.getItem("role");

  if (!role) return false;

  return allowedRoles
    .map(r => r.toLowerCase())
    .includes(role.toLowerCase());

};