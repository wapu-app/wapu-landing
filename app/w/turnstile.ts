const TURNSTILE_TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";
const TURNSTILE_SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type TurnstileValidationResponse = {
  success: boolean;
  "error-codes"?: string[];
};

function getTurnstileSecretKey() {
  if (process.env.TURNSTILE_SECRET_KEY) {
    return process.env.TURNSTILE_SECRET_KEY;
  }

  return process.env.NODE_ENV === "production" ? "" : TURNSTILE_TEST_SECRET_KEY;
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim();
  }

  return request.headers.get("cf-connecting-ip") ?? undefined;
}

export async function verifyTurnstileToken(request: Request, token: FormDataEntryValue | null) {
  const secret = getTurnstileSecretKey();

  if (!secret || typeof token !== "string" || !token.trim()) {
    return false;
  }

  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);

  const clientIp = getClientIp(request);
  if (clientIp) {
    body.append("remoteip", clientIp);
  }

  try {
    const response = await fetch(TURNSTILE_SITEVERIFY_URL, {
      body,
      method: "POST",
    });
    const result = (await response.json()) as TurnstileValidationResponse;

    return response.ok && result.success === true;
  } catch {
    return false;
  }
}
