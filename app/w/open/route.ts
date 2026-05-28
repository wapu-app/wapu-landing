import { NextResponse } from "next/server";

const DEFAULT_PHONE_CODES = [58, 57, 62, 54, 54, 55, 57, 53, 59, 53, 61, 58, 53];
const DEFAULT_MESSAGE = "Hola, quiero saber mas sobre Wapu";

function getWhatsAppPhone() {
  const configuredPhone = process.env.WAPU_WHATSAPP_PHONE?.replace(/\D/g, "");

  if (configuredPhone) {
    return configuredPhone;
  }

  return DEFAULT_PHONE_CODES.map((code) => String.fromCharCode(code - 5)).join("");
}

function getWhatsAppUrl() {
  const target = new URL("https://api.whatsapp.com/send");
  target.searchParams.set("phone", getWhatsAppPhone());
  target.searchParams.set("text", process.env.WAPU_WHATSAPP_MESSAGE ?? DEFAULT_MESSAGE);

  return target;
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const formData = contentType.includes("form") ? await request.formData() : null;

  if (formData?.get("website")) {
    return new NextResponse(null, { status: 204 });
  }

  const response = NextResponse.redirect(getWhatsAppUrl(), 303);
  response.headers.set("Cache-Control", "no-store");

  return response;
}

export function GET(request: Request) {
  return NextResponse.redirect(new URL("/w", request.url), 303);
}
