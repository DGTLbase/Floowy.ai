// Social Scraper — limited preview access control.
// Only these emails may see the home-page tile and open the tool route.
// Admins are additionally allowed at the page level (see SocialScraper.tsx) so
// they can test from Admin → Tools. Lowercase. Empty the list to make it public.
export const SOCIAL_SCRAPER_ALLOWED_EMAILS = ["jefcgealon@gmail.com", "quintin@dgtlbase.com", "donny@dgtlbase.com"];

export const canAccessSocialScraper = (email?: string | null): boolean =>
  SOCIAL_SCRAPER_ALLOWED_EMAILS.includes((email ?? "").toLowerCase());
