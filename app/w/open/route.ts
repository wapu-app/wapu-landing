import { NextResponse } from "next/server";

const DEFAULT_PHONE_CODES = [58, 57, 62, 54, 54, 55, 57, 53, 59, 53, 61, 58, 53];
const DEFAULT_MESSAGE = "Hola, quiero saber mas sobre Wapu";
const FIELD_LIMITS = {
  email: 120,
  message: 800,
  name: 80,
  subject: 120,
};

function getWhatsAppPhone() {
  const configuredPhone = process.env.WAPU_WHATSAPP_PHONE?.replace(/\D/g, "");

  if (configuredPhone) {
    return configuredPhone;
  }

  return DEFAULT_PHONE_CODES.map((code) => String.fromCharCode(code - 5)).join("");
}

function cleanFormValue(value: FormDataEntryValue | null, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\r\n/g, "\n").trim().slice(0, maxLength);
}

function getContactMessage(formData: FormData) {
  const name = cleanFormValue(formData.get("name"), FIELD_LIMITS.name);
  const email = cleanFormValue(formData.get("email"), FIELD_LIMITS.email);
  const subject = cleanFormValue(formData.get("subject"), FIELD_LIMITS.subject);
  const message = cleanFormValue(formData.get("message"), FIELD_LIMITS.message);

  if (!name && !email && !subject && !message) {
    return null;
  }

  return [
    "Hola, quiero contactar a Wapu desde la landing de Argentina.",
    name ? `Nombre: ${name}` : null,
    email ? `Email: ${email}` : null,
    subject ? `Asunto: ${subject}` : null,
    message ? `Mensaje: ${message}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function getWhatsAppUrl(message?: string | null) {
  const target = new URL("https://api.whatsapp.com/send");
  target.searchParams.set("phone", getWhatsAppPhone());
  target.searchParams.set("text", message ?? process.env.WAPU_WHATSAPP_MESSAGE ?? DEFAULT_MESSAGE);

  return target;
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const formData = contentType.includes("form") ? await request.formData() : null;

  if (formData?.get("website")) {
    return new NextResponse(null, { status: 204 });
  }

  const response = NextResponse.redirect(getWhatsAppUrl(formData ? getContactMessage(formData) : null), 303);
  response.headers.set("Cache-Control", "no-store");

  return response;
}

export function GET(request: Request) {
  return NextResponse.redirect(new URL("/w", request.url), 303);
}
