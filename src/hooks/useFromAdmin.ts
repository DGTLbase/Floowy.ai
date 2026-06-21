import { useSearchParams } from "react-router-dom";

/**
 * Returns true if the current tool page was accessed from the admin panel.
 * Used ONLY for navigation (back button destination, sidebar visibility).
 * NOT for business logic like credit checks — use useAdminCheck for that.
 */
export function useFromAdmin(): boolean {
  const [searchParams] = useSearchParams();
  return searchParams.get("from") === "admin";
}
