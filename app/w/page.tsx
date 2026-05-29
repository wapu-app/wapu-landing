import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { getTurnstileSiteKey } from "./turnstile-config";

export const metadata: Metadata = {
  title: "Contacto | Wapu",
  robots: {
    follow: false,
    index: false,
  },
};

export const dynamic = "force-dynamic";

type WhatsAppGatePageProps = {
  searchParams?: Promise<{
    captcha?: string;
  }>;
};

export default async function WhatsAppGatePage({ searchParams }: WhatsAppGatePageProps) {
  const turnstileSiteKey = getTurnstileSiteKey();
  const resolvedSearchParams = await searchParams;
  const hasCaptchaError = resolvedSearchParams?.captcha === "failed";

  return (
    <main className="lat-page wapu-contact-gate min-h-screen overflow-x-hidden bg-[#020202] text-white">
      <Script async defer src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      <div className="lat-grid-bg" />
      <section className="wapu-contact-gate-inner">
        <Link className="lat-brand" href="/">
          <Image src="/wapuLogo.svg" alt="Wapu" width={118} height={34} priority />
          <span>Contacto</span>
        </Link>

        <div className="wapu-contact-gate-copy">
          <p className="lat-section-kicker">Canal oficial</p>
          <h1>Abrir WhatsApp de Wapu.</h1>
          <p>Vas a salir de la landing para iniciar el chat en WhatsApp.</p>
        </div>

        <form action="/w/open" method="post" target="_blank">
          <input
            aria-hidden="true"
            autoComplete="off"
            className="wapu-contact-gate-field"
            name="website"
            tabIndex={-1}
            type="text"
          />
          {turnstileSiteKey ? (
            <div
              className="cf-turnstile wapu-turnstile"
              data-sitekey={turnstileSiteKey}
              data-theme="dark"
            />
          ) : (
            <p className="wapu-captcha-error">
              Falta configurar la proteccion anti-bot. Defini NEXT_PUBLIC_TURNSTILE_SITE_KEY.
            </p>
          )}
          {hasCaptchaError ? (
            <p className="wapu-captcha-error" id="captcha-error">
              La verificacion anti-bot fallo o expiro. Intenta de nuevo.
            </p>
          ) : null}
          <button className="lat-primary-btn" type="submit">
            Abrir WhatsApp
          </button>
        </form>

        <Link className="lat-secondary-btn" href="/#contacto">
          Volver
        </Link>
      </section>
    </main>
  );
}
