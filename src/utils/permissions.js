const getStoredUser = () => {
  try {
    const sessionUser = sessionStorage.getItem("currentUser");
    if (sessionUser) return JSON.parse(sessionUser);
  } catch {
    // Ignore malformed session data and fall through to other stores.
  }

  try {
    const localUser = localStorage.getItem("currentUser");
    if (localUser) return JSON.parse(localUser);
  } catch {
    // Ignore malformed local data.
  }

  return null;
};

export const getCurrentUserRole = () => {
  const role = String(getStoredUser()?.role || "staff").trim().toLowerCase();
  return role || "staff";
};

export const isAdminRole = () => getCurrentUserRole() === "admin";

export const requireAdminRole = (actionLabel = "this action") => {
  if (!isAdminRole()) {
    throw new Error(`Admin access required to ${actionLabel}.`);
  }
};
