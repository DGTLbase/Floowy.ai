import { useState } from "react";

export function useAdminToken() {
  const [hasAdminToken] = useState(() => {
    try {
      return Boolean(localStorage.getItem("admin_token"));
    } catch {
      return false;
    }
  });

  return hasAdminToken;
}
