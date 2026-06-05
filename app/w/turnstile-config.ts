export const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";

export function getTurnstileSiteKey() {
  if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  }

  return process.env.NODE_ENV === "production" ? "" : TURNSTILE_TEST_SITE_KEY;
}
